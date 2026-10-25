import { NextResponse } from 'next/server';
import { gymStore } from '@/lib/store';

export async function GET() {
  return NextResponse.json({
    settings: gymStore.settings,
    plans: gymStore.plans,
  });
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { settings, plans } = body;

    if (settings) {
      gymStore.settings = {
        ...gymStore.settings,
        ...settings,
        defaultAdmissionFee: Number(settings.defaultAdmissionFee || 0),
      };
    }

    if (plans && Array.isArray(plans)) {
      gymStore.plans = plans.map((p: any) => ({
        ...p,
        durationDays: Number(p.durationDays),
        price: Number(p.price),
      }));
    }

    return NextResponse.json({
      success: true,
      settings: gymStore.settings,
      plans: gymStore.plans,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
