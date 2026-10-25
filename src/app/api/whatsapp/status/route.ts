import { NextResponse } from 'next/server';

export async function GET() {
  const workerUrl = process.env.WHATSAPP_WORKER_URL || 'http://localhost:4000';

  try {
    const res = await fetch(`${workerUrl}/status`, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, isConnected: false, status: 'OFFLINE' });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ success: false, isConnected: false, status: 'OFFLINE', error: err.message });
  }
}
