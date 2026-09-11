const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { authMiddleware, subscriptionMiddleware } = require('../middleware/auth');

const router = express.Router();

const PLANS = {
    monthly: {
        id: 'monthly',
        name: 'CINE BOSS MENSAL',
        price: 4.99,
        duration: 30,
        description: '30 dias de acesso'
    },
    quarterly: {
        id: 'quarterly',
        name: 'CINE BOSS TRIMESTRAL',
        price: 14.99,
        duration: 90,
        description: '90 dias de acesso'
    }
};

router.get('/plans', (req, res) => {
    res.json({ plans: PLANS });
});

router.get('/status', authMiddleware, (req, res) => {
    try {
        const subscription = db.prepare(`
            SELECT * FROM subscriptions 
            WHERE user_id = ? AND status = 'active' AND expires_at > datetime('now')
            ORDER BY expires_at DESC LIMIT 1
        `).get(req.user.id);

        const expiredSubscription = db.prepare(`
            SELECT * FROM subscriptions 
            WHERE user_id = ? AND status = 'expired'
            ORDER BY expires_at DESC LIMIT 1
        `).get(req.user.id);

        if (subscription) {
            const expiresAt = new Date(subscription.expires_at);
            const now = new Date();
            const daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
            
            return res.json({
                hasActive: true,
                subscription: {
                    ...subscription,
                    days_remaining: daysRemaining,
                    expires_at_formatted: expiresAt.toLocaleDateString('pt-BR')
                }
            });
        }

        if (expiredSubscription) {
            return res.json({
                hasActive: false,
                expired: true,
                subscription: expiredSubscription
            });
        }

        res.json({ hasActive: false, expired: false, subscription: null });
    } catch (error) {
        console.error('Subscription status error:', error);
        res.status(500).json({ error: 'Erro ao verificar assinatura' });
    }
});

router.post('/create', authMiddleware, (req, res) => {
    try {
        const { plan } = req.body;

        if (!plan || !PLANS[plan]) {
            return res.status(400).json({ error: 'Plano invalido' });
        }

        const selectedPlan = PLANS[plan];

        const existingActive = db.prepare(`
            SELECT id FROM subscriptions 
            WHERE user_id = ? AND status = 'active' AND expires_at > datetime('now')
        `).get(req.user.id);

        if (existingActive) {
            return res.status(400).json({ error: 'Voce ja possui uma assinatura ativa' });
        }

        const subscriptionId = uuidv4();
        
        db.prepare(`
            INSERT INTO subscriptions (id, user_id, plan, status, amount) 
            VALUES (?, ?, ?, 'pending', ?)
        `).run(subscriptionId, req.user.id, plan, selectedPlan.price);

        const paymentId = uuidv4();
        
        db.prepare(`
            INSERT INTO payments (id, user_id, subscription_id, gateway, amount, status) 
            VALUES (?, ?, ?, 'mercadopago', ?, 'pending')
        `).run(paymentId, req.user.id, subscriptionId, selectedPlan.price);

        res.json({
            success: true,
            subscription_id: subscriptionId,
            payment_id: paymentId,
            plan: selectedPlan,
            redirect_url: `/payment.html?sub=${subscriptionId}&plan=${plan}`
        });
    } catch (error) {
        console.error('Create subscription error:', error);
        res.status(500).json({ error: ao criar assinatura' });
    }
});

router.post('/activate', authMiddleware, (req, res) => {
    try {
        const { subscription_id, payment_id } = req.body;

        if (!subscription_id) {
            return res.status(400).json({ error: 'ID da assinatura necessario' });
        }

        const subscription = db.prepare(`
            SELECT * FROM subscriptions WHERE id = ? AND user_id = ?
        `).get(subscription_id, req.user.id);

        if (!subscription) {
            return res.status(404).json({ error: 'Assinatura nao encontrada' });
        }

        if (subscription.status === 'active') {
            return res.json({ success: true, message: 'Assinatura ja ativa' });
        }

        const selectedPlan = PLANS[subscription.plan];
        const now = new Date();
        const expiresAt = new Date(now.getTime() + selectedPlan.duration * 24 * 60 * 60 * 1000);

        db.prepare(`
            UPDATE subscriptions 
            SET status = 'active', 
                started_at = datetime('now'), 
                expires_at = datetime(?, 'utc'),
                payment_id = ?
            WHERE id = ?
        `).run(expiresAt.toISOString(), payment_id || null, subscription_id);

        if (payment_id) {
            db.prepare(`
                UPDATE payments SET status = 'approved' WHERE id = ?
            `).run(payment_id);
        }

        res.json({
            success: true,
            subscription: {
                ...subscription,
                status: 'active',
                started_at: now.toISOString(),
                expires_at: expiresAt.toISOString(),
                days_remaining: selectedPlan.duration
            }
        });
    } catch (error) {
        console.error('Activate subscription error:', error);
        res.status(500).json({ error: 'Erro ao ativar assinatura' });
    }
});

router.get('/check-play', authMiddleware, (req, res) => {
    try {
        const subscription = db.prepare(`
            SELECT * FROM subscriptions 
            WHERE user_id = ? AND status = 'active' AND expires_at > datetime('now')
            ORDER BY expires_at DESC LIMIT 1
        `).get(req.user.id);

        if (subscription) {
            const expiresAt = new Date(subscription.expires_at);
            const now = new Date();
            const daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
            
            return res.json({
                canPlay: true,
                days_remaining: daysRemaining
            });
        }

        res.json({ canPlay: false });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao verificar acesso' });
    }
});

module.exports = router;
