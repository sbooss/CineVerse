const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const {
    supabase, setCors, handleOptions, setAuthCookie,
    sanitizeString, sanitizeEmail, isValidEmail,
    checkRateLimit, recordRateLimitAttempt,
    createSession, jsonError, jsonSuccess
} = require('../_lib/security');

async function sendWelcomeEmail(to, name) {
    try {
        if (!process.env.RESEND_API_KEY) return false;
        const templatePath = path.join(__dirname, '..', '..', 'email-welcome.html');
        let html = fs.readFileSync(templatePath, 'utf8');
        html = html.replace(/\{\{NAME\}\}/g, name);
        html = html.replace(/\{\{SITE_URL\}\}/g, process.env.SITE_URL || 'https://cine-verse-virid-delta.vercel.app');
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: 'CINE BOSS <noreply@cineboss.com.br>', to: [to], subject: 'Bem-vindo ao CINE BOSS', html })
        });
        return res.ok;
    } catch { return false; }
}

module.exports = async function handler(req, res) {
    setCors(req, res);
    if (req.method === 'OPTIONS') return handleOptions(res);
    if (req.method !== 'POST') return jsonError(res, 405, 'Method not allowed');

    try {
        const { name, email, password } = req.body || {};

        const cleanName = sanitizeString(name, 100);
        const cleanEmail = sanitizeEmail(email);

        if (!cleanName || !cleanEmail || !password) return jsonError(res, 400, 'Todos os campos sao obrigatorios');
        if (cleanName.length < 2) return jsonError(res, 400, 'Nome deve ter pelo menos 2 caracteres');
        if (!isValidEmail(cleanEmail)) return jsonError(res, 400, 'Email invalido');
        if (!password || password.length < 6) return jsonError(res, 400, 'Senha deve ter pelo menos 6 caracteres');
        if (password.length > 128) return jsonError(res, 400, 'Senha muito longa');

        const rl = await checkRateLimit(`register:${cleanEmail}`, 3, 60);
        if (rl.blocked) return jsonError(res, 429, 'Muitas tentativas. Tente em 1 hora');

        const { data: existing } = await supabase.from('users').select('id').eq('email', cleanEmail).limit(1);
        if (existing && existing.length > 0) {
            await recordRateLimitAttempt(`register:${cleanEmail}`);
            return jsonError(res, 409, 'Email ja cadastrado');
        }

        const userId = crypto.randomUUID();
        const passwordHash = await bcrypt.hash(password, 12);
        const { error: insertError } = await supabase.from('users').insert({
            id: userId, name: cleanName, email: cleanEmail,
            password_hash: passwordHash,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });
        if (insertError) throw insertError;

        const token = require('jsonwebtoken').sign({ userId, iat: Math.floor(Date.now() / 1000) }, process.env.JWT_SECRET, { expiresIn: '30d' });
        const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || null;
        const ua = req.headers['user-agent'] || null;
        await createSession(userId, token, 30, ip, ua);

        sendWelcomeEmail(cleanEmail, cleanName).catch(() => {});

        setAuthCookie(res, token, 30 * 24 * 60 * 60);
        return jsonSuccess(res, { user: { id: userId, name: cleanName, email: cleanEmail }, token });
    } catch (error) {
        console.error('Register error:', error);
        return jsonError(res, 500, 'Erro ao criar conta');
    }
};
