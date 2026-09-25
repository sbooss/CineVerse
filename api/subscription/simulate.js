const {
    supabase, setCors, handleOptions,
    getToken, verifyToken, isValidUUID,
    jsonError, jsonSuccess
} = require('../_lib/security');

module.exports = async function handler(req, res) {
    setCors(req, res);
    if (req.method === 'OPTIONS') return handleOptions(res);
    if (req.method !== 'POST') return jsonError(res, 405, 'Method not allowed');

    try {
        const token = getToken(req);
        if (!token) return jsonError(res, 401, 'Login obrigatorio');

        let decoded;
        try { decoded = verifyToken(token); } catch { return jsonError(res, 401, 'Token invalido'); }

        const { subscription_id } = req.body || {};
        if (!subscription_id || !isValidUUID(subscription_id)) return jsonError(res, 400, 'ID da assinatura invalido');

        const { data: subs } = await supabase.from('subscriptions')
            .select('*').eq('id', subscription_id).eq('user_id', decoded.userId).limit(1);
        if (!subs || subs.length === 0) return jsonError(res, 404, 'Assinatura nao encontrada');

        const subscription = subs[0];

        if (subscription.status === 'active') {
            return jsonSuccess(res, {
                message: 'Assinatura ja ativa.',
                subscription: { id: subscription_id, plan: subscription.plan, status: 'active', expires_at: subscription.expires_at }
            });
        }

        return jsonError(res, 400, 'Pagamento ainda nao confirmado. Assim que o Mercado Pago confirmar, seu acesso sera liberado automaticamente.');
    } catch (error) {
        console.error('Simulate payment error:', error);
        return jsonError(res, 500, 'Erro ao processar pagamento');
    }
};
