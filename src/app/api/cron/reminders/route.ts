import { NextResponse } from 'next/server';
import { gymStore } from '@/lib/store';
import { generateWhatsAppMessage, sendAutomatedWhatsApp } from '@/lib/whatsapp';
import { sendEmailAlert } from '@/lib/resend';
import { NotificationLog } from '@/lib/types';

// GET or POST /api/cron/reminders
// Triggered every morning at 8:00 AM by Cloudflare Worker Cron (or dashboard test button)
export async function POST(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && cronSecret !== 'dev_cron_secret') {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized cron secret' }, { status: 401 });
    }
  }
  return handleReminders();
}

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && cronSecret !== 'dev_cron_secret') {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized cron secret' }, { status: 401 });
    }
  }
  return handleReminders();
}

async function handleReminders() {
  const settings = gymStore.settings;
  // Rule: NEVER send reminders to members who paused / stopped coming (PAUSED)
  const members = gymStore.members.filter((m) => m.status !== 'PAUSED');
  
  const dispatched: any[] = [];

  for (const member of members) {
    if (!member.currentEndDate) continue;
    
    const days = gymStore.getDaysRemaining(member.currentEndDate);

    // Auto-sync status: If plan has expired, mark status as EXPIRED
    if (days < 0 && member.status === 'ACTIVE') {
      member.status = 'EXPIRED';
    }

    let alertType: 'ALERT_7_DAYS' | 'ALERT_3_DAYS' | 'ALERT_1_DAY' | 'ALERT_OVERDUE' | null = null;
    let subject = '';

    // 1. Advance Reminders (Before Expiry)
    if (days === 7 && settings.alertDay7) {
      alertType = 'ALERT_7_DAYS';
      subject = `💪 7 Days Remaining - ${settings.gymName} Membership`;
    } else if (days === 3 && settings.alertDay3) {
      alertType = 'ALERT_3_DAYS';
      subject = `⚠️ 3 Days Left - Renew Your ${settings.gymName} Access`;
    } else if (days === 1 && settings.alertDay1) {
      alertType = 'ALERT_1_DAY';
      subject = `🚨 Final Notice: Gym Membership Expires Tomorrow!`;
    }
    // 2. Post-Expiry Reminders (Every 2 days after expiry: Day -2, Day -4, Day -6, Day -8, Day -10)
    else if (days < 0 && settings.alertOverdue2Days !== false) {
      const daysOverdue = Math.abs(days);
      // Send every 2 days up to 10 days post-expiry
      if (daysOverdue <= 10 && daysOverdue % 2 === 0) {
        alertType = 'ALERT_OVERDUE';
        subject = `🔴 Membership Overdue (${daysOverdue} Days Ago) - ${settings.gymName}`;
      }
    }

    if (alertType) {
      const daysOverdue = days < 0 ? Math.abs(days) : undefined;

      // 1. WhatsApp Dispatch (With anti-ban delay)
      const waText = generateWhatsAppMessage(alertType, {
        memberName: member.fullName,
        gymName: settings.gymName,
        endDate: member.currentEndDate,
        upiId: settings.upiId,
        daysOverdue,
      });

      const waResult = await sendAutomatedWhatsApp(member.phone, waText);

      // Log WhatsApp
      const waLog: NotificationLog = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        memberId: member.id,
        memberName: member.fullName,
        channel: 'WHATSAPP',
        alertType,
        recipient: member.phone,
        messagePreview: waText.slice(0, 80) + '...',
        status: waResult.success ? 'SENT' : 'FAILED',
        sentAt: new Date().toISOString(),
      };
      gymStore.notifications.unshift(waLog);

      // 2. Email Dispatch
      if (member.email) {
        await sendEmailAlert({
          to: member.email,
          subject,
          memberName: member.fullName,
          gymName: settings.gymName,
          type: alertType,
          details: {
            endDate: member.currentEndDate,
            upiId: settings.upiId,
            daysOverdue,
          },
        });

        // Log Email
        const emailLog: NotificationLog = {
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          memberId: member.id,
          memberName: member.fullName,
          channel: 'EMAIL',
          alertType,
          recipient: member.email,
          messagePreview: subject,
          status: 'SENT',
          sentAt: new Date().toISOString(),
        };
        gymStore.notifications.unshift(emailLog);
      }

      dispatched.push({
        member: member.fullName,
        phone: member.phone,
        daysRemaining: days,
        alertType,
      });
    }
  }

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    totalActiveChecked: members.length,
    alertsDispatchedCount: dispatched.length,
    dispatched,
  });
}
