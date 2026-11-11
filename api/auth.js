/* /api/auth?fn=me|login|register|logout|forgot-password
   O rewrite /api/auth/:fn -> /api/auth?fn=:fn mantem as URLs originais */
const { meHandler, loginHandler, registerHandler, logoutHandler, forgotPasswordHandler } = require('../lib/api/auth');

module.exports = async function handler(req, res) {
    const fn = req.query && req.query.fn;
    if (fn === 'me') return meHandler(req, res);
    if (fn === 'login') return loginHandler(req, res);
    if (fn === 'register') return registerHandler(req, res);
    if (fn === 'logout') return logoutHandler(req, res);
    if (fn === 'forgot-password') return forgotPasswordHandler(req, res);
    return res.status(404).json({ error: 'Not found' });
};
