const MP_TOKEN_FN = () => process.env.MP_ACCESS_TOKEN;
const MP_API = 'https://api.mercadopago.com';
const PLAN_DAYS = { daily: 1, monthly: 30, quarterly: 90 };

async function mpSearch(params) {
    try {
        const token = MP_TOKEN_FN();
        if (!token) return [];
        const qs = Object.entries(params).map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v)).join('&');
        const mpRes = await fetch(`${MP_API}/v1/payments/search?sort=date_created&criteria=desc&${qs}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!mpRes.ok) return [];
        const data = await mpRes.json();
        return data.results || [];
    } catch (e) {
        console.error('MP search error:', e.message);
        return [];
    }
}

async function activateSubscription(supabase, userId, sub, payment) {
    let ref = {};
    try { ref = JSON.parse(payment.external_reference || '{}'); } catch (e) {}
    const plan = sub ? sub.plan : (ref.plan && PLAN_DAYS[ref.plan] ? ref.plan : 'monthly');
    const planDays = (ref.planDays && parseInt(ref.planDays)) || PLAN_DAYS[plan] || 30;
    const amount = Number(payment.transaction_amount) || Number(sub && sub.amount) || 0;
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + planDays * 24 * 60 * 60 * 1000).toISOString();

    if (sub) {
        const { error: updErr } = await supabase.from('subscriptions').update({
            status: 'active',
            activated_at: now,
            expires_at: expiresAt,
            updated_at: now,
            payment_id: String(payment.id)
        }).eq('id', sub.id);
        if (updErr) return { ok: false, error: 'update_failed', detail: updErr.message };
    } else {
        const subId = crypto.randomUUID();
        const { error: insErr } = await supabase.from('subscriptions').insert({
            id: subId,
            user_id: userId,
            plan: plan,
            status: 'active',
            payment_id: String(payment.id),
            amount: amount,
            activated_at: now,
            expires_at: expiresAt,
            created_at: now,
            updated_at: now
        });
        if (insErr) return { ok: false, error: 'insert_failed', detail: insErr.message };
    }

    const { data: finalSubs } = await supabase.from('subscriptions')
        .select('id').eq('user_id', userId).eq('status', 'active')
        .gt('expires_at', now).limit(1);
    const subId = sub ? sub.id : (finalSubs && finalSubs[0] ? finalSubs[0].id : null);

    if (subId) {
        const { error: payErr } = await supabase.from('payments').insert({
            id: crypto.randomUUID(),
            subscription_id: subId,
            user_id: userId,
            amount: amount,
            status: 'completed',
            method: 'mercadopago',
            external_id: String(payment.id),
            paid_at: now,
            created_at: now
        });
        if (payErr) console.error('payments insert error:', payErr);
    }

    const { error: feErr } = await supabase.from('rate_limits').insert({
        key: 'funnel:purchase:' + plan,
        created_at: now
    });
    if (feErr) console.error('funnel insert error:', feErr);

    return { ok: true, plan: plan, expiresAt: expiresAt, amount: amount, mpPaymentId: String(payment.id) };
}

async function findApprovedForUser(userId, preferRef) {
    if (preferRef) {
        const byRef = await mpSearch({ external_reference: preferRef });
        const hit = byRef.find(p => p.status === 'approved');
        if (hit) return hit;
    }
    const recent = await mpSearch({ limit: 100 });
    return recent.find(p => p.status === 'approved'
        && String(p.external_reference || '').indexOf(userId) !== -1
        && p.date_approved && (Date.now() - new Date(p.date_approved).getTime()) < 30 * 24 * 60 * 60 * 1000) || null;
}

async function verifyAndActivateUser(supabase, userId, userEmail) {
    const now = new Date().toISOString();

    const { data: activeSubs } = await supabase.from('subscriptions')
        .select('id, plan, expires_at').eq('user_id', userId).eq('status', 'active')
        .gt('expires_at', now).limit(1);
    if (activeSubs && activeSubs.length > 0) {
        return { status: 'already_active', plan: activeSubs[0].plan, expiresAt: activeSubs[0].expires_at };
    }

    const { data: pendingSubs } = await supabase.from('subscriptions')
        .select('*').eq('user_id', userId).eq('status', 'pending')
        .order('created_at', { ascending: false }).limit(5);

    if (pendingSubs && pendingSubs.length > 0) {
        for (const sub of pendingSubs) {
            const extRef = JSON.stringify({ userId: userId, plan: sub.plan, planDays: String(PLAN_DAYS[sub.plan] || 30) });
            const approved = await findApprovedForUser(userId, extRef);
            if (approved) {
                const r = await activateSubscription(supabase, userId, sub, approved);
                if (r.ok) {
                    try {
                        const { notifyPaymentActivated } = require('./notify');
                        await notifyPaymentActivated(supabase, userId, r.plan, r.expiresAt);
                    } catch (e) { console.error('[notify] erro (ignorado): ' + e.message); }
                    return { status: 'activated', plan: r.plan, expiresAt: r.expiresAt, recovered: false, mpPaymentId: r.mpPaymentId };
                }
                return { status: 'error', detail: r.detail || r.error };
            }
        }
        return { status: 'payment_not_found' };
    }

    const approvedForUser = await findApprovedForUser(userId, null);
    if (approvedForUser) {
        const r = await activateSubscription(supabase, userId, null, approvedForUser);
        if (r.ok) {
            try {
                const { notifyPaymentActivated } = require('./notify');
                await notifyPaymentActivated(supabase, userId, r.plan, r.expiresAt);
            } catch (e) { console.error('[notify] erro (ignorado): ' + e.message); }
            return { status: 'activated', plan: r.plan, expiresAt: r.expiresAt, recovered: true, mpPaymentId: r.mpPaymentId };
        }
        return { status: 'error', detail: r.detail || r.error };
    }

    return { status: 'payment_not_found' };
}

module.exports = { verifyAndActivateUser, mpSearch, PLAN_DAYS };
