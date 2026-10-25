import { NextResponse } from 'next/server';
import { sendEmailAlert, getActiveEmailConfig } from '@/lib/resend';
import { gymStore } from '@/lib/store';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'Valid email address is required' }, { status: 400 });
    }

    const gymName = gymStore.settings.gymName || 'Iron Core Fitness Gym';
    const upiId = gymStore.settings.upiId || 'gym@upi';

    const result = await sendEmailAlert({
      to: email,
      subject: `🏋️ [Test Alert] Official Membership Expiry Notice - ${gymName}`,
      memberName: 'Gym VIP Member',
      gymName,
      type: 'ALERT_3_DAYS',
      details: {
        endDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
        upiId,
      },
    });

    const config = getActiveEmailConfig();

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to send test email',
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      isLive: result.live ?? false,
      provider: config.provider,
      deliveredTo: email,
      message: result.live
        ? `Live test email delivered to ${email} via ${config.provider}! Check your inbox/spam folder.`
        : `Email simulation successful for ${email}! (Running in free dev mode. Connect your Gmail or Resend API key to deliver to real inboxes).`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
