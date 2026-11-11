/* /api/subscription?fn=checkout|verify (o rewrite /api/subscription/:fn mantem a URL original) */
const { subscriptionHandler } = require('../lib/api/subscription');

module.exports = async function handler(req, res) {
    const action = (req.query && req.query.fn) || (req.query && req.query.action);
    return subscriptionHandler(req, res, action);
};
