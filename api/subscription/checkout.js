const mercadopago = require('mercadopago');
const {
    supabase, setCors, handleOptions,
    getToken, verifyToken,
    jsonError, jsonSuccess
} = require('../_lib/security');

mercadopago.configure({
    access_token: process.env.MP_ACCESS_TOKEN || 'APP_USR-5795040715734318-091118-1a87bdaaabaa81fc45f976b9d27be954-3681341897'
});

const PLANS = {
    monthly: { price: 6.99, days: 30, name: 'CINE BOSS - 30 Dias', unit: 699 },
    quarterly: { price: 15.99, days: 90, name: 'CINE BOSS - 90 Dias', unit: 1599 }
};

module.exports = async function handler(req, res) {
    setCors(req, res);
    if (req.method === 'OPTIONS') return handleOptions(res);
    if (req.method !== 'POST') return jsonError(res, 405, 'Method not allowed');

    try {
        const token = getToken(req);
        if (!token) return jsonError(res, 401, 'Login obrigatorio');

        let decoded;
        try { decoded = verifyToken(token); } catch { return jsonError(res, 401, 'Token invalido'); }

        const { data: users } = await supabase.from('users').select('id, email, name').eq('id', decoded.userId).limit(1);
        const user = users && users.length > 0 ? users[0] : null;
        if (!user) return jsonError(res, 401, 'Usuario nao encontrado');

        const { plan } = req.body || {};
        if (!plan || !PLANS[plan]) return jsonError(res, 400, 'Plano invalido');

        const { data: existing } = await supabase.from('subscriptions')
            .select('id').eq('user_id', user.id).eq('status', 'active')
            .gt('expires_at', new Date().toISOString()).limit(1);
        if (existing && existing.length > 0) return jsonError(res, 400, 'Voce ja possui assinatura ativa');

        const planInfo = PLANS[plan];
        const siteUrl = process.env.SITE_URL || 'https://cine-verse-virid-delta.vercel.app';

        const preference = {
            items: [{
                title: planInfo.name,
                quantity: 1,
                unit_price: planInfo.unit
            }],
            payer: {
                email: user.email
            },
            back_urls: {
                success: `${siteUrl}?payment=success`,
                failure: `${siteUrl}?payment=failed`,
                pending: `${siteUrl}?payment=pending`
            },
            auto_return: 'approved',
            payment_methods: {
                excluded_payment_types: [],
                installments: 1
            },
            notification_url: `${siteUrl}/api/webhook/mercadopago`,
            external_reference: JSON.stringify({ userId: user.id, plan, planDays: String(planInfo.days) })
        };

        const mpResponse = await mercadopago.preferences.create(preference);
        const preferenceData = mpResponse.body;
        const initPoint = preferenceData.init_point || preferenceData.response?.init_point;
        const preferenceId = preferenceData.id;

        const { data: subData } = await supabase.from('subscriptions').insert({
            id: crypto.randomUUID(),
            user_id: user.id, plan, status: 'pending',
            payment_id: preferenceId,
            amount: planInfo.price,
            expires_at: new Date(Date.now() + planInfo.days * 24 * 60 * 60 * 1000).toISOString(),
            mp_preference_id: preferenceId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });

        return jsonSuccess(res, { url: initPoint, preferenceId, subscriptionId: subData && subData[0] ? subData[0].id : null });
    } catch (error) {
        console.error('Mercado Pago checkout error:', error);
        return jsonError(res, 500, 'Erro ao criar pagamento via Mercado Pago');
    }
};
