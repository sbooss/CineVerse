const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { authMiddleware, subscriptionMiddleware } = require('../middleware/auth');

const router = express.Router();

const PLANS = {
    monthly: { name: 'CINE BOSS MENSAL', price: 4.99, days: 30 },
    quarterly: { name: 'CINE BOSS TRIMESTRAL', price: 14.99, days: 90 }
};

router.get('/plans', (req, res) => {
    res.json({ plans: PLANS });
});

router.get('/status', authMiddleware, async (req, res) => {
    try {
        const subscriptions = await db.query('subscriptions', {
            select: '*',
            filter: `user_id=eq.${req.user.id} AND status=eq.active AND expires_at=gt.${new Date().toISOString()}`,
            order: 'expires_at.desc',
            limit: '1'
        });

        const subscription = subscriptions && subscriptions.length > 0 ? subscriptions[0] : null;

        res.json({
            hasSubscription: !!subscription,
            subscription: subscription || null,
            canPlay: !!subscription
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao verificar assinatura' });
    }
});

router.post('/create', authMiddleware, async (req, res) => {
    try {
        const { plan } = req.body;

        if (!plan || !PLANS[plan]) {
            return res.status(400).json({ error: 'Plano invalido' });
        }

        const planInfo = PLANS[plan];
        const expiresAt = new Date(Date.now() + planInfo.days * 24 * 60 * 60 * 1000);

        const existingSub = await db.query('subscriptions', {
            select: 'id',
            filter: `user_id=eq.${req.user.id} AND status=eq.active AND expires_at=gt.${new Date().toISOString()}`
        });

        if (existingSub && existingSub.length > 0) {
            return res.status(400).json({ error: 'Voce ja possui uma assinatura ativa' });
        }

        const paymentId = uuidv4();

        const [subscription] = await db.insert('subscriptions', {
            id: uuidv4(),
            user_id: req.user.id,
            plan: plan,
            status: 'pending',
            payment_id: paymentId,
            payment_method: null,
            amount: planInfo.price,
            expires_at: expiresAt.toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });

        await db.insert('payments', {
            id: paymentId,
            subscription_id: subscription.id,
            user_id: req.user.id,
            amount: planInfo.price,
            status: 'pending',
            method: null,
            created_at: new Date().toISOString()
        });

        res.json({
            success: true,
            subscription_id: subscription.id,
            payment_id: paymentId,
            plan: planInfo,
            expires_at: expiresAt
        });
    } catch (error) {
        console.error('Create subscription error:', error);
        res.status(500).json({ error: 'Erro ao criar assinatura' });
    }
});

router.post('/activate', authMiddleware, async (req, res) => {
    try {
        const { subscription_id, payment_id } = req.body;

        if (!subscription_id) {
            return res.status(400).json({ error: 'ID da assinatura invalido' });
        }

        const subscriptions = await db.query('subscriptions', {
            select: '*',
            filter: `id=eq.${subscription_id} AND user_id=eq.${req.user.id}`
        });

        if (!subscriptions || subscriptions.length === 0) {
            return res.status(404).json({ error: 'Assinatura nao encontrada' });
        }

        const subscription = subscriptions[0];

        if (subscription.status === 'active') {
            return res.json({ success: true, message: 'Assinatura ja ativa' });
        }

        const planInfo = PLANS[subscription.plan];
        const expiresAt = new Date(Date.now() + planInfo.days * 24 * 60 * 60 * 1000);

        await db.update('subscriptions', {
            status: 'active',
            activated_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString()
        }, `id=eq.${subscription_id}`);

        if (payment_id) {
            await db.update('payments', {
                status: 'completed',
                paid_at: new Date().toISOString()
            }, `id=eq.${payment_id}`);
        }

        const [updatedSub] = await db.query('subscriptions', {
            select: '*',
            filter: `id=eq.${subscription_id}`
        });

        res.json({
            success: true,
            subscription: updatedSub
        });
    } catch (error) {
        console.error('Activate subscription error:', error);
        res.status(500).json({ error: 'Erro ao ativar assinatura' });
    }
});

router.get('/check-play', authMiddleware, async (req, res) => {
    try {
        const subscriptions = await db.query('subscriptions', {
            select: '*',
            filter: `user_id=eq.${req.user.id} AND status=eq.active AND expires_at=gt.${new Date().toISOString()}`,
            order: 'expires_at.desc',
            limit: '1'
        });

        const subscription = subscriptions && subscriptions.length > 0 ? subscriptions[0] : null;

        if (!subscription) {
            return res.status(403).json({ 
                canPlay: false,
                error: 'Assinatura necessaria',
                message: 'Voce precisa de uma assinatura ativa para assistir conteudo'
            });
        }

        res.json({
            canPlay: true,
            subscription: {
                plan: subscription.plan,
                expires_at: subscription.expires_at
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao verificar permissao' });
    }
});

module.exports = router;
