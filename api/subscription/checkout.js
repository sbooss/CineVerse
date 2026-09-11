const Stripe = require('stripe');
const {
    supabase, setCors, handleOptions,
    getToken, verifyToken,
    jsonError, jsonSuccess
} = require('../_lib/security');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const PLANS = {
    monthly: { price: 499, days: 30, name: 'CINE BOSS - 30 Dias' },
    quarterly: { price: 1499, days: 90, name: 'CINE BOSS - 90 Dias' }
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

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: user.email,
            line_items: [{
                price_data: {
                    currency: 'brl',
                    product_data: { name: planInfo.name },
                    unit_amount: planInfo.price
                },
                quantity: 1
            }],
            mode: 'payment',
            success_url: `${siteUrl}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${siteUrl}?payment=cancelled`,
            metadata: { userId: user.id, plan, planDays: String(planInfo.days) }
        });

        await supabase.from('subscriptions').insert({
            id: crypto.randomUUID(),
            user_id: user.id, plan, status: 'pending',
            payment_id: session.payment_intent,
            amount: planInfo.price / 100,
            expires_at: new Date(Date.now() + planInfo.days * 24 * 60 * 60 * 1000).toISOString(),
            stripe_session_id: session.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });

        return jsonSuccess(res, { sessionId: session.id, url: session.url });
    } catch (error) {
        console.error('Checkout session error:', error);
        return jsonError(res, 500, 'Erro ao criar sessao de pagamento');
    }
};
