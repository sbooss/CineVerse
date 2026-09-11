const {
    supabase, setCors, handleOptions,
    getToken, verifyToken,
    jsonError, jsonSuccess
} = require('../_lib/security');

const mercadopago = require('mercadopago');
mercadopago.configure({
    access_token: process.env.MP_ACCESS_TOKEN || 'APP_USR-5795040715734318-091118-1a87bdaaabaa81fc45f976b9d27be954-3681341897'
});

module.exports = async function handler(req, res) {
    setCors(req, res);
    if (req.method === 'OPTIONS') return handleOptions(res);
    if (req.method !== 'POST') return jsonError(res, 405, 'Method not allowed');

    try {
        const body = req.body;
        const type = body.type || body.action;

        if (type === 'payment') {
            const paymentId = body.data?.id;
            if (!paymentId) return jsonError(res, 400, 'Payment ID missing');

            const mpResponse = await mercadopago.preferences.get(paymentId);
            const paymentData = mpResponse.body;

            const externalRef = paymentData.external_reference;
            let ref = {};
            try { ref = JSON.parse(externalRef); } catch {}

            const { data: subs } = await supabase.from('subscriptions')
                .select('*').eq('payment_id', paymentId).eq('user_id', ref.userId).limit(1);

            if (!subs || subs.length === 0) {
                const { data: allSubs } = await supabase.from('subscriptions')
                    .select('*').eq('mp_preference_id', paymentId).limit(1);
                if (!allSubs || allSubs.length === 0) {
                    return jsonSuccess(res, { received: true, message: 'Subscription not found' });
                }
            }

            const subscription = subs && subs.length > 0 ? subs[0] : allSubs[0];

            if (paymentData.status === 'approved' || paymentData.status === 'pending_payment') {
                const planDays = ref.planDays ? parseInt(ref.planDays) : 30;
                const expiresAt = new Date(Date.now() + planDays * 24 * 60 * 60 * 1000);

                await supabase.from('subscriptions').update({
                    status: 'active',
                    activated_at: new Date().toISOString(),
                    expires_at: expiresAt.toISOString(),
                    updated_at: new Date().toISOString(),
                    payment_id: paymentData.id || paymentId,
                    mp_payment_id: paymentData.id
                }).eq('id', subscription.id);

                if (paymentData.status === 'approved') {
                    await supabase.from('payments').upsert({
                        id: crypto.randomUUID(),
                        subscription_id: subscription.id,
                        user_id: ref.userId,
                        amount: subscription.amount,
                        status: 'completed',
                        provider: 'mercadopago',
                        payment_id: paymentData.id || paymentId,
                        paid_at: new Date().toISOString(),
                        created_at: new Date().toISOString()
                    });
                }
            }
        }

        return jsonSuccess(res, { received: true });
    } catch (error) {
        console.error('Mercado Pago webhook error:', error);
        return jsonError(res, 500, 'Webhook error');
    }
};
