const {
    supabase, setCors, handleOptions,
    checkRateLimit, recordRateLimitAttempt,
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

        const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'desconhecido';
        const rl = await checkRateLimit('track:' + ip, 60, 60);
        if (rl.blocked) return jsonError(res, 429, 'Muitas requisicoes');
        recordRateLimitAttempt('track:' + ip);

        const key = plan ? 'funnel:' + event + ':' + plan : 'funnel:' + event;
        const { error } = await supabase.from('rate_limits').insert({
            key,
            created_at: new Date().toISOString()
        });
        if (error) console.error('Funnel insert error:', error);

        return jsonSuccess(res, { tracked: !error });
    } catch (error) {
        console.error('Track error:', error);
        return jsonSuccess(res, { tracked: false });
    }
};
