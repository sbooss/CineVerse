const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const JWT_SECRET = process.env.JWT_SECRET;

/* ===================== CORS ===================== */
function setCors(req, res) {
    const allowedOrigins = [
        'https://cineboss.vercel.app',
        'https://cineboss-l258p6ylt-william-ns-projects-ffa32c68.vercel.app',
        'http://localhost:3000',
        'http://localhost:8080'
    ];
    const origin = req.headers.origin;
    const allowed = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
    res.setHeader('Access-Control-Allow-Origin', allowed);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
}

function handleOptions(res) {
    return res.status(200).end();
}

/* ===================== COOKIE ===================== */
function setAuthCookie(res, token, maxAgeSeconds) {
    const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
    const parts = [
        `token=${token}`,
        'Path=/',
        'HttpOnly',
        'SameSite=None',
        `Max-Age=${maxAgeSeconds}`
    ];
    if (isProd) parts.push('Secure');
    res.setHeader('Set-Cookie', parts.join('; '));
}

function clearAuthCookie(res) {
    const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
    const parts = ['token=', 'Path=/', 'HttpOnly', 'SameSite=None', 'Max-Age=0'];
    if (isProd) parts.push('Secure');
    res.setHeader('Set-Cookie', parts.join('; '));
}

/* ===================== TOKEN ===================== */
function getToken(req) {
    const cookie = req.headers.cookie || '';
    const match = cookie.match(/token=([^;]+)/);
    if (match) return match[1];
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
    return null;
}

function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}

/* ===================== INPUT SANITIZATION ===================== */
function sanitizeString(str, maxLen) {
    if (typeof str !== 'string') return '';
    let s = str.trim();
    s = s.replace(/[<>]/g, '');
    s = s.replace(/javascript:/gi, '');
    s = s.replace(/on\w+\s*=/gi, '');
    if (maxLen && s.length > maxLen) s = s.substring(0, maxLen);
    return s;
}

function sanitizeEmail(email) {
    if (typeof email !== 'string') return '';
    return email.toLowerCase().trim().substring(0, 254);
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUUID(str) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

/* ===================== RATE LIMITING (Supabase with fallback) ===================== */
const memRateLimits = new Map();

async function checkRateLimit(key, maxAttempts, windowMinutes) {
    try {
        const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
        const { data, error } = await supabase
            .from('rate_limits')
            .select('id')
            .eq('key', key)
            .gte('created_at', windowStart)
            .limit(maxAttempts);
        if (error) throw error;
        const attempts = data ? data.length : 0;
        if (attempts >= maxAttempts) return { blocked: true, remaining: 0 };
        return { blocked: false, remaining: maxAttempts - attempts - 1 };
    } catch {
        const now = Date.now();
        const entry = memRateLimits.get(key) || { count: 0, first: now };
        if (now - entry.first > windowMinutes * 60 * 1000) {
            memRateLimits.set(key, { count: 1, first: now });
            return { blocked: false, remaining: maxAttempts - 1 };
        }
        entry.count++;
        if (entry.count >= maxAttempts) return { blocked: true, remaining: 0 };
        return { blocked: false, remaining: maxAttempts - entry.count };
    }
}

async function recordRateLimitAttempt(key) {
    try {
        await supabase.from('rate_limits').insert({ key, created_at: new Date().toISOString() });
    } catch {
        const entry = memRateLimits.get(key) || { count: 0, first: Date.now() };
        entry.count++;
        memRateLimits.set(key, entry);
    }
}

async function cleanupRateLimits() {
    try {
        const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        await supabase.from('rate_limits').delete().lt('created_at', cutoff);
    } catch {}
}

/* ===================== SESSION AUDIT ===================== */
async function createSession(userId, token, expiryDays, ip, userAgent) {
    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
    const sessionData = {
        id: crypto.randomUUID(),
        user_id: userId,
        token,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
    };
    try {
        await supabase.from('sessions').insert(sessionData);
    } catch {
        try {
            await supabase.from('sessions').insert({
                id: sessionData.id,
                user_id: userId,
                token,
                expires_at: expiresAt.toISOString(),
                created_at: sessionData.created_at
            });
        } catch {
            // Sessions table may not exist - JWT cookie is the real auth
        }
    }
}

async function validateSession(token) {
    try {
        const { data: sessions } = await supabase
            .from('sessions')
            .select('*')
            .eq('token', token)
            .limit(1);

        if (sessions && sessions.length > 0) {
            const session = sessions[0];
            if (new Date(session.expires_at) < new Date()) {
                try { await supabase.from('sessions').delete().eq('id', session.id); } catch {}
                return null;
            }
            return session;
        }
    } catch {
        // Sessions table may not exist - JWT cookie is the real auth
    }

    // Fallback: if sessions table is missing/broken, trust the JWT token itself
    // The JWT was already verified by verifyToken() before this is called
    return { user_id: null, fallback: true };
}

async function destroySession(token) {
    try { await supabase.from('sessions').delete().eq('token', token); } catch {}
}

async function destroyAllUserSessions(userId) {
    try { await supabase.from('sessions').delete().eq('user_id', userId); } catch {}
}

async function cleanupExpiredSessions() {
    await supabase.from('sessions').delete().lt('expires_at', new Date().toISOString());
}

/* ===================== RESPONSE HELPERS ===================== */
function jsonError(res, status, message) {
    return res.status(status).json({ error: message });
}

function jsonSuccess(res, data) {
    return res.status(200).json({ success: true, ...data });
}

module.exports = {
    supabase,
    JWT_SECRET,
    setCors,
    handleOptions,
    setAuthCookie,
    clearAuthCookie,
    getToken,
    verifyToken,
    sanitizeString,
    sanitizeEmail,
    isValidEmail,
    isValidUUID,
    checkRateLimit,
    recordRateLimitAttempt,
    cleanupRateLimits,
    createSession,
    validateSession,
    destroySession,
    destroyAllUserSessions,
    cleanupExpiredSessions,
    jsonError,
    jsonSuccess
};
