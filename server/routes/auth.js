const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');
const emailService = require('../services/email');

const router = express.Router();

const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000;

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
    return password && password.length >= 6;
}

router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Todos os campos sao obrigatorios' });
        }

        if (name.trim().length < 2) {
            return res.status(400).json({ error: 'Nome deve ter pelo menos 2 caracteres' });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ error: 'Email invalido' });
        }

        if (!validatePassword(password)) {
            return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
        }

        const existingUser = await db.query('users', {
            select: 'id',
            filter: `email=eq.${email.toLowerCase()}`
        });

        if (existingUser && existingUser.length > 0) {
            return res.status(409).json({ error: 'Email ja cadastrado' });
        }

        const userId = uuidv4();
        const passwordHash = await bcrypt.hash(password, 12);

        await db.insert('users', {
            id: userId,
            name: name.trim(),
            email: email.toLowerCase(),
            password_hash: passwordHash,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });

        const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
        const sessionId = uuidv4();
        
        await db.insert('sessions', {
            id: sessionId,
            user_id: userId,
            token: token,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });

        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000
        });

        await emailService.sendWelcomeEmail(email, name);

        res.json({
            success: true,
            user: { id: userId, name: name.trim(), email: email.toLowerCase() },
            token
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Erro ao criar conta' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password, remember } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email e senha sao obrigatorios' });
        }

        const attempts = loginAttempts.get(email.toLowerCase()) || { count: 0, lastAttempt: 0 };
        
        if (attempts.count >= MAX_ATTEMPTS && Date.now() - attempts.lastAttempt < LOCKOUT_TIME) {
            const remainingTime = Math.ceil((LOCKOUT_TIME - (Date.now() - attempts.lastAttempt)) / 60000);
            return res.status(429).json({ 
                error: `Muitas tentativas. Tente novamente em ${remainingTime} minutos` 
            });
        }

        const users = await db.query('users', {
            select: '*',
            filter: `email=eq.${email.toLowerCase()}`
        });

        const user = users && users.length > 0 ? users[0] : null;
        
        if (!user) {
            loginAttempts.set(email.toLowerCase(), { 
                count: attempts.count + 1, 
                lastAttempt: Date.now() 
            });
            return res.status(401).json({ error: 'Email ou senha invalidos' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) {
            loginAttempts.set(email.toLowerCase(), { 
                count: attempts.count + 1, 
                lastAttempt: Date.now() 
            });
            return res.status(401).json({ error: 'Email ou senha invalidos' });
        }

        loginAttempts.delete(email.toLowerCase());

        const expiryDays = remember ? 90 : 30;
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: `${expiryDays}d` });
        const sessionId = uuidv4();
        
        await db.insert('sessions', {
            id: sessionId,
            user_id: user.id,
            token: token,
            expires_at: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString()
        });

        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: expiryDays * 24 * 60 * 60 * 1000
        });

        const subscriptions = await db.query('subscriptions', {
            select: '*',
            filter: `user_id=eq.${user.id} AND status=eq.active AND expires_at=gt.${new Date().toISOString()}`,
            order: 'expires_at.desc',
            limit: '1'
        });

        const subscription = subscriptions && subscriptions.length > 0 ? subscriptions[0] : null;

        res.json({
            success: true,
            user: { 
                id: user.id, 
                name: user.name, 
                email: user.email,
                created_at: user.created_at
            },
            subscription: subscription,
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
});

router.post('/logout', authMiddleware, async (req, res) => {
    try {
        await db.delete('sessions', `token=eq.${req.token}`);
        res.clearCookie('token');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao fazer logout' });
    }
});

router.get('/me', authMiddleware, async (req, res) => {
    try {
        const subscriptions = await db.query('subscriptions', {
            select: '*',
            filter: `user_id=eq.${req.user.id} AND status=eq.active AND expires_at=gt.${new Date().toISOString()}`,
            order: 'expires_at.desc',
            limit: '1'
        });

        const subscription = subscriptions && subscriptions.length > 0 ? subscriptions[0] : null;

        const allSubscriptions = await db.query('subscriptions', {
            select: '*',
            filter: `user_id=eq.${req.user.id}`,
            order: 'created_at.desc',
            limit: '5'
        });

        res.json({
            user: req.user,
            subscription: subscription,
            subscriptions: allSubscriptions || []
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar dados' });
    }
});

router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email || !validateEmail(email)) {
            return res.status(400).json({ error: 'Email invalido' });
        }

        const users = await db.query('users', {
            select: 'id, name',
            filter: `email=eq.${email.toLowerCase()}`
        });

        const user = users && users.length > 0 ? users[0] : null;
        
        if (user) {
            await emailService.sendPasswordReset(email, user.name);
        }

        res.json({ success: true, message: 'Se o email existir, voce recebera as instrucoes' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao processar solicitacao' });
    }
});

module.exports = router;
