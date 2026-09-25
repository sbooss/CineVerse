const {
    supabase, setCors, handleOptions,
    getToken, verifyToken, validateSession,
    destroySessionById,
    checkRateLimit, recordRateLimitAttempt,
    jsonError
} = require('../_lib/security');

const ADMIN_EMAIL = 'williannunes31994@gmail.com';

async function requireAdmin(req, res) {
    const token = getToken(req);
    if (!token) {
        jsonError(res, 401, 'Login obrigatorio');
        return null;
    }
    let decoded;
    try {
        decoded = verifyToken(token);
    } catch (err) {
        jsonError(res, 401, 'Token invalido');
        return null;
    }
    const session = await validateSession(token);
    if (!session) {
        jsonError(res, 401, 'Sessao invalida');
        return null;
    }
    const { data: users } = await supabase.from('users')
        .select('id, name, email')
        .eq('id', decoded.userId)
        .limit(1);
    const user = users && users.length > 0 ? users[0] : null;
    if (!user || user.email !== ADMIN_EMAIL) {
        jsonError(res, 403, 'Acesso negado');
        return null;
    }
    return { decoded, user };
}

function dayKey(iso) {
    return String(iso).substring(0, 10);
}

function lastNDays(n) {
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        out.push(d.toISOString().substring(0, 10));
    }
    return out;
}

module.exports = async function handler(req, res) {
    setCors(req, res);
    if (req.method === 'OPTIONS') return handleOptions(res);

    try {
        const auth = await requireAdmin(req, res);
        if (!auth) return;

        res.setHeader('Cache-Control', 'no-store');

        /* Rate limit anti-forca-bruta: 60 req/min por admin */
        const rlKey = 'admin_ovw_' + auth.user.id;
        const rl = await checkRateLimit(rlKey, 60, 1);
        if (rl.blocked) return jsonError(res, 429, 'Muitas requisicoes. Tente novamente em instantes.');
        recordRateLimitAttempt(rlKey);

        /* DELETE = encerrar uma sessao remota */
        if (req.method === 'DELETE') {
            const { sessionId } = req.body || {};
            if (!sessionId) return jsonError(res, 400, 'sessionId obrigatorio');
            await destroySessionById(sessionId);
            return res.status(200).json({ success: true });
        }

        if (req.method !== 'GET') return jsonError(res, 405, 'Method not allowed');

        const now = new Date().toISOString();
        const d30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const [usersRes, usersTotalRes, users30Res, subsRes, sessionsRes] = await Promise.all([
            supabase.from('users').select('id, name, email, created_at')
                .order('created_at', { ascending: false }).limit(500),
            supabase.from('users').select('*', { count: 'exact', head: true }),
            supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', d30),
            supabase.from('subscriptions')
                .select('id, user_id, plan, status, amount, expires_at, created_at')
                .order('created_at', { ascending: false }).limit(1000),
            supabase.from('sessions')
                .select('id, user_id, device_name, device_os, device_browser, ip_address, created_at, expires_at')
                .gt('expires_at', now)
                .order('created_at', { ascending: false }).limit(500)
        ]);

        const users = usersRes.data || [];
        const subs = subsRes.data || [];
        const sessions = (sessionsRes && sessionsRes.data) || [];
        const totalUsers = usersTotalRes.count || 0;
        const newUsers30d = users30Res.count || 0;

        const activeSubs = subs.filter(s => s.status === 'active' && s.expires_at && s.expires_at > now);
        const newSubs30d = subs.filter(s => s.created_at && s.created_at >= d30);
        const revenueActive = activeSubs.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
        const revenue30d = newSubs30d.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
        const conversion = totalUsers > 0 ? (activeSubs.length / totalUsers) * 100 : 0;

        /* assinatura por usuario (mais recente) */
        const subByUser = {};
        subs.forEach(s => {
            if (!subByUser[s.user_id]) subByUser[s.user_id] = s;
        });
        const sessionsByUser = {};
        sessions.forEach(s => { sessionsByUser[s.user_id] = (sessionsByUser[s.user_id] || 0) + 1; });
        const lastAccessByUser = {};
        sessions.forEach(s => {
            if (!lastAccessByUser[s.user_id] || s.created_at > lastAccessByUser[s.user_id]) {
                lastAccessByUser[s.user_id] = s.created_at;
            }
        });

        const userRows = users.map(u => {
            const sub = subByUser[u.id] || null;
            let status = 'none';
            if (sub && sub.status === 'active' && sub.expires_at && sub.expires_at > now) status = 'active';
            else if (sub && sub.expires_at && sub.expires_at <= now) status = 'expired';
            else if (sub && sub.status && sub.status !== 'active') status = sub.status;
            return {
                id: u.id,
                name: u.name || '',
                email: u.email || '',
                createdAt: u.created_at,
                status,
                plan: sub ? sub.plan : null,
                expiresAt: sub ? sub.expires_at : null,
                sessionCount: sessionsByUser[u.id] || 0,
                lastAccess: lastAccessByUser[u.id] || null
            };
        });

        const userMap = {};
        users.forEach(u => { userMap[u.id] = u; });
        const sessionRows = sessions.map(s => {
            const u = userMap[s.user_id] || null;
            return {
                id: s.id,
                userId: s.user_id,
                userName: u ? (u.name || u.email) : 'Desconhecido',
                userEmail: u ? u.email : '',
                device: s.device_name || 'Desconhecido',
                os: s.device_os || '',
                browser: s.device_browser || '',
                ip: s.ip_address || '',
                createdAt: s.created_at
            };
        });

        /* series dos ultimos 30 dias */
        const labels = lastNDays(30);
        const usersByDay = {}; const subsByDay = {};
        labels.forEach(l => { usersByDay[l] = 0; subsByDay[l] = 0; });
        users.forEach(u => { const k = dayKey(u.created_at); if (usersByDay[k] !== undefined) usersByDay[k]++; });
        subs.forEach(s => { const k = dayKey(s.created_at); if (subsByDay[k] !== undefined) subsByDay[k]++; });

        /* distribuicoes para o dashboard */
        const planCounts = { monthly: 0, quarterly: 0 };
        activeSubs.forEach(s => { if (planCounts[s.plan] !== undefined) planCounts[s.plan]++; });
        let noPlanUsers = 0;
        userRows.forEach(u => { if (u.status === 'none') noPlanUsers++; });
        const deviceCounts = {};
        sessions.forEach(s => {
            const dk = s.device_name || 'Desconhecido';
            deviceCounts[dk] = (deviceCounts[dk] || 0) + 1;
        });

        return res.status(200).json({
            kpis: {
                totalUsers,
                newUsers30d,
                activeSubs: activeSubs.length,
                newSubs30d: newSubs30d.length,
                activeSessions: sessions.length,
                revenueActive: Math.round(revenueActive * 100) / 100,
                revenue30d: Math.round(revenue30d * 100) / 100,
                conversion: Math.round(conversion * 10) / 10
            },
            distrib: {
                plans: planCounts,
                noPlanUsers,
                devices: deviceCounts
            },
            series: {
                labels,
                users: labels.map(l => usersByDay[l]),
                subs: labels.map(l => subsByDay[l])
            },
            users: userRows,
            sessions: sessionRows
        });
    } catch (error) {
        console.error('admin overview error:', error);
        return jsonError(res, 500, 'Erro ao carregar dados do painel');
    }
};
