/* /api/webhook/mercadopago — unico ativador de assinatura via pagamento */
const { webhookHandler } = require('../lib/api/webhook');

module.exports = async function handler(req, res) {
    return webhookHandler(req, res);
};
