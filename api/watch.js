/* /api/watch?fn=progress (o rewrite /api/watch/:fn mantem a URL original) */
const { progressHandler } = require('../lib/api/watch');

module.exports = async function handler(req, res) {
    const fn = req.query && req.query.fn;
    if (fn === 'progress') return progressHandler(req, res);
    return res.status(404).json({ error: 'Not found' });
};
