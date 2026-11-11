/* =====================================================
   CINE BOSS - funcao catch-all unica do /api
   Substitui as 13 funcoes serverless individuais para respeitar
   o limite de 12 funcoes do plano Hobby da Vercel.
   Rotas:
     /api/auth/me|login|register|logout|forgot-password
     /api/admin/overview
     /api/live?url=...
     /api/watch/progress
     /api/track
     /api/subscription/checkout|verify
     /api/webhook/mercadopago
     /api/tmdb?path=...
     /api/assistir/:type/:idslug   (SSR das paginas de assistir)
   ===================================================== */
const { meHandler, loginHandler, registerHandler, logoutHandler, forgotPasswordHandler } = require('../lib/api/auth');
const { overviewHandler } = require('../lib/api/admin');
const { liveHandler } = require('../lib/api/live');
const { progressHandler } = require('../lib/api/watch');
const { trackHandler } = require('../lib/api/track');
const { subscriptionHandler } = require('../lib/api/subscription');
const { webhookHandler } = require('../lib/api/webhook');
const { tmdbHandler } = require('../lib/api/tmdb');
const { assistirHandler } = require('../lib/api/assistir');

module.exports = async function handler(req, res) {
    let pathname = '';
    try {
        pathname = new URL(req.url, 'http://localhost').pathname;
    } catch (e) {
        pathname = String(req.url || '').split('?')[0];
    }
    // remove barra final e quebra em segmentos
    const seg = pathname.replace(/\/+$/, '').split('/').filter(Boolean);
    // descarta o prefixo "api" quando presente (rewrite /assistir -> /api/assistir)
    const rest = (seg[0] === 'api') ? seg.slice(1) : seg;

    try {
        const root = rest[0];
        const sub = rest[1];

        if (root === 'auth') {
            if (sub === 'me') return meHandler(req, res);
            if (sub === 'login') return loginHandler(req, res);
            if (sub === 'register') return registerHandler(req, res);
            if (sub === 'logout') return logoutHandler(req, res);
            if (sub === 'forgot-password') return forgotPasswordHandler(req, res);
        } else if (root === 'admin') {
            if (sub === 'overview') return overviewHandler(req, res);
        } else if (root === 'live') {
            return liveHandler(req, res);
        } else if (root === 'watch') {
            if (sub === 'progress') return progressHandler(req, res);
        } else if (root === 'track') {
            return trackHandler(req, res);
        } else if (root === 'subscription') {
            const action = sub || (req.query && req.query.action);
            return subscriptionHandler(req, res, action);
        } else if (root === 'webhook') {
            if (sub === 'mercadopago') return webhookHandler(req, res);
        } else if (root === 'tmdb') {
            return tmdbHandler(req, res);
        } else if (root === 'assistir') {
            return assistirHandler(req, res);
        }
    } catch (error) {
        console.error('Catch-all api error:', error);
        if (!res.headersSent) return res.status(500).json({ error: 'Erro interno do servidor' });
        return;
    }

    return res.status(404).json({ error: 'Not found' });
};
