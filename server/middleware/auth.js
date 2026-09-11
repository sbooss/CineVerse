const jwt = require('jsonwebtoken');
const db = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'cineboss_secret_key_2026_ultra_secure';

function authMiddleware(req, res, next) {
    try {
        let token = null;
        
        if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        } else if (req.headers.authorization) {
            token = req.headers.authorization.replace('Bearer ', '');
        }
        
        if (!token) {
            return res.status(401).json({ error: 'Token nao fornecido' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        
        const sessions = db.query('sessions', {
            select: '*',
            filter: `token=eq.${token}`
        });
        
        const session = sessions && sessions.length > 0 ? sessions[0] : null;
        
        if (!session) {
            console.log('[AUTH] Session not found for token:', token.substring(0, 30));
            return res.status(401).json({ error: 'Sessao expirada' });
        }

        const users = db.query('users', {
            select: 'id, name, email, created_at',
            filter: `id=eq.${decoded.userId}`
        });
        
        const user = users && users.length > 0 ? users[0] : null;
        
        if (!user) {
            return res.status(401).json({ error: 'Usuario nao encontrado' });
        }

        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        console.log('[AUTH] Error:', error.message);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expirado' });
        }
        return res.status(401).json({ error: 'Token invalido' });
    }
}

function subscriptionMiddleware(req, res, next) {
    try {
        const subscriptions = db.query('subscriptions', {
            select: '*',
            filter: `user_id=eq.${req.user.id} AND status=eq.active AND expires_at=gt.${new Date().toISOString()}`,
            order: 'expires_at.desc',
            limit: '1'
        });

        const subscription = subscriptions && subscriptions.length > 0 ? subscriptions[0] : null;
        
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
