const jwt = require('jsonwebtoken');
const db = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'cineboss_secret_key_2026_ultra_secure';

function authMiddleware(req, res, next) {
    try {
        const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'Token nao fornecido' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        
        const session = db.prepare('SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")').get(token);
        
        if (!session) {
            return res.status(401).json({ error: 'Sessao expirada' });
        }

        const user = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(decoded.userId);
        
        if (!user) {
            return res.status(401).json({ error: 'Usuario nao encontrado' });
        }

        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expirado' });
        }
        return res.status(401).json({ error: 'Token invalido' });
    }
}

function subscriptionMiddleware(req, res, next) {
    try {
        const subscription = db.prepare(`
            SELECT * FROM subscriptions 
            WHERE user_id = ? AND status = 'active' AND expires_at > datetime('now')
            ORDER BY expires_at DESC LIMIT 1
        `).get(req.user.id);

        req.subscription = subscription;
        
        if (!subscription) {
            req.hasActiveSubscription = false;
        } else {
            req.hasActiveSubscription = true;
        }
        
        next();
    } catch (error) {
        return res.status(500).json({ error: 'Erro ao verificar assinatura' });
    }
}

module.exports = { authMiddleware, subscriptionMiddleware, JWT_SECRET };
