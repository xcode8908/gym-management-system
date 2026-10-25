import { NextResponse } from 'next/server';
import { gymStore } from '@/lib/store';

export async function POST() {
  try {
    gymStore.settings.emailProvider = 'SIMULATOR';
    gymStore.settings.emailUser = '';
    gymStore.settings.emailPassword = '';
    gymStore.settings.resendApiKey = '';
    gymStore.settings.resendFrom = '';
    gymStore.settings.isEmailActive = false;

    return NextResponse.json({
      success: true,
      message: 'Email unlinked successfully! Ab aap naya email ya provider connect kar sakte hain.',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
