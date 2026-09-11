const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const JWT_SECRET = process.env.JWT_SECRET;
const PLANS = { monthly: { days: 30 }, quarterly: { days: 90 } };

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
        const { subscription_id } = req.body;
        if (!subscription_id) return res.status(400).json({ error: 'ID da assinatura invalido' });

        const { data: subs } = await supabase.from('subscriptions').select('*').eq('id', subscription_id).eq('user_id', decoded.userId).limit(1);
        if (!subs || subs.length === 0) return res.status(404).json({ error: 'Assinatura nao encontrada' });

        const subscription = subs[0];
        const planInfo = PLANS[subscription.plan] || PLANS.monthly;
        const expiresAt = new Date(Date.now() + planInfo.days * 24 * 60 * 60 * 1000);

        await supabase.from('subscriptions').update({ status: 'active', activated_at: new Date().toISOString(), expires_at: expiresAt.toISOString(), updated_at: new Date().toISOString() }).eq('id', subscription_id);
        if (subscription.payment_id) await supabase.from('payments').update({ status: 'completed', paid_at: new Date().toISOString() }).eq('id', subscription.payment_id);

        return res.status(200).json({ success: true, message: 'Pagamento confirmado! Assinatura ativa.', subscription: { id: subscription_id, plan: subscription.plan, status: 'active', expires_at: expiresAt.toISOString() } });
    } catch (error) {
        console.error('Simulate payment error:', error);
        return res.status(500).json({ error: 'Erro ao processar pagamento' });
    }
};
