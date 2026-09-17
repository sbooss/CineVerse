const {
    setCors, handleOptions, clearAuthCookie,
    getToken, destroySession
} = require('../_lib/security');

module.exports = async function handler(req, res) {
    setCors(req, res);
    if (req.method === 'OPTIONS') return handleOptions(res);
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const token = getToken(req);
        if (token) await destroySession(token);
    } catch {}

    clearAuthCookie(res);
    return res.status(200).json({ success: true });
};
