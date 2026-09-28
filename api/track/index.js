const {
    supabase, setCors, handleOptions,
    getToken, verifyToken,
    jsonError, jsonSuccess
} = require('../_lib/security');

const ALLOWED_EVENTS = ['paywall_open', 'checkout_click'];
const ALLOWED_PLANS = ['daily', 'monthly', 'quarterly'];

module.exports = async function handler(req, res) {
    setCors(req, res);
    if (req.method === 'OPTIONS') return handleOptions(res);
    if (req.method !== 'POST') return jsonError(res, 405, 'Method not allowed');

    try {
        const body = req.body || {};
        const event = body.event;
        if (!event || ALLOWED_EVENTS.indexOf(event) === -1) return jsonError(res, 400, 'Evento invalido');
        const plan = ALLOWED_PLANS.indexOf(body.plan) !== -1 ? body.plan : null;

        let userId = null;
        const token = getToken(req);
        if (token) {
            try {
                const decoded = verifyToken(token);
                userId = decoded.userId || null;
            } catch {}
        }

        const { error } = await supabase.from('funnel_events').insert({
            event,
            plan,
            user_id: userId,
            created_at: new Date().toISOString()
        });
        if (error) console.error('Funnel insert error:', error);

        return jsonSuccess(res, { tracked: !error });
    } catch (error) {
        console.error('Track error:', error);
        return jsonSuccess(res, { tracked: false });
    }
};
