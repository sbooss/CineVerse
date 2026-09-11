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

        const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
        if (existingUser) {
            return res.status(409).json({ error: 'Email ja cadastrado' });
        }

        const userId = uuidv4();
        const passwordHash = await bcrypt.hash(password, 12);

        db.prepare('INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)').run(
            userId,
            name.trim(),
            email.toLowerCase(),
            passwordHash
        );

        const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
        const sessionId = uuidv4();
        
        db.prepare('INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, datetime("now", "+30 days"))').run(
            sessionId,
            userId,
            token
        );

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

        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
        
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
        
        db.prepare('INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, datetime("now", ?))').run(
            sessionId,
            user.id,
            token,
            `+${expiryDays} days`
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: expiryDays * 24 * 60 * 60 * 1000
        });

        const subscription = db.prepare(`
            SELECT * FROM subscriptions 
            WHERE user_id = ? AND status = 'active' AND expires_at > datetime('now')
            ORDER BY expires_at DESC LIMIT 1
        `).get(user.id);

        res.json({
            success: true,
            user: { 
                id: user.id, 
                name: user.name, 
                email: user.email,
                created_at: user.created_at
            },
            subscription: subscription || null,
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
});

router.post('/logout', authMiddleware, (req, res) => {
    try {
        db.prepare('DELETE FROM sessions WHERE token = ?').run(req.token);
        res.clearCookie('token');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao fazer logout' });
    }
});

router.get('/me', authMiddleware, (req, res) => {
    try {
        const subscription = db.prepare(`
            SELECT * FROM subscriptions 
            WHERE user_id = ? AND status = 'active' AND expires_at > datetime('now')
            ORDER BY expires_at DESC LIMIT 1
        `).get(req.user.id);

        const allSubscriptions = db.prepare(`
            SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 5
        `).all(req.user.id);

        res.json({
            user: req.user,
            subscription: subscription || null,
            subscriptions: allSubscriptions
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

        const user = db.prepare('SELECT id, name FROM users WHERE email = ?').get(email.toLowerCase());
        
        if (user) {
            await emailService.sendPasswordReset(email, user.name);
        }

        res.json({ success: true, message: 'Se o email existira, voce recebera as instrucoes' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao processar solicitacao' });
    }
});

module.exports = router;
