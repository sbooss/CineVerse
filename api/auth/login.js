const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
    supabase, setCors, handleOptions, setAuthCookie,
    sanitizeEmail, isValidEmail,
    checkRateLimit, recordRateLimitAttempt,
    createSession, getActiveSessions, destroySessionById,
    jsonError, jsonSuccess
} = require('../_lib/security');

module.exports = async function handler(req, res) {
    setCors(req, res);
    if (req.method === 'OPTIONS') return handleOptions(res);
    if (req.method !== 'POST') return jsonError(res, 405, 'Method not allowed');

    try {
        const { email, password, remember } = req.body || {};
        const cleanEmail = sanitizeEmail(email);

        if (!cleanEmail || !password) return jsonError(res, 400, 'Email e senha sao obrigatorios');
        if (!isValidEmail(cleanEmail)) return jsonError(res, 400, 'Email invalido');

        const rl = await checkRateLimit(`login:${cleanEmail}`, 5, 15);
        if (rl.blocked) return jsonError(res, 429, 'Muitas tentativas. Tente em 15 minutos');

        const { data: users } = await supabase.from('users').select('*').eq('email', cleanEmail).limit(1);
        const user = users && users.length > 0 ? users[0] : null;

        if (!user) {
            await recordRateLimitAttempt(`login:${cleanEmail}`);
            return jsonError(res, 401, 'Email ou senha invalidos');
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            await recordRateLimitAttempt(`login:${cleanEmail}`);
            return jsonError(res, 401, 'Email ou senha invalidos');
        }

        const expiryDays = remember ? 90 : 30;
        const token = jwt.sign(
            { userId: user.id, iat: Math.floor(Date.now() / 1000) },
            process.env.JWT_SECRET,
            { expiresIn: `${expiryDays}d` }
        );

        const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || null;
        const ua = req.headers['user-agent'] || null;
        await createSession(user.id, token, expiryDays, ip, ua);

        await supabase.from('sessions')
            .delete()
            .eq('user_id', user.id)
            .lt('expires_at', new Date().toISOString());

        const { data: subs } = await supabase.from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .gt('expires_at', new Date().toISOString())
            .order('expires_at', { ascending: false })
            .limit(1);
        const subscription = subs && subs.length > 0 ? subs[0] : null;

        setAuthCookie(res, token, expiryDays * 24 * 60 * 60);

        const activeSessions = await getActiveSessions(user.id);

        return jsonSuccess(res, {
            user: { id: user.id, name: user.name, email: user.email, created_at: user.created_at },
            subscription,
            devices: activeSessions.map(s => ({
                id: s.id,
                name: s.device_name || 'Dispositivo',
                os: s.device_os || '',
                browser: s.device_browser || '',
                lastAccess: s.created_at
            }))
        });
    } catch (error) {
        console.error('Login error:', error);
        return jsonError(res, 500, 'Erro ao fazer login');
    }
};
