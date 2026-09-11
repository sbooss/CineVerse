const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const PLANS = { monthly: { days: 30 }, quarterly: { days: 90 } };

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
        const body = await getRawBody(req);
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).json({ error: 'Webhook signature invalid' });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const { userId, plan, planDays } = session.metadata;

        if (userId && plan) {
            const expiresAt = new Date(Date.now() + parseInt(planDays) * 24 * 60 * 60 * 1000);

            await supabase.from('subscriptions')
                .update({
                    status: 'active',
                    activated_at: new Date().toISOString(),
                    expires_at: expiresAt.toISOString(),
                    stripe_payment_intent: session.payment_intent,
                    updated_at: new Date().toISOString()
                })
                .eq('stripe_session_id', session.id);

            if (session.payment_intent) {
                await supabase.from('payments')
                    .update({
                        status: 'completed',
                        stripe_payment_intent: session.payment_intent,
                        paid_at: new Date().toISOString()
                    })
                    .eq('id', session.payment_intent);
            }

            console.log(`Payment confirmed for user ${userId}, plan ${plan}, expires ${expiresAt.toISOString()}`);
        }
    }

    return res.status(200).json({ received: true });
};

function getRawBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}
