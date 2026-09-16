const {
    supabase, setCors, handleOptions,
    getToken, verifyToken,
    jsonError, jsonSuccess
} = require('../_lib/security');

const MP_TOKEN = process.env.MP_ACCESS_TOKEN || 'APP_USR-5795040715734318-091118-1a87bdaaabaa81fc45f976b9d27be954-3681341897';
const MP_API = 'https://api.mercadopago.com';

const PLANS = {
    monthly: { price: 6.99, days: 30, name: 'CINE BOSS - 30 Dias', unit: 6.99 },
    quarterly: { price: 15.99, days: 90, name: 'CINE BOSS - 90 Dias', unit: 15.99 }
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
        const siteUrl = process.env.SITE_URL || 'https://cine-boss-80xzp7o6p-william-ns-projects-ffa32c68.vercel.app';

        const preferenceBody = {
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

        const mpRes = await fetch(`${MP_API}/checkout/preferences`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MP_TOKEN}`
            },
            body: JSON.stringify(preferenceBody)
        });

        if (!mpRes.ok) {
            const errText = await mpRes.text();
            console.error('MP API error:', mpRes.status, errText);
            return jsonError(res, 500, 'Erro ao criar preferencia no Mercado Pago');
        }

        const mpData = await mpRes.json();
        const initPoint = mpData.init_point;
        const preferenceId = mpData.id;

        if (!initPoint) {
            console.error('MP no init_point:', JSON.stringify(mpData));
            return jsonError(res, 500, 'Mercado Pago nao retornou link de pagamento');
        }

        const subId = crypto.randomUUID();
        const { error: subErr } = await supabase.from('subscriptions').insert({
            id: subId,
            user_id: user.id, plan, status: 'pending',
            payment_id: String(preferenceId),
            amount: planInfo.price,
            expires_at: new Date(Date.now() + planInfo.days * 24 * 60 * 60 * 1000).toISOString(),
            mp_preference_id: String(preferenceId),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });

        if (subErr) console.error('Sub insert error:', subErr);

        return jsonSuccess(res, { url: initPoint, preferenceId, subscriptionId: subId });
    } catch (error) {
        console.error('Mercado Pago checkout error:', error);
        return jsonError(res, 500, 'Erro ao criar pagamento via Mercado Pago');
    }
};
