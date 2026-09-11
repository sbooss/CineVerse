const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dofzztjpqedsaazbvzfg.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_kMdmYXAFE_gxGiCZHHwrzQ_E3JlEV1l';
const JWT_SECRET = process.env.JWT_SECRET || 'cineboss_secret_2026';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const loginAttempts = new Map();

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { email, password, remember } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email e senha sao obrigatorios' });
        }

        const key = email.toLowerCase();
        const attempts = loginAttempts.get(key) || { count: 0, lastAttempt: 0 };

        if (attempts.count >= 5 && Date.now() - attempts.lastAttempt < 15 * 60 * 1000) {
            const remaining = Math.ceil((15 * 60 * 1000 - (Date.now() - attempts.lastAttempt)) / 60000);
            return res.status(429).json({ error: `Muitas tentativas. Tente em ${remaining} minutos` });
        }

        const { data: users } = await supabase
            .from('users')
            .select('*')
            .eq('email', key)
            .limit(1);

        const user = users && users.length > 0 ? users[0] : null;

        if (!user) {
            loginAttempts.set(key, { count: attempts.count + 1, lastAttempt: Date.now() });
            return res.status(401).json({ error: 'Email ou senha invalidos' });
        }

        const valid = await bcrypt.compare(password, user.password_hash);

        if (!valid) {
            loginAttempts.set(key, { count: attempts.count + 1, lastAttempt: Date.now() });
            return res.status(401).json({ error: 'Email ou senha invalidos' });
        }

        loginAttempts.delete(key);

        const expiryDays = remember ? 90 : 30;
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: `${expiryDays}d` });
        const sessionId = uuidv4();

        await supabase.from('sessions').insert({
            id: sessionId,
            user_id: user.id,
            token: token,
            expires_at: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString()
        });

        const { data: subscriptions } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .gt('expires_at', new Date().toISOString())
            .order('expires_at', { ascending: false })
            .limit(1);

        const subscription = subscriptions && subscriptions.length > 0 ? subscriptions[0] : null;

        res.setHeader('Set-Cookie', `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${expiryDays * 24 * 60 * 60}`);

        return res.status(200).json({
            success: true,
            user: { id: user.id, name: user.name, email: user.email, created_at: user.created_at },
            subscription: subscription,
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Erro ao fazer login' });
    }
};
