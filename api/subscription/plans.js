const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dofzztjpqedsaazbvzfg.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_kMdmYXAFE_gxGiCZHHwrzQ_E3JlEV1l';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const PLANS = {
    monthly: { id: 'monthly', name: 'CINE BOSS MENSAL', price: 4.99, days: 30, priceLabel: 'R$ 4,99', periodLabel: '/mes' },
    quarterly: { id: 'quarterly', name: 'CINE BOSS TRIMESTRAL', price: 14.99, days: 90, priceLabel: 'R$ 14,99', periodLabel: '/3 meses' }
};

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    return res.status(200).json({ plans: PLANS });
};
