const {
    supabase, setCors, handleOptions,
    getToken, verifyToken, validateSession,
    jsonError
} = require('../_lib/security');

module.exports = async function handler(req, res) {
    setCors(req, res);
    if (req.method === 'OPTIONS') return handleOptions(res);
    if (req.method !== 'GET') return jsonError(res, 405, 'Method not allowed');

    try {
        const token = getToken(req);
        if (!token) return res.status(401).json({ error: 'Token nao fornecido', loggedIn: false });

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

        const { data: subs } = await supabase.from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .gt('expires_at', new Date().toISOString())
            .order('expires_at', { ascending: false })
            .limit(1);
        const subscription = subs && subs.length > 0 ? subs[0] : null;

        return res.status(200).json({ loggedIn: true, user, subscription, hasSubscription: !!subscription });
    } catch (error) {
        return res.status(401).json({ error: 'Token invalido', loggedIn: false });
    }
};
