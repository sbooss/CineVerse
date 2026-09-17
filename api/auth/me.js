const {
    supabase, setCors, handleOptions,
    getToken, verifyToken, validateSession,
    getActiveSessions, destroySessionById,
    jsonError
} = require('../_lib/security');

const ADMIN_EMAIL = 'williannunes31994@gmail.com';

module.exports = async function handler(req, res) {
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
        if (isStatsRequest && user.email === ADMIN_EMAIL) {
            const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true });
            const { count: activeSubs } = await supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active').gt('expires_at', new Date().toISOString());
            const allSessions = await getActiveSessions(user.id);
            return res.status(200).json({
                totalUsers: totalUsers || 0,
                activeSubs: activeSubs || 0,
                activeSessions: allSessions.length,
                monthlyRevenue: 'R$ ' + ((activeSubs || 0) * 6.99).toFixed(2).replace('.', ',')
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
};
