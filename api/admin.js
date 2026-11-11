/* /api/admin?fn=overview (o rewrite /api/admin/:fn mantem a URL original) */
const { overviewHandler } = require('../lib/api/admin');

module.exports = async function handler(req, res) {
    const fn = req.query && req.query.fn;
    if (fn === 'overview') return overviewHandler(req, res);
    return res.status(404).json({ error: 'Not found' });
};
