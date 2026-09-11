const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/mercadopago', async (req, res) => {
    try {
        const { data } = req.body;

        if (!data || !data.id) {
            return res.status(400).json({ error: 'Webhook invalido' });
        }

        const payments = await db.query('payments', {
            select: '*',
            filter: `id=eq.${data.id}`
        });

        if (!payments || payments.length === 0) {
            return res.status(404).json({ error: 'Pagamento nao encontrado' });
        }

        const payment = payments[0];

        if (data.status === 'approved') {
            await db.update('payments', {
                status: 'completed',
                paid_at: new Date().toISOString(),
                external_id: data.external_id || null
            }, `id=eq.${payment.id}`);

            const subscriptions = await db.query('subscriptions', {
                select: '*',
                filter: `id=eq.${payment.subscription_id}`
            });

            if (subscriptions && subscriptions.length > 0) {
                const subscription = subscriptions[0];
                const planInfo = getPlanInfo(subscription.plan);
                const expiresAt = new Date(Date.now() + planInfo.days * 24 * 60 * 60 * 1000);

                await db.update('subscriptions', {
                    status: 'active',
                    activated_at: new Date().toISOString(),
                    expires_at: expiresAt.toISOString(),
                    updated_at: new Date().toISOString()
                }, `id=eq.${subscription.id}`);
            }
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Erro ao processar webhook' });
    }
});

function getPlanInfo(plan) {
    const plans = {
        monthly: { name: 'CINE BOSS MENSAL', price: 4.99, days: 30 },
        quarterly: { name: 'CINE BOSS TRIMESTRAL', price: 14.99, days: 90 }
    };
    return plans[plan] || plans.monthly;
}

router.post('/simulate', authMiddleware, async (req, res) => {
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
        const planInfo = getPlanInfo(subscription.plan);
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
            message: 'Pagamento simulado com sucesso',
            subscription: updatedSub
        });
    } catch (error) {
        console.error('Simulate payment error:', error);
        res.status(500).json({ error: 'Erro ao simular pagamento' });
    }
});

module.exports = router;
