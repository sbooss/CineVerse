const mercadopago = require('mercadopago');
const {
    supabase, setCors, handleOptions,
    getToken, verifyToken, isValidUUID,
    jsonError, jsonSuccess
} = require('../_lib/security');

mercadopago.configure({
    access_token: process.env.MP_ACCESS_TOKEN || 'APP_USR-5795040715734318-091118-1a87bdaaabaa81fc45f976b9d27be954-3681341897'
});

const PLANS = { monthly: { days: 30 }, quarterly: { days: 90 } };

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
        const planInfo = PLANS[subscription.plan] || PLANS.monthly;

        if (subscription.mp_preference_id) {
            try {
                const mpResponse = await mercadopago.preferences.get(subscription.mp_preference_id);
                const mpData = mpResponse.body;
                if (mpData.status === 'approved' || mpData.status === 'pending_payment') {
                    const planDays = planInfo.days;
                    const expiresAt = new Date(Date.now() + planDays * 24 * 60 * 60 * 1000);
                    await supabase.from('subscriptions').update({
                        status: 'active', activated_at: new Date().toISOString(),
                        expires_at: expiresAt.toISOString(), updated_at: new Date().toISOString(),
                        payment_id: mpData.id || subscription.payment_id,
                        mp_payment_id: mpData.id
                    }).eq('id', subscription_id);

                    if (mpData.status === 'approved') {
                        await supabase.from('payments').upsert({
                            id: crypto.randomUUID(),
                            subscription_id: subscription_id,
                            user_id: decoded.userId,
                            amount: subscription.amount,
                            status: 'completed',
                            provider: 'mercadopago',
                            payment_id: mpData.id,
                            paid_at: new Date().toISOString(),
                            created_at: new Date().toISOString()
                        });
                    }
                }
            } catch { /* fallback below */ }
        }

        const expiresAt = new Date(Date.now() + planInfo.days * 24 * 60 * 60 * 1000);
        await supabase.from('subscriptions').update({
            status: 'active', activated_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(), updated_at: new Date().toISOString()
        }).eq('id', subscription_id);

        if (subscription.payment_id) {
            await supabase.from('payments').update({
                status: 'completed', paid_at: new Date().toISOString()
            }).eq('id', subscription.payment_id);
        }

        return jsonSuccess(res, {
            message: 'Pagamento confirmado! Assinatura ativa.',
            subscription: { id: subscription_id, plan: subscription.plan, status: 'active', expires_at: expiresAt.toISOString() }
        });
    } catch (error) {
        console.error('Simulate payment error:', error);
        return jsonError(res, 500, 'Erro ao processar pagamento');
    }
};
