import { NextResponse } from 'next/server';
import { gymStore } from '@/lib/store';
import { Invoice } from '@/lib/types';
import { generateWhatsAppMessage, sendAutomatedWhatsApp } from '@/lib/whatsapp';
import { sendEmailAlert } from '@/lib/resend';

// POST /api/billing/renew - Manual Monthly Payment Confirmation by Admin
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      memberId,
      planId,
      paidAmount,
      paymentMode,
      transactionRef,
      discount,
    } = body;

    const member = gymStore.members.find((m) => m.id === memberId);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const plan = gymStore.plans.find((p) => p.id === planId) || gymStore.plans[0];
    const durationDays = plan.durationDays || 30; // Default 1 Month (30 days)

    // Calculate New Extended Expiry Date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let baseDate = new Date();
    if (member.currentEndDate) {
      const existingEnd = new Date(member.currentEndDate);
      // If current membership is still active, add to existing end date
      if (existingEnd >= today) {
        baseDate = existingEnd;
      }
    }

    baseDate.setDate(baseDate.getDate() + durationDays);
    const newEndDate = baseDate.toISOString().split('T')[0];

    const numPlanPrice = Number(plan.price);
    const numDiscount = Number(discount || 0);
    // LIFETIME ADMISSION RULE: Existing members NEVER pay admission fee on renewal!
    const numAdmissionFee = 0; 
    const totalAmount = numPlanPrice - numDiscount;
    const numPaid = Number(paidAmount ?? totalAmount);
    const dueAmount = Math.max(0, totalAmount - numPaid);

    // 1. Update Member Validity
    member.status = 'ACTIVE';
    member.currentPlanName = plan.name;
    member.currentEndDate = newEndDate;

    // 2. Generate Invoice
    const invoiceNum = `INV-${new Date().getFullYear()}-${String(gymStore.invoices.length + 1).padStart(4, '0')}`;
    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invoiceNum,
      memberId: member.id,
      memberName: member.fullName,
      memberPhone: member.phone,
      memberEmail: member.email,
      planName: plan.name,
      planPrice: numPlanPrice,
      admissionFee: numAdmissionFee, // ₹0.00
      discount: numDiscount,
      totalAmount,
      paidAmount: numPaid,
      dueAmount,
      paymentMode: paymentMode || 'UPI',
      transactionRef,
      paymentStatus: dueAmount === 0 ? 'PAID' : numPaid > 0 ? 'PARTIAL' : 'DUE',
      createdAt: new Date().toISOString(),
    };

    gymStore.invoices.unshift(newInvoice);

    // 3. Automated WhatsApp Confirmation to Member
    const whatsappMsg = generateWhatsAppMessage('PAYMENT_CONFIRM', {
      memberName: member.fullName,
      gymName: gymStore.settings.gymName,
      amount: numPaid,
      endDate: newEndDate,
      invoiceNumber: invoiceNum,
    });

    sendAutomatedWhatsApp(member.phone, whatsappMsg);

    // 4. Automated Email Confirmation Receipt
    if (member.email) {
      sendEmailAlert({
        to: member.email,
        subject: `Monthly Renewal Confirmed - ${gymStore.settings.gymName}`,
        memberName: member.fullName,
        gymName: gymStore.settings.gymName,
        type: 'PAYMENT_CONFIRM',
        details: {
          invoiceNumber: invoiceNum,
          amount: numPaid,
          planName: plan.name,
          endDate: newEndDate,
          dueAmount,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Monthly fee confirmed! Validity extended by ${durationDays} days until ${newEndDate}.`,
      member,
      invoice: newInvoice,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
