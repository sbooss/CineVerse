const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
    }
});

const FROM_NAME = 'CINE BOSS';
const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER || '';

function generateWelcomeHTML(name) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#050508;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#0a0a12;">
        <div style="background:linear-gradient(135deg,#00d4ff,#7b2fff);padding:40px 30px;text-align:center;">
            <h1 style="color:#fff;font-size:28px;margin:0;letter-spacing:2px;text-shadow:0 0 20px rgba(0,212,255,0.5);">CINE BOSS</h1>
            <p style="color:rgba(255,255,255,0.9);margin:10px 0 0;font-size:14px;letter-spacing:1px;">Sua experiencia de streaming definitiva</p>
        </div>
        
        <div style="padding:40px 30px;">
            <h2 style="color:#fff;font-size:22px;margin:0 0 20px;text-align:center;">Bem-vindo ao CINE BOSS</h2>
            
            <p style="color:#b0b0cc;font-size:15px;line-height:1.7;margin:0 0 20px;">OLA ${name.toUpperCase()},</p>
            
            <p style="color:#b0b0cc;font-size:15px;line-height:1.7;margin:0 0 20px;">
                Sua conta foi criada com sucesso. Voce agora faz parte da plataforma de streaming mais premium do Brasil.
            </p>
            
            <p style="color:#b0b0cc;font-size:15px;line-height:1.7;margin:0 0 30px;">
                Para liberar a reproducao dos conteudos, escolha uma das opcoes de acesso:
            </p>
            
            <div style="background:rgba(0,212,255,0.05);border:1px solid rgba(0,212,255,0.2);border-radius:12px;padding:20px;margin:0 0 15px;">
                <div style="color:#00d4ff;font-size:13px;letter-spacing:1px;margin-bottom:8px;">PLANO MENSAL</div>
                <div style="color:#fff;font-size:24px;font-weight:bold;">R$ 4,99</div>
                <div style="color:#b0b0cc;font-size:13px;margin-top:5px;">30 dias de acesso</div>
            </div>
            
            <div style="background:rgba(123,47,255,0.05);border:1px solid rgba(123,47,255,0.2);border-radius:12px;padding:20px;margin:0 0 30px;">
                <div style="color:#7b2fff;font-size:13px;letter-spacing:1px;margin-bottom:8px;">PLANO TRIMESTRAL</div>
                <div style="color:#fff;font-size:24px;font-weight:bold;">R$ 14,99</div>
                <div style="color:#b0b0cc;font-size:13px;margin-top:5px;">90 dias de acesso</div>
            </div>
            
            <p style="color:#b0b0cc;font-size:14px;line-height:1.7;margin:0 0 20px;">
                Voce pode navegar pela plataforma, pesquisar titulos e conhecer o catalogo antes de realizar a assinatura.
            </p>
            
            <p style="color:#b0b0cc;font-size:14px;line-height:1.7;margin:0 0 20px;">
                Apos a confirmacao do pagamento, o acesso aos conteudos sera liberado automaticamente.
            </p>
            
            <div style="background:rgba(255,200,0,0.05);border:1px solid rgba(255,200,0,0.2);border-radius:8px;padding:15px;margin:0 0 30px;">
                <p style="color:#ffc800;font-size:13px;margin:0;line-height:1.6;">
                    <strong>IMPORTANTE:</strong> Ao acessar conteudos externos, caso uma nova janela inesperada seja aberta, feche-a e retorne a plataforma. Nunca forneca dados pessoais ou de pagamento em paginas externas que voce nao reconheca.
                </p>
            </div>
            
            <p style="color:#fff;font-size:16px;text-align:center;margin:30px 0 0;font-weight:600;">
                Bem-vindo ao CINE BOSS.
            </p>
        </div>
        
        <div style="background:#050508;padding:20px 30px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
            <p style="color:#5a5a7a;font-size:12px;margin:0;">
                &copy; 2026 CINE BOSS. Todos os direitos reservados.
            </p>
        </div>
    </div>
