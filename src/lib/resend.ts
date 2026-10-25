// Multi-Provider Email Integration (Gmail SMTP + Resend API + Dev Simulator)
import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { gymStore } from './store';

export function getActiveEmailConfig() {
  const settings = gymStore.settings;

  // 1. Direct Gmail SMTP via Gym Settings
  if (settings.emailProvider === 'GMAIL' && settings.emailUser && settings.emailPassword) {
    return {
      provider: 'GMAIL' as const,
      user: settings.emailUser,
      isConfigured: true,
      senderLabel: `${settings.gymName || 'Gym'} <${settings.emailUser}>`,
    };
  }

  // 2. Resend via Gym Settings or .env.local
  const resendKey = settings.resendApiKey || process.env.RESEND_API_KEY;
  if (resendKey && !resendKey.includes('dummy') && resendKey.startsWith('re_')) {
    const from = settings.resendFrom || process.env.RESEND_FROM_EMAIL || 'Gym Alerts <onboarding@resend.dev>';
    return {
      provider: 'RESEND' as const,
      apiKey: resendKey,
      from,
      isConfigured: true,
      senderLabel: from,
    };
  }

  // 3. Fallback Simulator Mode
  return {
    provider: 'SIMULATOR' as const,
    isConfigured: false,
    senderLabel: `${settings.gymName || 'Gym'} <${settings.email || 'billing@gym.com'}>`,
  };
}

export function isResendConfigured(): boolean {
  return getActiveEmailConfig().isConfigured;
}

export function getResendFromEmail(): string {
  return getActiveEmailConfig().senderLabel;
}

export async function sendEmailAlert(params: {
  to: string;
  subject: string;
  memberName: string;
  gymName: string;
  type: 'RECEIPT' | 'ALERT_7_DAYS' | 'ALERT_3_DAYS' | 'ALERT_1_DAY' | 'ALERT_OVERDUE' | 'PAYMENT_CONFIRM';
  details?: {
    invoiceNumber?: string;
    amount?: number;
    planName?: string;
    endDate?: string;
    dueAmount?: number;
    upiId?: string;
    daysOverdue?: number;
  };
}) {
  const { to, subject, memberName, gymName, type, details } = params;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; margin: 0; }
        .card { background: #1e293b; border-radius: 16px; padding: 28px; max-width: 520px; margin: 0 auto; border: 1px solid #334155; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .header { border-bottom: 2px solid ${type === 'ALERT_OVERDUE' ? '#f43f5e' : '#06b6d4'}; padding-bottom: 14px; margin-bottom: 20px; }
        .title { color: ${type === 'ALERT_OVERDUE' ? '#f43f5e' : '#06b6d4'}; font-size: 22px; font-weight: bold; margin: 0; }
        .subtitle { color: #94a3b8; font-size: 13px; margin-top: 4px; }
        .content { font-size: 14px; line-height: 1.6; color: #e2e8f0; }
        .box { background: #0f172a; border-radius: 12px; padding: 16px; margin: 18px 0; border: 1px solid #334155; }
        .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
        .label { color: #94a3b8; }
        .value { color: #f8fafc; font-weight: bold; }
        .footer { text-align: center; margin-top: 24px; color: #64748b; font-size: 12px; border-top: 1px solid #334155; padding-top: 14px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="title">🏋️ ${gymName}</div>
          <div class="subtitle">${type === 'ALERT_OVERDUE' ? 'Membership Expiry Notice' : 'Official Membership Notification'}</div>
        </div>
        <div class="content">
          <p>Hi <strong>${memberName}</strong>,</p>
          ${
            type === 'RECEIPT' || type === 'PAYMENT_CONFIRM'
              ? `<p>Aapka payment successfully record ho chuka hai. Thank you for continuing your fitness journey with us!</p>
                 <div class="box">
                   ${details?.invoiceNumber ? `<div class="row"><span class="label">Invoice No:</span><span class="value">#${details.invoiceNumber}</span></div>` : ''}
                   <div class="row"><span class="label">Plan:</span><span class="value">${details?.planName || 'Gym Access'}</span></div>
                   <div class="row"><span class="label">Amount Paid:</span><span class="value">₹${details?.amount || 0}</span></div>
                   <div class="row"><span class="label">Valid Until:</span><span class="value">${details?.endDate || 'N/A'}</span></div>
                   ${details?.dueAmount && details.dueAmount > 0 ? `<div class="row"><span class="label">Balance Due:</span><span class="value" style="color: #ef4444;">₹${details.dueAmount}</span></div>` : ''}
                 </div>`
              : type === 'ALERT_OVERDUE'
              ? `<p style="color: #f43f5e; font-weight: bold;">Aapki gym membership expire ho chuki hai.</p>
                 <p>Aapki membership ${details?.daysOverdue || 2} din pehle (${details?.endDate || 'Recently'}) expire hui thi.</p>
                 <div class="box">
                   <div class="row"><span class="label">Expired Date:</span><span class="value" style="color: #f43f5e;">${details?.endDate || 'Expired'}</span></div>
                   <div class="row"><span class="label">Pay & Renew via UPI:</span><span class="value" style="color: #06b6d4;">${details?.upiId || 'front-desk'}</span></div>
                 </div>
                 <p>Workout regular rakhne ke liye reception par renewal karayein ya UPI se pay karein. Agar aapne membership temporary pause ki hai, toh kripya reception par bata dein.</p>`
              : `<p>Aapki gym membership expiry se sambandhit yeh official notification hai:</p>
                 <div class="box">
                   <div class="row"><span class="label">Expiry Date:</span><span class="value">${details?.endDate || 'Soon'}</span></div>
                   <div class="row"><span class="label">Payment UPI ID:</span><span class="value" style="color: #06b6d4;">${details?.upiId || 'front-desk'}</span></div>
                 </div>
                 <p>Apna daily workout uninterrupted rakhne ke liye gym counter par ya UPI ke madhyam se renewal karein.</p>`
          }
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} ${gymName}. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  const config = getActiveEmailConfig();

  // Mode 1: Gmail SMTP
  if (config.provider === 'GMAIL') {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: config.user,
          pass: gymStore.settings.emailPassword,
        },
      });

      await transporter.sendMail({
        from: config.senderLabel,
        to,
        subject,
        html: htmlContent,
      });

      console.log(`[GMAIL SMTP] Delivered to ${to}: ${subject}`);
      return { success: true, live: true, provider: 'GMAIL' };
    } catch (err: any) {
      console.error('Gmail SMTP Delivery Failed:', err);
      return { success: false, live: false, error: err.message };
    }
  }

  // Mode 2: Resend API
  if (config.provider === 'RESEND') {
    try {
      const resend = new Resend(config.apiKey);
      const data = await resend.emails.send({
        from: config.from,
        to,
        subject,
        html: htmlContent,
      });
      console.log(`[RESEND API] Delivered to ${to}: ${subject}`);
      return { success: true, live: true, provider: 'RESEND', data };
    } catch (err: any) {
      console.error('Resend API Delivery Failed:', err);
      return { success: false, live: false, error: err.message };
    }
  }

  // Mode 3: Simulator Mode
  console.log(`[SIMULATED EMAIL] to ${to}: ${subject}`);
  return { success: true, live: false, simulated: true };
}
