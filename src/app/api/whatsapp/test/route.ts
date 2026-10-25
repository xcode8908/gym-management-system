import { NextResponse } from 'next/server';
import { sendAutomatedWhatsApp } from '@/lib/whatsapp';

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    if (!phone) {
      return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 });
    }

    const testMessage = `🏋️ *Iron Core Gym - Bot Test Successful!*
Hello! This is a live automated message from your Hands-Free WhatsApp Engine.
Your Gym Bot is 100% CONNECTED and authenticated.
Expiry reminders and payment receipts will now be sent automatically! 💪💥`;

    const result = await sendAutomatedWhatsApp(phone, testMessage);

    if (result.success) {
      return NextResponse.json({ success: true, message: `✅ Live WhatsApp message sent to ${phone}!` });
    } else {
      return NextResponse.json({ success: false, error: result.error || 'Failed to send' }, { status: 500 });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
