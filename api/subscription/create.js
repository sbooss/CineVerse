const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dofzztjpqedsaazbvzfg.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_kMdmYXAFE_gxGiCZHHwrzQ_E3JlEV1l';
const JWT_SECRET = process.env.JWT_SECRET || 'cineboss_secret_2026';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const PLANS = {
    monthly: { price: 4.99, days: 30 },
    quarterly: { price: 14.99, days: 90 }
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
        const { plan } = req.body;

        if (!plan || !PLANS[plan]) {
            return res.status(400).json({ error: 'Plano invalido' });
        }

        const planInfo = PLANS[plan];
        const expiresAt = new Date(Date.now() + planInfo.days * 24 * 60 * 60 * 1000);

        const { data: existing } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('user_id', decoded.userId)
            .eq('status', 'active')
            .gt('expires_at', new Date().toISOString())
            .limit(1);

        if (existing && existing.length > 0) {
            return res.status(400).json({ error: 'Voce ja possui assinatura ativa' });
        }

        const subscriptionId = uuidv4();
        const paymentId = uuidv4();

        const { error: subError } = await supabase
            .from('subscriptions')
            .insert({
                id: subscriptionId,
                user_id: decoded.userId,
                plan: plan,
                status: 'pending',
                payment_id: paymentId,
                amount: planInfo.price,
                expires_at: expiresAt.toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });

        if (subError) throw subError;

        await supabase.from('payments').insert({
            id: paymentId,
            subscription_id: subscriptionId,
            user_id: decoded.userId,
            amount: planInfo.price,
            status: 'pending',
            created_at: new Date().toISOString()
        });

        return res.status(200).json({
            success: true,
            subscription_id: subscriptionId,
            payment_id: paymentId,
            plan: plan,
            amount: planInfo.price,
            expires_at: expiresAt.toISOString()
        });
    } catch (error) {
        console.error('Create subscription error:', error);
        return res.status(500).json({ error: 'Erro ao criar assinatura' });
    }
};
