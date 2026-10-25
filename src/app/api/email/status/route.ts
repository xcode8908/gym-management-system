import { NextResponse } from 'next/server';
import { getActiveEmailConfig } from '@/lib/resend';
import { gymStore } from '@/lib/store';

export async function GET() {
  try {
    const config = getActiveEmailConfig();

    return NextResponse.json({
      success: true,
      isConnected: config.isConfigured,
      isLive: config.isConfigured,
      provider: config.provider,
      senderLabel: config.senderLabel,
      emailUser: gymStore.settings.emailUser || '',
      resendFrom: gymStore.settings.resendFrom || '',
      gymEmail: gymStore.settings.email || '',
      status: config.isConfigured ? 'CONNECTED' : 'DISCONNECTED',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
