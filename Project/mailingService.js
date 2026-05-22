const { Resend } = require('resend');
require('dotenv').config();

function buildEmailHtml(alertas) {
    const linhasHtml = alertas.map((a) => {
        const cor = a.tipo === 'critico' ? '#c0392b' : '#e67e22';
        const emoji = a.tipo === 'critico' ? '🔴' : '🟠';
        return `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          <strong style="color: ${cor};">${emoji} ${a.tipo.toUpperCase()}</strong><br/>
          <span><strong>Local:</strong> ${a.local}</span><br/>
          <span>${a.mensagem}</span>
        </td>
      </tr>`;
    }).join('');

    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h2 style="background: #2c3e50; color: white; padding: 15px; border-radius: 4px 4px 0 0; margin: 0;">
        🌿 Sistema de Monitoramento de Folhas — Alertas
      </h2>
      <p style="padding: 10px 0; color: #555;">
        Foram detectados <strong>${alertas.length}</strong> alerta(s) que requerem atenção imediata:
      </p>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd; border-radius: 4px;">
        <tbody>${linhasHtml}</tbody>
      </table>
      <p style="color: #888; font-size: 12px; margin-top: 20px;">
        Este e-mail foi gerado automaticamente pelo sistema de análise de folhas.
      </p>
    </div>
  `;
}

// Chamado automaticamente pelo alertService após gerar os alertas
async function enviarAlertas(alertas) {
    const alertasCriticos = alertas.filter(
        (a) => a.tipo === 'surto' || a.tipo === 'critico'
    );

    if (alertasCriticos.length === 0) {
        console.log('📧 Nenhum alerta de surto ou crítico — e-mail não enviado.');
        return;
    }

    try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const response = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: process.env.RECEPIENT,
            subject: `🚨 Alerta Agrícola: ${alertasCriticos.length} alerta(s) de surto/crítico detectado(s)`,
            html: buildEmailHtml(alertasCriticos),
        });
        console.log(`📧 E-mail disparado com ${alertasCriticos.length} alerta(s):`, response);
    } catch (err) {
        console.error('❌ Erro ao enviar e-mail de alerta:', err.message);
    }
}

// Rota manual /mail mantida para testes
const Mailer = async (req, res) => {
    const fs = require('fs');
    let alertas = [];
    try {
        alertas = JSON.parse(fs.readFileSync('./alerts.json', 'utf8'));
    } catch (e) {
        return res.status(500).json({ error: 'Erro ao ler arquivo de alertas.' });
    }

    const alertasCriticos = alertas.filter(
        (a) => a.tipo === 'surto' || a.tipo === 'critico'
    );

    if (alertasCriticos.length === 0) {
        return res.status(200).json({ message: 'Nenhum alerta de surto ou crítico. Nenhum e-mail enviado.' });
    }

    try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const response = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'camedus@gmail.com',
            subject: `🚨 Alerta Agrícola: ${alertasCriticos.length} alerta(s) de surto/crítico detectado(s)`,
            html: buildEmailHtml(alertasCriticos),
        });
        return res.status(200).json({ message: 'E-mail enviado com sucesso.', alertasEnviados: alertasCriticos, resendResponse: response });
    } catch (err) {
        return res.status(500).json({ error: 'Erro ao enviar e-mail.', details: err.message });
    }
};

module.exports = Mailer;
module.exports.enviarAlertas = enviarAlertas;
