const {
    supabase, setCors, handleOptions,
    getToken, verifyToken, isValidUUID,
    jsonError, jsonSuccess
} = require('../_lib/security');

const PLANS = { monthly: { price: 6.99, days: 30 }, quarterly: { price: 15.99, days: 90 } };

module.exports = async function handler(req, res) {
    setCors(req, res);
    if (req.method === 'OPTIONS') return handleOptions(res);
    if (req.method !== 'POST') return jsonError(res, 405, 'Method not allowed');

    try {
        const token = getToken(req);
        if (!token) return jsonError(res, 401, 'Login obrigatorio');

        let decoded;
        try { decoded = verifyToken(token); } catch { return jsonError(res, 401, 'Token invalido'); }

        const { plan } = req.body || {};
        if (!plan || !PLANS[plan]) return jsonError(res, 400, 'Plano invalido');

        const planInfo = PLANS[plan];
        const expiresAt = new Date(Date.now() + planInfo.days * 24 * 60 * 60 * 1000);

        const { data: existing } = await supabase.from('subscriptions')
            .select('id').eq('user_id', decoded.userId).eq('status', 'active')
            .gt('expires_at', new Date().toISOString()).limit(1);
        if (existing && existing.length > 0) return jsonError(res, 400, 'Voce ja possui assinatura ativa');

        const subscriptionId = crypto.randomUUID();
        const paymentId = crypto.randomUUID();

        const { error: subError } = await supabase.from('subscriptions').insert({
            id: subscriptionId, user_id: decoded.userId, plan, status: 'pending',
            payment_id: paymentId, amount: planInfo.price,
            expires_at: expiresAt.toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });
        if (subError) throw subError;

        await supabase.from('payments').insert({
            id: paymentId, subscription_id: subscriptionId,
            user_id: decoded.userId, amount: planInfo.price,
            status: 'pending', created_at: new Date().toISOString()
        });

        return jsonSuccess(res, {
            subscription_id: subscriptionId, payment_id: paymentId,
            plan, amount: planInfo.price, expires_at: expiresAt.toISOString()
        });
    } catch (error) {
        console.error('Create subscription error:', error);
        return jsonError(res, 500, 'Erro ao criar assinatura');
    }
};
