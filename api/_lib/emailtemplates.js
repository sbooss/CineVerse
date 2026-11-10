const SITE_URL = process.env.SITE_URL || 'https://cineboss.online';

function shell(innerTitle, body) {
    return '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>' + innerTitle + '</title></head>'
        + '<body style="margin:0;padding:0;background-color:#050508;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">'
        + '<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#050508;padding:40px 16px;">'
        + '<tr><td align="center">'
        + '<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#0c0c16;border-radius:16px;border:1px solid rgba(255,255,255,0.06);overflow:hidden;">'
        + '<tr><td style="padding:32px 32px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.04);">'
        + '<div style="font-size:24px;font-weight:800;letter-spacing:2px;color:#e8e8f0;">CINE <span style="color:#00a8e0;">BOSS</span></div>'
        + '<div style="font-size:9px;color:#4a4a60;letter-spacing:4px;text-transform:uppercase;margin-top:4px;">STREAMING PREMIUM</div>'
        + '</td></tr>'
        + '<tr><td style="padding:32px;">' + body + '</td></tr>'
        + '<tr><td style="padding:20px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.04);">'
        + '<div style="font-size:12px;color:#4a4a60;margin-bottom:4px;">Sua experiencia de cinema começa agora.</div>'
        + '<div style="font-size:11px;color:#2a2a40;">&copy; 2026 CINE BOSS. Todos os direitos reservados.</div>'
        + '</td></tr>'
        + '</table></td></tr></table></body></html>';
}

function catGrid() {
    function item(icon, title, desc) {
        return '<td style="width:50%;padding:6px 4px;">'
            + '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:12px 14px;">'
            + '<div style="font-size:13px;font-weight:700;color:#e8e8f0;">' + title + '</div>'
            + '<div style="font-size:11.5px;color:#6a6a80;line-height:1.5;margin-top:3px;">' + desc + '</div>'
            + '</div></td>';
    }
    return '<div style="font-size:12px;color:#4a4a60;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px;">Ja liberado na sua conta</div>'
        + '<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;"><tr>'
        + item('', 'Filmes', 'Do lancamento ao classico, do mundo inteiro')
        + item('', 'Series', 'Temporadas completas pra maratonar')
        + '</tr><tr>'
        + item('', 'Animes', 'Direto do Japao, dublados e legendados')
        + item('', 'Doramas', 'Os K-dramas e J-dramas mais comentados')
        + '</tr><tr>'
        + item('', 'Novelas', 'Do Brasil e do mundo, capitulos completos')
        + item('', 'TV ao Vivo', 'Canais do mundo 24 horas, direto do navegador')
        + '</tr></table>'
        + '<div style="font-size:11.5px;color:#6a6a80;line-height:1.6;margin:10px 0 22px;">E mais: o CINE BOSS lembra em que episodio voce parou. Volte exatamente no mesmo momento, em qualquer tela - celular, computador ou a TV da sala.</div>';
}

function cta(label) {
    return '<div style="text-align:center;margin-bottom:22px;">'
        + '<a href="' + SITE_URL + '" style="display:inline-block;padding:14px 34px;background-color:#00a8e0;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:1px;">' + label + '</a>'
        + '</div>';
}

function accessLiberated(d) {
    const body =
        '<div style="font-size:18px;font-weight:700;color:#e8e8f0;margin-bottom:14px;">Acesso liberado. Bom filme.</div>'
        + '<div style="font-size:14px;color:#8a8aa0;line-height:1.75;margin-bottom:22px;">'
        + 'Ola, <strong style="color:#e8e8f0;">' + d.name + '</strong>.<br><br>'
        + 'Confirmamos seu pagamento e seu acesso completo ao CINE BOSS ja esta <strong style="color:#00a8e0;">ativo agora</strong>.'
        + (d.planLabel ? '<br>Plano: <strong style="color:#e8e8f0;">' + d.planLabel + '</strong>' : '')
        + (d.expiresLabel ? ' &middot; valido ate <strong style="color:#e8e8f0;">' + d.expiresLabel + '</strong>' : '')
        + '<br>Nada mais pra configurar: e so entrar e dar play.'
        + '</div>'
        + catGrid()
        + cta('ENTRAR E ASSISTIR AGORA')
        + '<div style="background:rgba(201,165,78,0.06);border:1px solid rgba(201,165,78,0.15);border-radius:8px;padding:14px;">'
        + '<div style="font-size:12px;color:#c9a54e;line-height:1.6;">'
        + '<strong>So um recado:</strong> se algum link externo estranho abrir durante a navegacao, feche e volte pro CINE BOSS. Nunca pedimos dados ou pagamento fora da plataforma.'
        + '</div></div>';
    return { subject: 'Seu acesso completo esta liberado - CINE BOSS', html: shell('Acesso liberado - CINE BOSS', body) };
}

function issueResolved(d) {
    const body =
        '<div style="font-size:18px;font-weight:700;color:#e8e8f0;margin-bottom:14px;">Tudo liberado por aqui - e um obrigado do tamanho do cinema.</div>'
        + '<div style="font-size:14px;color:#8a8aa0;line-height:1.8;margin-bottom:22px;">'
        + 'Ola, <strong style="color:#e8e8f0;">' + d.name + '</strong>.<br><br>'
        + 'Primeiro, o que importa: <strong style="color:#00a8e0;">seu acesso completo ja esta liberado</strong>.'
        + (d.planLabel ? ' Plano <strong style="color:#e8e8f0;">' + d.planLabel + '</strong>' : '')
        + (d.expiresLabel ? ', valido ate <strong style="color:#e8e8f0;">' + d.expiresLabel + '</strong>' : '')
        + '. Entre quando quiser e de play: ja esta tudo aberto pra voce.<br><br>'
        + 'Passamos por um breve momento de manutencao interna que atrasou a liberacao da sua conta, e queremos ser francos com voce: a demora foi nossa, foi um imprevisto tecnico do nosso lado - assumimos, corrigimos e selamos para que nao se repita.<br><br>'
        + 'E precisamos dizer uma coisa com todas as letras: o CINE BOSS e <strong style="color:#e8e8f0;">fiel a cada cliente que confia na gente</strong>. Jamais, em nenhuma hipotese, faria qualquer tipo de golpe. Seu pagamento foi processado com total seguranca pelo Mercado Pago e cada centavo virou acesso na sua conta - pode conferir, pode usar, pode cobrar. Estamos aqui pra isso.<br><br>'
        + 'Agradecemos de coracao pela sua paciencia e pela sua confianca. Clientes como voce sao o motivo de o CINE BOSS existir.'
        + '</div>'
        + catGrid()
        + cta('ENTRAR NO CINE BOSS')
        + '<div style="background:rgba(201,165,78,0.06);border:1px solid rgba(201,165,78,0.15);border-radius:8px;padding:14px;">'
        + '<div style="font-size:12px;color:#c9a54e;line-height:1.6;">'
        + '<strong>Promessa pessoal:</strong> se qualquer coisa nao funcionar exatamente como deveria, responda este email. O contato@cineboss.online e atendido por gente de verdade - e a gente resolve na hora, sempre.'
        + '</div></div>'
        + '<div style="text-align:center;margin-top:18px;font-size:13px;color:#00a8e0;font-weight:700;letter-spacing:1px;">COM GRATIDAO, CINE BOSS</div>';
    return { subject: 'Tudo liberado - e obrigado pela sua confianca - CINE BOSS', html: shell('Tudo liberado - CINE BOSS', body) };
}

module.exports = { accessLiberated, issueResolved };
