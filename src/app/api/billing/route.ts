import { NextResponse } from 'next/server';
import { gymStore } from '@/lib/store';
import { Invoice } from '@/lib/types';
import { generateWhatsAppMessage, sendAutomatedWhatsApp } from '@/lib/whatsapp';
import { sendEmailAlert } from '@/lib/resend';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status'); // 'all', 'paid', 'due', 'partial'

  let list = [...gymStore.invoices];
  if (status === 'due' || status === 'partial') {
    list = list.filter((inv) => inv.dueAmount > 0);
  } else if (status === 'paid') {
    list = list.filter((inv) => inv.dueAmount === 0);
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const todayInvoices = gymStore.invoices.filter((inv) => inv.createdAt.startsWith(todayStr));
  const todayCollected = todayInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);

  return NextResponse.json({
    invoices: list,
    metrics: {
      totalCollected: gymStore.invoices.reduce((sum, inv) => sum + inv.paidAmount, 0),
      todayCollected,
      totalDue: gymStore.invoices.reduce((sum, inv) => sum + inv.dueAmount, 0),
      totalCount: gymStore.invoices.length,
      dueCount: gymStore.invoices.filter((inv) => inv.dueAmount > 0).length,
    },
  });
}

// POST /api/billing - Create New Bill / Collect Fee for any Member
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      memberId,
      planId,
      customTitle,
      amount,
      admissionFee,
      discount,
      paidAmount,
      paymentMode,
      transactionRef,
      dueDate,
      extendValidity = true,
    } = body;

    const member = gymStore.members.find((m) => m.id === memberId);
    if (!member) {
      return NextResponse.json({ error: 'Please select a valid member' }, { status: 400 });
    }

    const plan = gymStore.plans.find((p) => p.id === planId);
    const planName = plan ? plan.name : (customTitle || 'Monthly Gym Fee');
    const planPrice = Number(amount ?? plan?.price ?? 1200);

    // Lifetime Admission Rule: Existing members ALWAYS have ₹0.00 admission fee on billing!
    const numAdmissionFee = Number(admissionFee || 0);
    const numDiscount = Number(discount || 0);
    const totalAmount = planPrice + numAdmissionFee - numDiscount;
    const numPaid = Number(paidAmount ?? totalAmount);
    const dueAmount = Math.max(0, totalAmount - numPaid);

    // If extending validity (and plan duration is known or default 30 days)
    if (extendValidity) {
      const durationDays = plan?.durationDays || 30;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let baseDate = new Date();
      if (member.currentEndDate) {
        const existingEnd = new Date(member.currentEndDate);
        if (existingEnd >= today) {
          baseDate = existingEnd; // Add on top of remaining days
        }
      }
      baseDate.setDate(baseDate.getDate() + durationDays);
      member.currentEndDate = baseDate.toISOString().split('T')[0];
      member.status = 'ACTIVE';
      member.currentPlanName = planName;
    }

    // Generate unique Invoice
    const invoiceNum = `INV-${new Date().getFullYear()}-${String(gymStore.invoices.length + 1).padStart(4, '0')}`;
    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invoiceNum,
      memberId: member.id,
      memberName: member.fullName,
      memberPhone: member.phone,
      memberEmail: member.email,
      planName,
      planPrice,
      admissionFee: numAdmissionFee,
      discount: numDiscount,
      totalAmount,
      paidAmount: numPaid,
      dueAmount,
      dueDate: dueAmount > 0 ? (dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]) : undefined,
      paymentMode: paymentMode || 'UPI',
      transactionRef,
      paymentStatus: dueAmount === 0 ? 'PAID' : numPaid > 0 ? 'PARTIAL' : 'DUE',
      createdAt: new Date().toISOString(),
    };

    gymStore.invoices.unshift(newInvoice);

    // Dispatch automated WhatsApp Receipt
    const whatsappMsg = generateWhatsAppMessage('INVOICE', {
      memberName: member.fullName,
      gymName: gymStore.settings.gymName,
      planName,
      amount: numPaid,
      dueAmount,
      endDate: member.currentEndDate,
      invoiceNumber: invoiceNum,
      upiId: gymStore.settings.upiId,
    });
    sendAutomatedWhatsApp(member.phone, whatsappMsg);

    // Dispatch automated Email Receipt
    if (member.email) {
      sendEmailAlert({
        to: member.email,
        subject: `Payment Receipt #${invoiceNum} - ${gymStore.settings.gymName}`,
        memberName: member.fullName,
        gymName: gymStore.settings.gymName,
        type: 'RECEIPT',
        details: {
          invoiceNumber: invoiceNum,
          amount: numPaid,
          planName,
          endDate: member.currentEndDate,
          dueAmount,
          upiId: gymStore.settings.upiId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Invoice #${invoiceNum} generated and payment recorded successfully!`,
      invoice: newInvoice,
      member,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
