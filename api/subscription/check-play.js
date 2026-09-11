const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const JWT_SECRET = process.env.JWT_SECRET;

function getToken(req) {
    const cookie = req.headers.cookie || '';
    const match = cookie.match(/token=([^;]+)/);
    if (match) return match[1];
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
    return null;
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const token = getToken(req);
        if (!token) return res.status(401).json({ canPlay: false, reason: 'not_logged_in', error: 'Login obrigatorio' });

        const decoded = jwt.verify(token, JWT_SECRET);
        const { data: users } = await supabase.from('users').select('id').eq('id', decoded.userId).limit(1);
        if (!users || users.length === 0) return res.status(401).json({ canPlay: false, reason: 'user_not_found', error: 'Usuario nao encontrado' });

        const { data: subs } = await supabase.from('subscriptions').select('*').eq('user_id', decoded.userId).eq('status', 'active').gt('expires_at', new Date().toISOString()).order('expires_at', { ascending: false }).limit(1);
        const subscription = subs && subs.length > 0 ? subs[0] : null;

        if (!subscription) return res.status(403).json({ canPlay: false, reason: 'no_subscription', error: 'Assinatura necessaria', message: 'Voce precisa de uma assinatura ativa para assistir conteudo' });

        return res.status(200).json({ canPlay: true, subscription: { plan: subscription.plan, expires_at: subscription.expires_at } });
    } catch (error) {
        if (error.name === 'TokenExpiredError') return res.status(401).json({ canPlay: false, reason: 'token_expired', error: 'Token expirado' });
        return res.status(401).json({ canPlay: false, reason: 'invalid_token', error: 'Token invalido' });
    }
};
