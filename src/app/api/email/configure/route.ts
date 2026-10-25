import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { gymStore } from '@/lib/store';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { provider, emailUser, emailPassword, resendApiKey, resendFrom } = body;

    if (provider === 'GMAIL') {
      if (!emailUser || !emailPassword) {
        return NextResponse.json({ success: false, error: 'Gmail ID aur App Password dono zaroori hain' }, { status: 400 });
      }

      // Test Gmail credentials
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser.trim(),
          pass: emailPassword.trim().replace(/\s+/g, ''),
        },
      });

      try {
        await transporter.verify();
      } catch (verifyErr: any) {
        return NextResponse.json({
          success: false,
          error: `Gmail Connection Failed: ${verifyErr.message}. Kripya apna 16-character Google App Password check karein.`,
        }, { status: 400 });
      }

      // Save settings
      gymStore.settings.emailProvider = 'GMAIL';
      gymStore.settings.emailUser = emailUser.trim();
      gymStore.settings.emailPassword = emailPassword.trim().replace(/\s+/g, '');
      gymStore.settings.isEmailActive = true;

      return NextResponse.json({
        success: true,
        message: `Gmail (${emailUser}) successfully connected! Ab automated alerts live send honge.`,
      });
    }

    if (provider === 'RESEND') {
      if (!resendApiKey || !resendApiKey.startsWith('re_')) {
        return NextResponse.json({ success: false, error: 'Valid Resend API Key (starts with re_) required' }, { status: 400 });
      }

      gymStore.settings.emailProvider = 'RESEND';
      gymStore.settings.resendApiKey = resendApiKey.trim();
      if (resendFrom) gymStore.settings.resendFrom = resendFrom.trim();
      gymStore.settings.isEmailActive = true;

      return NextResponse.json({
        success: true,
        message: 'Resend API Key successfully connected! Email Engine is now Active.',
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid email provider specified' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
