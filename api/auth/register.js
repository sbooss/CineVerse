const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomUUID: uuidv4 } = require('crypto');
const fs = require('fs');
const path = require('path');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const JWT_SECRET = process.env.JWT_SECRET;

async function sendWelcomeEmail(to, name) {
    try {
        const templatePath = path.join(__dirname, '..', '..', 'email-welcome.html');
        let html = fs.readFileSync(templatePath, 'utf8');
        html = html.replace(/\{\{NAME\}\}/g, name);
        html = html.replace(/\{\{SITE_URL\}\}/g, process.env.SITE_URL || 'https://cine-verse-virid-delta.vercel.app');

        if (process.env.RESEND_API_KEY) {
            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: 'CINE BOSS <noreply@cineboss.com.br>',
                    to: [to],
                    subject: 'Bem-vindo ao CINE BOSS',
                    html
                })
            });
            return res.ok;
        }
        return false;
    } catch (err) {
        console.error('Email send error (non-critical):', err.message);
        return false;
    }
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) return res.status(400).json({ error: 'Todos os campos sao obrigatorios' });
        if (name.trim().length < 2) return res.status(400).json({ error: 'Nome deve ter pelo menos 2 caracteres' });
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Email invalido' });
        if (!password || password.length < 6) return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });

        const { data: existing } = await supabase.from('users').select('id').eq('email', email.toLowerCase()).limit(1);
        if (existing && existing.length > 0) return res.status(409).json({ error: 'Email ja cadastrado' });

        const userId = uuidv4();
        const passwordHash = await bcrypt.hash(password, 12);
        const { error: insertError } = await supabase.from('users').insert({
            id: userId, name: name.trim(), email: email.toLowerCase(),
            password_hash: passwordHash, created_at: new Date().toISOString(), updated_at: new Date().toISOString()
        });
        if (insertError) throw insertError;

        const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
        await supabase.from('sessions').insert({
            id: uuidv4(), user_id: userId, token,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });

        sendWelcomeEmail(email.toLowerCase(), name.trim()).catch(() => {});

        res.setHeader('Set-Cookie', `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`);
        return res.status(200).json({ success: true, user: { id: userId, name: name.trim(), email: email.toLowerCase() }, token });
    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ error: 'Erro ao criar conta' });
    }
};
