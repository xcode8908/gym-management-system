import { NextResponse } from 'next/server';

export async function POST() {
  const workerUrl = process.env.WHATSAPP_WORKER_URL || 'http://localhost:4000';

  try {
    const res = await fetch(`${workerUrl}/api/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json().catch(() => ({ success: true }));
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
