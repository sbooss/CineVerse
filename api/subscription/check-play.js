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
        if (!token) return res.status(401).json({ canPlay: false, reason: 'not_logged_in', error: 'Login obrigatorio' });

        let decoded;
        try { decoded = verifyToken(token); } catch (err) {
            if (err.name === 'TokenExpiredError') return res.status(401).json({ canPlay: false, reason: 'token_expired', error: 'Token expirado' });
            return res.status(401).json({ canPlay: false, reason: 'invalid_token', error: 'Token invalido' });
        }

        const session = await validateSession(token);
        if (!session) return res.status(401).json({ canPlay: false, reason: 'session_expired', error: 'Sessao expirada' });

        const { data: users } = await supabase.from('users').select('id').eq('id', decoded.userId).limit(1);
        if (!users || users.length === 0) return res.status(401).json({ canPlay: false, reason: 'user_not_found', error: 'Usuario nao encontrado' });

        const { data: subs } = await supabase.from('subscriptions')
            .select('*').eq('user_id', decoded.userId).eq('status', 'active')
            .gt('expires_at', new Date().toISOString())
            .order('expires_at', { ascending: false }).limit(1);
        const subscription = subs && subs.length > 0 ? subs[0] : null;

        if (!subscription) return res.status(403).json({ canPlay: false, reason: 'no_subscription', error: 'Assinatura necessaria', message: 'Voce precisa de uma assinatura ativa para assistir conteudo' });

        return res.status(200).json({ canPlay: true, subscription: { plan: subscription.plan, expires_at: subscription.expires_at } });
    } catch (error) {
        return res.status(401).json({ canPlay: false, reason: 'invalid_token', error: 'Token invalido' });
    }
};
