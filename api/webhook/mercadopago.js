const {
    supabase, setCors, handleOptions,
    jsonError, jsonSuccess
} = require('../_lib/security');

const MP_TOKEN = process.env.MP_ACCESS_TOKEN || 'APP_USR-5795040715734318-091118-1a87bdaaabaa81fc45f976b9d27be954-3681341897';
const MP_API = 'https://api.mercadopago.com';

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

            const mpRes = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
                headers: { 'Authorization': `Bearer ${MP_TOKEN}` }
            });
            if (!mpRes.ok) return jsonSuccess(res, { received: true });

            const paymentData = await mpRes.json();
            const externalRef = paymentData.external_reference;
            let ref = {};
            try { ref = JSON.parse(externalRef); } catch {}

            const { data: subs } = await supabase.from('subscriptions')
                .select('*').eq('payment_id', String(paymentData.preference_id)).eq('user_id', ref.userId).limit(1);

            let subscription = subs && subs.length > 0 ? subs[0] : null;

            if (!subscription) {
                const { data: allSubs } = await supabase.from('subscriptions')
                    .select('*').eq('mp_preference_id', String(paymentData.preference_id)).limit(1);
                subscription = allSubs && allSubs.length > 0 ? allSubs[0] : null;
            }

            if (!subscription) {
                const { data: byUser } = await supabase.from('subscriptions')
                    .select('*').eq('user_id', ref.userId).eq('status', 'pending')
                    .order('created_at', { ascending: false }).limit(1);
                subscription = byUser && byUser.length > 0 ? byUser[0] : null;
            }

            if (!subscription) return jsonSuccess(res, { received: true, message: 'Subscription not found' });

            if (paymentData.status === 'approved' || paymentData.status === 'pending_payment') {
                const planDays = ref.planDays ? parseInt(ref.planDays) : 30;
                const expiresAt = new Date(Date.now() + planDays * 24 * 60 * 60 * 1000);

                await supabase.from('subscriptions').update({
                    status: 'active',
                    activated_at: new Date().toISOString(),
                    expires_at: expiresAt.toISOString(),
                    updated_at: new Date().toISOString(),
                    payment_id: paymentData.id || String(paymentId),
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
                        payment_id: paymentData.id,
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
