module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    return res.status(200).json({
        plans: {
            monthly: { id: 'monthly', name: 'CINE BOSS MENSAL', price: 6.99, days: 30, priceLabel: 'R$ 6,99', periodLabel: '/mes' },
            quarterly: { id: 'quarterly', name: 'CINE BOSS TRIMESTRAL', price: 15.99, days: 90, priceLabel: 'R$ 15,99', periodLabel: '/3 meses' }
        }
    });
};