</body>
</html>`;
}

function generatePasswordResetHTML(name, resetLink) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#050508;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#0a0a12;">
        <div style="background:linear-gradient(135deg,#00d4ff,#7b2fff);padding:40px 30px;text-align:center;">
            <h1 style="color:#fff;font-size:28px;margin:0;letter-spacing:2px;">CINE BOSS</h1>
        </div>
        
        <div style="padding:40px 30px;">
            <h2 style="color:#fff;font-size:20px;margin:0 0 20px;text-align:center;">Recuperacao de Senha</h2>
            
            <p style="color:#b0b0cc;font-size:15px;line-height:1.7;margin:0 0 20px;">OLA ${name.toUpperCase()},</p>
            
            <p style="color:#b0b0cc;font-size:15px;line-height:1.7;margin:0 0 30px;">
                Recebemos uma solicitacao para redefinir sua senha. Clique no botao abaixo para criar uma nova senha:
            </p>
            
            <div style="text-align:center;margin:0 0 30px;">
                <a href="${resetLink}" style="display:inline-block;background:linear-gradient(135deg,#00d4ff,#7b2fff);color:#fff;padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Redefinir Senha</a>
            </div>
            
            <p style="color:#b0b0cc;font-size:13px;line-height:1.7;margin:0 0 20px;">
                Se voce nao solicitou a recuperação de senha, ignore este email. Sua senha atual permanecera inalterada.
            </p>
            
            <p style="color:#5a5a7a;font-size:12px;margin:0;">
                Este link expira em 1 hora.
            </p>
        </div>
        
        <div style="background:#050508;padding:20px 30px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
            <p style="color:#5a5a7a;font-size:12px;margin:0;">
                &copy; 2026 CINE BOSS. Todos os direitos reservados.
            </p>
        </div>
    </div>
</body>
</html>`;
}

const emailService = {
    async sendWelcomeEmail(to, name) {
        try {
            if (!FROM_EMAIL || !process.env.SMTP_USER) {
                console.log('Email not configured - skipping welcome email');
                return { success: true, skipped: true };
            }

            const info = await transporter.sendMail({
                from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
                to,
                subject: 'Bem-vindo ao CINE BOSS',
                html: generateWelcomeHTML(name)
            });

            console.log('Welcome email sent:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Send welcome email error:', error);
            return { success: false, error: error.message };
        }
    },

    async sendPasswordReset(to, name) {
        try {
            if (!FROM_EMAIL || !process.env.SMTP_USER) {
                console.log('Email not configured - skipping password reset');
                return { success: true, skipped: true };
            }

            const resetLink = `https://cineboss.com/reset-password?token=${Date.now()}`;

            const info = await transporter.sendMail({
                from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
                to,
                subject: 'Recuperacao de Senha - CINE BOSS',
                html: generatePasswordResetHTML(name, resetLink)
            });

            console.log('Password reset email sent:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Send password reset error:', error);
            return { success: false, error: error.message };
        }
    },

    async sendSubscriptionConfirmation(to, name, plan) {
        try {
            if (!FROM_EMAIL) return { success: true, skipped: true };

            const planDetails = {
                monthly: { name: 'MENSAL', price: 'R$ 4,99', days: '30 dias' },
                quarterly: { name: 'TRIMESTRAL', price: 'R$ 14,99', days: '90 dias' }
            };

            const details = planDetails[plan] || planDetails.monthly;

            const info = await transporter.sendMail({
                from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
                to,
                subject: 'Assinatura Ativada - CINE BOSS',
                html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#050508;font-family:'Segoe UI',sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#0a0a12;">
        <div style="background:linear-gradient(135deg,#00d4ff,#7b2fff);padding:40px 30px;text-align:center;">
            <h1 style="color:#fff;font-size:28px;margin:0;letter-spacing:2px;">CINE BOSS</h1>
        </div>
        <div style="padding:40px 30px;text-align:center;">
            <h2 style="color:#00d4ff;font-size:20px;margin:0 0 20px;">Assinatura Ativada!</h2>
            <p style="color:#b0b0cc;font-size:15px;">OLA ${name.toUpperCase()},</p>
            <p style="color:#b0b0cc;font-size:15px;">Seu plano <strong style="color:#fff;">CINE BOSS ${details.name}</strong> foi ativado com sucesso.</p>
            <div style="background:rgba(0,212,255,0.05);border:1px solid rgba(0,212,255,0.2);border-radius:12px;padding:20px;margin:20px 0;">
                <div style="color:#00d4ff;font-size:13px;">VALOR PAGO</div>
                <div style="color:#fff;font-size:24px;font-weight:bold;">${details.price}</div>
                <div style="color:#b0b0cc;font-size:13px;margin-top:5px;">${details.days} de acesso</div>
            </div>
            <p style="color:#b0b0cc;font-size:14px;">Aproveite todo o conteudo da plataforma!</p>
        </div>
        <div style="background:#050508;padding:20px;text-align:center;">
            <p style="color:#5a5a7a;font-size:12px;margin:0;">&copy; 2026 CINE BOSS</p>
        </div>
    </div>
</body>
</html>`
            });

            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Send subscription confirmation error:', error);
            return { success: false, error: error.message };
        }
    }
};

module.exports = emailService;
