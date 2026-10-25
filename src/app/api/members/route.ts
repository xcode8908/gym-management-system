import { NextResponse } from 'next/server';
import { gymStore } from '@/lib/store';
import { Member, MemberDocument, Invoice, NotificationLog } from '@/lib/types';
import { generateWhatsAppMessage, sendAutomatedWhatsApp } from '@/lib/whatsapp';
import { sendEmailAlert } from '@/lib/resend';

// GET /api/members - List all members with filtering
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const filter = searchParams.get('filter'); // 'active', 'expired', 'expiring-7', 'expiring-3', 'expiring-1'
  const search = searchParams.get('search')?.toLowerCase();

  let result = [...gymStore.members];

  // Search by name or phone
  if (search) {
    result = result.filter(
      (m) =>
        m.fullName.toLowerCase().includes(search) ||
        m.phone.includes(search) ||
        m.memberId.toLowerCase().includes(search)
    );
  }

  // Filter logic
  if (filter === 'active') {
    result = result.filter((m) => m.status === 'ACTIVE');
  } else if (filter === 'expired') {
    result = result.filter((m) => m.status === 'EXPIRED');
  } else if (filter === 'expiring-7') {
    result = result.filter((m) => {
      const days = gymStore.getDaysRemaining(m.currentEndDate);
      return m.status === 'ACTIVE' && days <= 7 && days > 0;
    });
  } else if (filter === 'expiring-3') {
    result = result.filter((m) => {
      const days = gymStore.getDaysRemaining(m.currentEndDate);
      return m.status === 'ACTIVE' && days <= 3 && days > 0;
    });
  } else if (filter === 'expiring-1') {
    result = result.filter((m) => {
      const days = gymStore.getDaysRemaining(m.currentEndDate);
      return m.status === 'ACTIVE' && days <= 1 && days >= 0;
    });
  }

  // Compute daysRemaining and attach documents for each member
  const enriched = result.map((m) => ({
    ...m,
    daysRemaining: gymStore.getDaysRemaining(m.currentEndDate),
    documents: gymStore.documents.filter((d) => d.memberId === m.id),
  }));

  return NextResponse.json(enriched);
}

// POST /api/members - New Member Admission & Immediate Billing
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      fullName,
      phone,
      email,
      gender,
      dateOfBirth,
      address,
      emergencyContact,
      photoUrl,
      planId,
      customStartDate,
      admissionFee,
      discount,
      paidAmount,
      paymentMode,
      transactionRef,
      documentName,
      documentType,
      documentUrl,
    } = body;

    // Check if phone already registered (Lifetime Admission check)
    const existingMember = gymStore.members.find((m) => m.phone === phone);
    if (existingMember) {
      return NextResponse.json(
        {
          error: `Member with phone ${phone} already has a Lifetime Admission (#${existingMember.memberId}). Please use the Renew option instead of re-registering.`,
        },
        { status: 400 }
      );
    }

    const plan = gymStore.plans.find((p) => p.id === planId) || gymStore.plans[0];
    const startDate = customStartDate || new Date().toISOString().split('T')[0];
    
    // Calculate End Date: Start Date + plan duration in days
    const end = new Date(startDate);
    end.setDate(end.getDate() + plan.durationDays);
    const endDate = end.toISOString().split('T')[0];

    const memberNum = gymStore.members.length + 101;
    const memberIdCode = `GYM-M${memberNum}`;
    const newMemberId = `mem-${Date.now()}`;

    const numAdmissionFee = Number(admissionFee ?? gymStore.settings.defaultAdmissionFee);
    const numDiscount = Number(discount || 0);
    const numPlanPrice = Number(plan.price);
    const totalAmount = numPlanPrice + numAdmissionFee - numDiscount;
    const numPaid = Number(paidAmount ?? totalAmount);
    const dueAmount = Math.max(0, totalAmount - numPaid);

    // 1. Create Lifetime Member
    const newMember: Member = {
      id: newMemberId,
      memberId: memberIdCode,
      fullName,
      phone,
      email,
      gender: gender || 'Male',
      dateOfBirth,
      address,
      emergencyContact,
      photoUrl: photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
      isLifetimeAdmitted: true,
      admissionDate: startDate,
      admissionFeePaid: numAdmissionFee,
      status: 'ACTIVE',
      currentPlanName: plan.name,
      currentStartDate: startDate,
      currentEndDate: endDate,
    };

    gymStore.members.unshift(newMember);

    // 2. Attach Document if provided
    if (documentUrl) {
      const newDoc: MemberDocument = {
        id: `doc-${Date.now()}`,
        memberId: newMemberId,
        documentType: documentType || 'AADHAAR',
        documentName: documentName || 'Aadhaar_Document',
        fileUrl: documentUrl,
        uploadedAt: new Date().toISOString(),
      };
      gymStore.documents.unshift(newDoc);
    }

    // 3. Create Invoice
    const invoiceNum = `INV-${new Date().getFullYear()}-${String(gymStore.invoices.length + 1).padStart(4, '0')}`;
    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invoiceNum,
      memberId: newMemberId,
      memberName: fullName,
      memberPhone: phone,
      memberEmail: email,
      planName: plan.name,
      planPrice: numPlanPrice,
      admissionFee: numAdmissionFee,
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

    // 4. Send Automated WhatsApp Welcome Message
    const whatsappMsg = generateWhatsAppMessage('WELCOME', {
      memberName: fullName,
      gymName: gymStore.settings.gymName,
      planName: plan.name,
      startDate,
      endDate,
      amount: numPaid,
      dueAmount,
      upiId: gymStore.settings.upiId,
      invoiceNumber: invoiceNum,
    });

    sendAutomatedWhatsApp(phone, whatsappMsg);

    // 5. Send Automated Email Receipt
    if (email) {
      sendEmailAlert({
        to: email,
        subject: `Welcome to ${gymStore.settings.gymName} - Receipt #${invoiceNum}`,
        memberName: fullName,
        gymName: gymStore.settings.gymName,
        type: 'RECEIPT',
        details: {
          invoiceNumber: invoiceNum,
          amount: numPaid,
          planName: plan.name,
          endDate,
          dueAmount,
          upiId: gymStore.settings.upiId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      member: newMember,
      invoice: newInvoice,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT /api/members - Edit & Update Member Profile
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      fullName,
      phone,
      email,
      gender,
      emergencyContact,
      address,
      photoUrl,
      status,
      currentEndDate,
      notes,
    } = body;

    const member = gymStore.members.find((m) => m.id === id);
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Update fields if provided
    if (fullName) member.fullName = fullName;
    if (phone) member.phone = phone;
    if (email !== undefined) member.email = email;
    if (gender) member.gender = gender;
    if (emergencyContact !== undefined) member.emergencyContact = emergencyContact;
    if (address !== undefined) member.address = address;
    if (photoUrl) member.photoUrl = photoUrl;
    if (status) member.status = status;
    if (currentEndDate) member.currentEndDate = currentEndDate;
    if (notes !== undefined) member.notes = notes;

    return NextResponse.json({
      success: true,
      message: `Profile for ${member.fullName} updated successfully!`,
      member,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/members - Delete a member (Protected action)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Member ID required' }, { status: 400 });
    }

    const index = gymStore.members.findIndex((m) => m.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const deleted = gymStore.members.splice(index, 1);
    return NextResponse.json({
      success: true,
      message: `Member ${deleted[0].fullName} removed.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
