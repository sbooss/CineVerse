/* =====================================================
   CINE BOSS - handlers de autenticacao
   auth/me | auth/login | auth/register | auth/logout | auth/forgot-password
   ===================================================== */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
    supabase, setCors, handleOptions, setAuthCookie, clearAuthCookie,
    getToken, verifyToken, validateSession,
    getActiveSessions, destroySessionById, destroySession,
    sanitizeString, sanitizeEmail, isValidEmail,
    checkRateLimit, recordRateLimitAttempt,
    createSession,
    jsonError, jsonSuccess
} = require('./security');
const welcomeEmailHtml = require('./welcomeEmail');

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'williannunes31994@gmail.com,williannunes21994@gmail.com')
    .split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
const ADMIN_EMAIL = 'williannunes31994@gmail.com';
const isAdminEmail = (email) => !!email && ADMIN_EMAILS.includes(String(email).toLowerCase());

/* ===================== auth/me ===================== */
async function meHandler(req, res) {
    setCors(req, res);
    if (req.method === 'OPTIONS') return handleOptions(res);

    try {
        const token = getToken(req);
        const url = new URL(req.url, 'http://localhost');
        const isStatsRequest = url.searchParams.get('stats') === 'true';

        if (!token) {
            if (req.method === 'GET' && !isStatsRequest) return res.status(200).json({ loggedIn: false });
            return jsonError(res, 401, 'Login obrigatorio');
        }

        let decoded;
        try {
            decoded = verifyToken(token);
        } catch (err) {
            if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expirado', loggedIn: false });
            return res.status(401).json({ error: 'Token invalido', loggedIn: false });
        }

        const session = await validateSession(token);
        if (!session) return res.status(401).json({ error: 'Sessao invalida ou expirada', loggedIn: false });

        const { data: users } = await supabase.from('users')
            .select('id, name, email, created_at')
            .eq('id', decoded.userId)
            .limit(1);
        const user = users && users.length > 0 ? users[0] : null;
        if (!user) return res.status(401).json({ error: 'Usuario nao encontrado', loggedIn: false });

        // Admin stats endpoint
        if (isStatsRequest && isAdminEmail(user.email)) {
            const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true });
            const { data: activeRows } = await supabase.from('subscriptions')
                .select('amount')
                .eq('status', 'active')
                .gt('expires_at', new Date().toISOString());
            const activeSubs = activeRows ? activeRows.length : 0;
            const activeRevenue = activeRows ? activeRows.reduce((sum, s) => sum + (Number(s.amount) || 0), 0) : 0;
            const allSessions = await getActiveSessions(user.id);
            return res.status(200).json({
                totalUsers: totalUsers || 0,
                activeSubs,
                activeSessions: allSessions.length,
                monthlyRevenue: 'R$ ' + activeRevenue.toFixed(2).replace('.', ',')
            });
        }

        // DELETE = logout from a specific device
        if (req.method === 'DELETE') {
            const { deviceId } = req.body || {};
            if (!deviceId) return jsonError(res, 400, 'deviceId obrigatorio');
            const devices = await getActiveSessions(decoded.userId);
            const target = devices.find(d => d.id === deviceId);
            if (!target) return jsonError(res, 404, 'Dispositivo nao encontrado');
            await destroySessionById(deviceId);
            return res.status(200).json({ success: true, message: 'Dispositivo removido' });
        }

        if (req.method !== 'GET') return jsonError(res, 405, 'Method not allowed');

        const { data: subs } = await supabase.from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .gt('expires_at', new Date().toISOString())
            .order('expires_at', { ascending: false })
            .limit(1);
        const subscription = subs && subs.length > 0 ? subs[0] : null;

        const activeSessions = await getActiveSessions(user.id);

        return res.status(200).json({
            loggedIn: true,
            user,
            subscription,
            hasSubscription: !!subscription,
            isAdmin: isAdminEmail(user.email),
            devices: activeSessions.map(s => ({
                id: s.id,
                name: s.device_name || 'Dispositivo',
                os: s.device_os || '',
                browser: s.device_browser || '',
                lastAccess: s.created_at
            }))
        });
    } catch (error) {
        return res.status(401).json({ error: 'Token invalido', loggedIn: false });
    }
}

/* ===================== auth/login ===================== */
async function loginHandler(req, res) {
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
            isAdmin: user.email === ADMIN_EMAIL,
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
}

/* ===================== auth/register ===================== */
async function sendWelcomeEmail(to, name) {
    try {
        if (!process.env.RESEND_API_KEY) return false;
        let html = welcomeEmailHtml;
        html = html.replace(/\{\{NAME\}\}/g, name);
        html = html.replace(/\{\{SITE_URL\}\}/g, process.env.SITE_URL || 'https://cineboss.online');
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: 'CINE BOSS <noreply@cineboss.com.br>', to: [to], subject: 'Bem-vindo ao CINE BOSS', html })
        });
        return res.ok;
    } catch { return false; }
}

async function registerHandler(req, res) {
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

        const token = jwt.sign({ userId, iat: Math.floor(Date.now() / 1000) }, process.env.JWT_SECRET, { expiresIn: '30d' });
        const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || null;
        const ua = req.headers['user-agent'] || null;
        await createSession(userId, token, 30, ip, ua);

        sendWelcomeEmail(cleanEmail, cleanName).catch(() => {});

        setAuthCookie(res, token, 30 * 24 * 60 * 60);
        return jsonSuccess(res, { user: { id: userId, name: cleanName, email: cleanEmail } });
    } catch (error) {
        console.error('Register error:', error);
        return jsonError(res, 500, 'Erro ao criar conta');
    }
}

/* ===================== auth/logout ===================== */
async function logoutHandler(req, res) {
    setCors(req, res);
    if (req.method === 'OPTIONS') return handleOptions(res);
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const token = getToken(req);
        if (token) await destroySession(token);
    } catch {}

    clearAuthCookie(res);
    return res.status(200).json({ success: true });
}

/* ===================== auth/forgot-password ===================== */
async function forgotPasswordHandler(req, res) {
    setCors(req, res);
    if (req.method === 'OPTIONS') return handleOptions(res);
    if (req.method !== 'POST') return jsonError(res, 405, 'Method not allowed');

    try {
        const { email } = req.body || {};
        if (!email) return jsonError(res, 400, 'Email obrigatorio');

        const normalizedEmail = email.toLowerCase().trim();

        const { data: user } = await supabase
            .from('users')
            .select('id, email')
            .eq('email', normalizedEmail)
            .single();

        if (!user) return jsonSuccess(res, { message: 'Se o email estiver cadastrado, voce recebera um link de redefinicao.' });

        const resetToken = require('crypto').randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();

        const { error } = await supabase.from('password_resets').insert({
            user_id: user.id,
            token: resetToken,
            expires_at: expires,
            created_at: new Date().toISOString()
        });

        if (error) console.error('Password reset insert error:', error);

        return jsonSuccess(res, { message: 'Se o email estiver cadastrado, voce recebera um link de redefinicao.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        return jsonSuccess(res, { message: 'Se o email estiver cadastrado, voce recebera um link de redefinicao.' });
    }
}

module.exports = { meHandler, loginHandler, registerHandler, logoutHandler, forgotPasswordHandler };
