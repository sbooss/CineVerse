const express = require('express');
const db = require('../database');

const router = express.Router();

router.post('/mercadopago', (req, res) => {
    try {
        const { type, data } = req.body;

        if (type === 'payment') {
            const paymentId = data?.id;
            
            if (paymentId) {
                processPayment(paymentId);
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Webhook error:', error);
        res.sendStatus(500);
    }
});

async function processPayment(paymentId) {
    try {
        const payment = db.prepare(`
            SELECT p.*, s.plan, s.id as sub_id
            FROM payments p
            JOIN subscriptions s ON p.subscription_id = s.id
            WHERE p.gateway_payment_id = ? OR p.id = ?
        `).get(paymentId, paymentId);

        if (!payment) {
            console.log('Payment not found:', paymentId);
            return;
        }

        const mockStatus = 'approved';

        if (mockStatus === 'approved') {
            const PLANS = {
                monthly: 30,
                quarterly: 90
            };

            const duration = PLANS[payment.plan] || 30;
            const now = new Date();
            const expiresAt = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);

            db.prepare(`
                UPDATE subscriptions 
                SET status = 'active', 
                    started_at = datetime('now'), 
                    expires_at = datetime(?, 'utc')
                WHERE id = ?
            `).run(expiresAt.toISOString(), payment.subscription_id);

            db.prepare(`
                UPDATE payments SET status = 'approved', gateway_payment_id = ? WHERE id = ?
            `).run(paymentId, payment.id);

            console.log('Payment approved and subscription activated:', payment.subscription_id);
        }
    } catch (error) {
        console.error('Process payment error:', error);
    }
}

router.post('/simulate', (req, res) => {
    try {
        const { subscription_id, payment_id } = req.body;

        if (!subscription_id) {
            return res.status(400).json({ error: 'Subscription ID required' });
        }

        const subscription = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(subscription_id);
        
        if (!subscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }

        const PLANS = {
            monthly: 30,
            quarterly: 90
        };

        const duration = PLANS[subscription.plan] || 30;
        const now = new Date();
        const expiresAt = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);

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
            message: 'Pagamento simulado com sucesso',
            subscription: {
                ...subscription,
                status: 'active',
                expires_at: expiresAt.toISOString()
            }
        });
    } catch (error) {
        console.error('Simulate payment error:', error);
        res.status(500).json({ error: 'Erro ao simular pagamento' });
    }
});

module.exports = router;
