const { accessLiberated } = require('./emailtemplates');

const SITE_URL = process.env.SITE_URL || 'https://cineboss.online';

const PLAN_LABELS = { daily: 'Pass 24 Horas', monthly: '30 Dias', quarterly: '90 Dias' };

async function sendEmail(to, subject, html) {
    try {
        const key = process.env.EMAIL_API_KEY;
        if (!key) {
            console.log('[email] pulado (EMAIL_API_KEY ausente) para: ' + to);
            return { sent: false };
        }
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        const r = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: { 'api-key': key, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sender: { name: 'CINE BOSS', email: 'contato@cineboss.online' },
                to: [{ email: to }],
                subject: subject,
                htmlContent: html
            }),
            signal: controller.signal
        });
        clearTimeout(timer);
        if (!r.ok) console.error('[email] erro ' + r.status + ' para ' + to);
        return { sent: r.ok };
    } catch (e) {
        console.error('[email] falha: ' + e.message);
        return { sent: false };
    }
}

async function notifyOwnerWhatsApp(text) {
    try {
        const phone = process.env.WHATSAPP_PHONE;
        const apikey = process.env.WHATSAPP_APIKEY;
        if (!phone || !apikey) {
            console.log('[whatsapp] pulado (WHATSAPP_PHONE/WHATSAPP_APIKEY ausentes)');
            return { sent: false };
        }
        const url = 'https://api.callmebot.com/whatsapp.php?phone=' + encodeURIComponent(phone)
            + '&text=' + encodeURIComponent(text)
            + '&apikey=' + encodeURIComponent(apikey);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        const r = await fetch(url, { signal: controller.signal });
        clearTimeout(timer);
        return { sent: r.ok };
    } catch (e) {
        console.error('[whatsapp] falha: ' + e.message);
        return { sent: false };
    }
}

function fmtBR(iso) {
    try {
        const d = new Date(iso);
        return d.toLocaleDateString('pt-BR');
    } catch (e) { return String(iso || '').substring(0, 10); }
}

async function notifyPaymentActivated(supabase, userId, plan, expiresAt) {
    try {
        const { data: us } = await supabase.from('users')
            .select('name, email').eq('id', userId).limit(1);
        const u = us && us[0];
        if (!u) return;
        const name = (u.name || '').split(' ')[0] || 'cliente';
        const planLabel = PLAN_LABELS[plan] || plan || 'plano';
        const expiresLabel = fmtBR(expiresAt);
        const tpl = accessLiberated({ name: name, planLabel: planLabel, expiresLabel: expiresLabel });
        await sendEmail(u.email, tpl.subject, tpl.html);
        await notifyOwnerWhatsApp('CINE BOSS - Pagamento confirmado! ' + (u.name || u.email) + ' - plano ' + planLabel + ' - valido ate ' + expiresLabel + '. Acesso liberado automaticamente.');
    } catch (e) {
        console.error('[notify] erro: ' + e.message);
    }
}

module.exports = { sendEmail, notifyOwnerWhatsApp, notifyPaymentActivated, PLAN_LABELS };
