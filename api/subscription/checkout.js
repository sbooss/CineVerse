const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const Stripe = require('stripe');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const JWT_SECRET = process.env.JWT_SECRET;
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const PLANS = {
    monthly: { price: 499, days: 30, name: 'CINE BOSS - 30 Dias' },
    quarterly: { price: 1499, days: 90, name: 'CINE BOSS - 90 Dias' }
};

function getToken(req) {
    const cookie = req.headers.cookie || '';
    const match = cookie.match(/token=([^;]+)/);
    if (match) return match[1];
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
    return null;
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const token = getToken(req);
        if (!token) return res.status(401).json({ error: 'Login obrigatorio' });
        const decoded = jwt.verify(token, JWT_SECRET);

        const { data: users } = await supabase.from('users').select('id, email, name').eq('id', decoded.userId).limit(1);
        const user = users && users.length > 0 ? users[0] : null;
        if (!user) return res.status(401).json({ error: 'Usuario nao encontrado' });

        const { plan } = req.body;
        if (!plan || !PLANS[plan]) return res.status(400).json({ error: 'Plano invalido' });

        const { data: existing } = await supabase.from('subscriptions').select('id').eq('user_id', user.id).eq('status', 'active').gt('expires_at', new Date().toISOString()).limit(1);
        if (existing && existing.length > 0) return res.status(400).json({ error: 'Voce ja possui assinatura ativa' });

        const planInfo = PLANS[plan];

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
            success_url: `${req.headers.origin || 'https://cine-verse-virid-delta.vercel.app'}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin || 'https://cine-verse-virid-delta.vercel.app'}?payment=cancelled`,
            metadata: { userId: user.id, plan, planDays: planInfo.days }
        });

        await supabase.from('subscriptions').insert({
            id: session.metadata.subscription_id || session.id,
            user_id: user.id,
            plan,
            status: 'pending',
            payment_id: session.payment_intent,
            amount: planInfo.price / 100,
            expires_at: new Date(Date.now() + planInfo.days * 24 * 60 * 60 * 1000).toISOString(),
            stripe_session_id: session.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });

        return res.status(200).json({ success: true, sessionId: session.id, url: session.url });
    } catch (error) {
        console.error('Checkout session error:', error);
        return res.status(500).json({ error: 'Erro ao criar sessao de pagamento' });
    }
};
