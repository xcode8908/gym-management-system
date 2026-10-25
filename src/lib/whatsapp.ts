// WhatsApp Helper Utilities
// 1. wa.me Instant Direct Click Link (100% Free, Zero Ban Risk)
// 2. Render Worker API Dispatcher (Automated hands-free messaging)

export function generateWhatsAppMessage(type: 'WELCOME' | 'INVOICE' | 'ALERT_7_DAYS' | 'ALERT_3_DAYS' | 'ALERT_1_DAY' | 'ALERT_OVERDUE' | 'PAYMENT_CONFIRM', data: {
  memberName: string;
  gymName: string;
  planName?: string;
  startDate?: string;
  endDate?: string;
  amount?: number;
  dueAmount?: number;
  dueDate?: string;
  upiId?: string;
  invoiceNumber?: string;
  daysOverdue?: number;
}): string {
  const { memberName, gymName, planName, endDate, amount, dueAmount, upiId, invoiceNumber, daysOverdue } = data;

  switch (type) {
    case 'WELCOME':
      return `🏋️ *Welcome to ${gymName}!*
Hi ${memberName}, your admission is confirmed.
Plan: ${planName || 'General Membership'}
Valid Till: ${endDate}
Let's build strength together! 💪`;

    case 'INVOICE':
      return `🧾 *Payment Receipt - ${gymName}*
Invoice: #${invoiceNumber}
Member: ${memberName}
Plan: ${planName}
Amount Paid: ₹${amount}
${dueAmount && dueAmount > 0 ? `Pending Due: ₹${dueAmount}` : 'Status: Fully Paid ✅'}
Thank you for working out with us!`;

    case 'ALERT_7_DAYS':
      return `💪 *Reminder from ${gymName}*
Hi ${memberName}! Your gym membership expires in *7 days* (${endDate}).
Renew before expiry to keep your routine uninterrupted.
Pay via UPI: ${upiId || 'front-desk'}`;

    case 'ALERT_3_DAYS':
      return `⚠️ *Renewal Alert - ${gymName}*
Hi ${memberName}! Only *3 days left* on your membership (Expires: ${endDate}).
Renew today at the front desk or via UPI: ${upiId || 'front-desk'}`;

    case 'ALERT_1_DAY':
      return `🚨 *Final Reminder - ${gymName}*
Hi ${memberName}! Tomorrow is the *last day* of your gym access.
Please renew today to avoid any workout disruption.
UPI ID: ${upiId || 'front-desk'}`;

    case 'ALERT_OVERDUE':
      return `🔴 *Membership Overdue - ${gymName}*
Hi ${memberName}, aapki gym membership *${daysOverdue || 2} din pehle* (${endDate}) expire ho chuki hai.
Gym workout continue rakhne ke liye kripya renewal karayein.
Pay via UPI: ${upiId || 'front-desk'}
(Agar aapne membership pause ki hai ya chhutti par hain, toh kripya reception par update karein. 🙏)`;

    case 'PAYMENT_CONFIRM':
      return `✅ *Monthly Fee Confirmed - ${gymName}*
Hi ${memberName}, we have received your payment of *₹${amount}*.
Your gym access has been extended till *${endDate}*.
See you on the workout floor! 💥`;

    default:
      return `Hello ${memberName}, message from ${gymName}.`;
  }
}

// Generate direct wa.me link for browser 1-click WhatsApp
export function getDirectWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

// Dispatch to Baileys WhatsApp Bot Worker for fully automated hands-free messaging
export async function sendAutomatedWhatsApp(phone: string, message: string): Promise<{ success: boolean; error?: string }> {
  const workerUrl = process.env.WHATSAPP_WORKER_URL;
  const workerSecret = process.env.WHATSAPP_API_SECRET || 'dev_whatsapp_secret';

  if (!workerUrl) {
    console.log(`[DEV WHATSAPP BOT] (No Worker URL set) Simulated sending to ${phone}: \n${message}`);
    return { success: true };
  }

  try {
    const res = await fetch(`${workerUrl}/api/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${workerSecret}`,
      },
      body: JSON.stringify({ phone, message }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Worker responded with status ${res.status}`);
    }

    return { success: true };
  } catch (err: any) {
    console.error('Failed to send automated WhatsApp message:', err.message);
    return { success: false, error: err.message };
  }
}
