const {
    supabase, setCors, handleOptions,
    getToken, verifyToken,
    checkRateLimit, recordRateLimitAttempt,
    jsonError, jsonSuccess
} = require('../_lib/security');
const { verifyAndActivateUser } = require('../_lib/mpverify');

module.exports = async function handler(req, res) {
    setCors(req, res);
    if (req.method === 'OPTIONS') return handleOptions(res);
    if (req.method !== 'POST') return jsonError(res, 405, 'Method not allowed');

    try {
        const token = getToken(req);
        if (!token) return jsonError(res, 401, 'Login obrigatorio');

        let decoded;
        try { decoded = verifyToken(token); } catch { return jsonError(res, 401, 'Token invalido'); }

        const userId = decoded.userId;

        const rl = await checkRateLimit('verify_' + userId, 10, 60);
        if (rl.blocked) return jsonError(res, 429, 'Muitas verificacoes. Aguarde um minuto.');
        recordRateLimitAttempt('verify_' + userId);

        const { data: users } = await supabase.from('users')
            .select('id, email, name').eq('id', userId).limit(1);
        const user = users && users.length > 0 ? users[0] : null;
        if (!user) return jsonError(res, 401, 'Usuario nao encontrado');

        const r = await verifyAndActivateUser(supabase, user.id, user.email);

        if (r.status === 'activated') {
            return jsonSuccess(res, { verified: true, activated: true, plan: r.plan, expiresAt: r.expiresAt, recovered: !!r.recovered });
        }
        if (r.status === 'error') {
            return jsonError(res, 500, 'Pagamento aprovado mas ativacao falhou: ' + (r.detail || ''));
        }
        return jsonSuccess(res, { verified: true, activated: false, reason: r.status, plan: r.plan || null, expiresAt: r.expiresAt || null });
    } catch (error) {
        console.error('subscription verify error:', error);
        return jsonError(res, 500, 'Erro ao verificar pagamento');
    }
};
