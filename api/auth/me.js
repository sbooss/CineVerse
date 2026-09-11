const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dofzztjpqedsaazbvzfg.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_kMdmYXAFE_gxGiCZHHwrzQ_E3JlEV1l';
const JWT_SECRET = process.env.JWT_SECRET || 'cineboss_secret_2026';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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

        if (!token) {
            return res.status(401).json({ error: 'Token nao fornecido', loggedIn: false });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        const { data: sessions } = await supabase
            .from('sessions')
            .select('*')
            .eq('token', token)
            .limit(1);

        if (!sessions || sessions.length === 0) {
            return res.status(401).json({ error: 'Sessao expirada', loggedIn: false });
        }

        const { data: users } = await supabase
            .from('users')
            .select('id, name, email, created_at')
            .eq('id', decoded.userId)
            .limit(1);

        const user = users && users.length > 0 ? users[0] : null;

        if (!user) {
            return res.status(401).json({ error: 'Usuario nao encontrado', loggedIn: false });
        }

        const { data: subscriptions } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .gt('expires_at', new Date().toISOString())
            .order('expires_at', { ascending: false })
            .limit(1);

        const subscription = subscriptions && subscriptions.length > 0 ? subscriptions[0] : null;

        return res.status(200).json({
            loggedIn: true,
            user: user,
            subscription: subscription,
            hasSubscription: !!subscription
        });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expirado', loggedIn: false });
        }
        return res.status(401).json({ error: 'Token invalido', loggedIn: false });
    }
};
