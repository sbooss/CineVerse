const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dofzztjpqedsaazbvzfg.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_kMdmYXAFE_gxGiCZHHwrzQ_E3JlEV1l';
const JWT_SECRET = process.env.JWT_SECRET || 'cineboss_secret_2026';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Todos os campos sao obrigatorios' });
        }

        if (name.trim().length < 2) {
            return res.status(400).json({ error: 'Nome deve ter pelo menos 2 caracteres' });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: 'Email invalido' });
        }

        if (!password || password.length < 6) {
            return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
        }

        const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('email', email.toLowerCase())
            .limit(1);

        if (existing && existing.length > 0) {
            return res.status(409).json({ error: 'Email ja cadastrado' });
        }

        const userId = uuidv4();
        const passwordHash = await bcrypt.hash(password, 12);

        const { error: insertError } = await supabase
            .from('users')
            .insert({
                id: userId,
                name: name.trim(),
                email: email.toLowerCase(),
                password_hash: passwordHash,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });

        if (insertError) throw insertError;

        const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
        const sessionId = uuidv4();

        await supabase.from('sessions').insert({
            id: sessionId,
            user_id: userId,
            token: token,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });

        res.setHeader('Set-Cookie', `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`);

        return res.status(200).json({
            success: true,
            user: { id: userId, name: name.trim(), email: email.toLowerCase() },
            token
        });
    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ error: 'Erro ao criar conta' });
    }
};
