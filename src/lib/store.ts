import { GymSettings, Member, MemberDocument, Plan, Invoice, NotificationLog } from './types';

// Helper to calculate relative date string YYYY-MM-DD
function getRelativeDate(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

// In-Memory Data Store (Provides instantaneous local dev experience and bridges to Neon DB)
class GymDataStore {
  settings: GymSettings = {
    id: 'settings-1',
    gymName: 'Iron Core Fitness & Gym',
    logoUrl: '',
    phone: '+91 98765 43210',
    email: 'billing@ironcoregym.com',
    address: 'Plot 42, Sector 18, Commercial Hub, New Delhi',
    upiId: 'ironcore@upi',
    defaultAdmissionFee: 500,
    enableAdmissionFee: true,
    alertDay7: true,
    alertDay3: true,
    alertDay1: true,
    alertOverdue2Days: true,
    emailProvider: 'SIMULATOR',
    emailUser: '',
    emailPassword: '',
    resendApiKey: '',
    resendFrom: '',
    isEmailActive: false,
  };

  plans: Plan[] = [
    {
      id: 'plan-1',
      name: '1 Month General Fitness',
      durationDays: 30,
      price: 1200,
      description: 'Access to cardio and strength floor for 30 days',
      isActive: true,
    },
    {
      id: 'plan-2',
      name: '3 Months Strength & Conditioning',
      durationDays: 90,
      price: 3000,
      description: 'Full workout floor + locker access (Most Popular)',
      isActive: true,
    },
    {
      id: 'plan-3',
      name: '6 Months Muscle Transformation',
      durationDays: 180,
      price: 5500,
      description: 'Includes diet consultation and progress tracking',
      isActive: true,
    },
    {
      id: 'plan-4',
      name: '1 Year VIP Annual Access',
      durationDays: 365,
      price: 9999,
      description: 'Unlimited access + steam room + guest passes',
      isActive: true,
    },
  ];

  members: Member[] = [
    {
      id: 'mem-1',
      memberId: 'GYM-M101',
      fullName: 'Aman Sharma',
      phone: '+91 98111 22334',
      email: 'aman.sharma@example.com',
      gender: 'Male',
      dateOfBirth: '1998-05-14',
      address: 'A-24 Rajouri Garden',
      emergencyContact: '+91 98111 22330',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
      isLifetimeAdmitted: true,
      admissionDate: '2026-01-15',
      admissionFeePaid: 500,
      status: 'ACTIVE',
      currentPlanName: '3 Months Strength & Conditioning',
      currentStartDate: getRelativeDate(-83),
      currentEndDate: getRelativeDate(7), // Exactly 7 days remaining!
      notes: 'Chest & Shoulders focus',
    },
    {
      id: 'mem-2',
      memberId: 'GYM-M102',
      fullName: 'Priya Verma',
      phone: '+91 98222 33445',
      email: 'priya.v@example.com',
      gender: 'Female',
      dateOfBirth: '2001-08-22',
      address: 'B-12 Vasant Kunj',
      emergencyContact: '+91 98222 33440',
      photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
      isLifetimeAdmitted: true,
      admissionDate: '2026-02-01',
      admissionFeePaid: 500,
      status: 'ACTIVE',
      currentPlanName: '1 Month General Fitness',
      currentStartDate: getRelativeDate(-27),
      currentEndDate: getRelativeDate(3), // Exactly 3 days remaining!
      notes: 'Morning batch 7:00 AM',
    },
    {
      id: 'mem-3',
      memberId: 'GYM-M103',
      fullName: 'Vikram Singh',
      phone: '+91 98333 44556',
      email: 'vikram.singh@example.com',
      gender: 'Male',
      dateOfBirth: '1995-11-03',
      address: 'C-8 Preet Vihar',
      emergencyContact: '+91 98333 44550',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      isLifetimeAdmitted: true,
      admissionDate: '2025-10-10',
      admissionFeePaid: 500,
      status: 'ACTIVE',
      currentPlanName: '6 Months Muscle Transformation',
      currentStartDate: getRelativeDate(-179),
      currentEndDate: getRelativeDate(1), // Exactly 1 day remaining!
      notes: 'Bodybuilding preparation',
    },
    {
      id: 'mem-4',
      memberId: 'GYM-M104',
      fullName: 'Rohit Malhotra',
      phone: '+91 98444 55667',
      email: 'rohit.m@example.com',
      gender: 'Male',
      dateOfBirth: '2000-02-19',
      address: 'House 55, Model Town',
      emergencyContact: '+91 98444 55660',
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      isLifetimeAdmitted: true,
      admissionDate: '2026-03-01',
      admissionFeePaid: 500,
      status: 'ACTIVE',
      currentPlanName: '3 Months Strength & Conditioning',
      currentStartDate: getRelativeDate(-10),
      currentEndDate: getRelativeDate(80),
      notes: 'Partial fee paid. ₹1,000 due next week.',
    },
    {
      id: 'mem-5',
      memberId: 'GYM-M105',
      fullName: 'Kunal Kapoor',
      phone: '+91 98555 66778',
      email: 'kunal.k@example.com',
      gender: 'Male',
      dateOfBirth: '1997-07-30',
      address: 'Flat 301, Greenfield Heights',
      emergencyContact: '+91 98555 66770',
      photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&h=150&fit=crop&crop=face',
      isLifetimeAdmitted: true,
      admissionDate: '2025-05-12',
      admissionFeePaid: 500,
      status: 'EXPIRED',
      currentPlanName: '1 Month General Fitness',
      currentStartDate: getRelativeDate(-60),
      currentEndDate: getRelativeDate(-30), // Expired 30 days ago
      notes: 'Taking break for exams. Will rejoin with ₹0 admission fee.',
    },
  ];

  documents: MemberDocument[] = [
    {
      id: 'doc-1',
      memberId: 'mem-1',
      documentType: 'AADHAAR',
      documentName: 'Aadhaar_Card_Aman_Sharma.pdf',
      fileUrl: 'https://pub-r2.dev/docs/aadhaar_sample_1.pdf',
      fileSize: 420,
      uploadedAt: '2026-01-15T10:30:00Z',
    },
    {
      id: 'doc-2',
      memberId: 'mem-2',
      documentType: 'DRIVING_LICENSE',
      documentName: 'DL_Priya_Verma.jpg',
      fileUrl: 'https://pub-r2.dev/docs/dl_sample_2.jpg',
      fileSize: 850,
      uploadedAt: '2026-02-01T11:15:00Z',
    },
  ];

  invoices: Invoice[] = [
    {
      id: 'inv-1',
      invoiceNumber: 'INV-2026-0001',
      memberId: 'mem-1',
      memberName: 'Aman Sharma',
      memberPhone: '+91 98111 22334',
      memberEmail: 'aman.sharma@example.com',
      planName: '3 Months Strength & Conditioning',
      planPrice: 3000,
      admissionFee: 500,
      discount: 200,
      totalAmount: 3300,
      paidAmount: 3300,
      dueAmount: 0,
      paymentMode: 'UPI',
      transactionRef: 'UPI/9811122334/260115',
      paymentStatus: 'PAID',
      createdAt: '2026-01-15T10:35:00Z',
    },
    {
      id: 'inv-2',
      invoiceNumber: 'INV-2026-0002',
      memberId: 'mem-2',
      memberName: 'Priya Verma',
      memberPhone: '+91 98222 33445',
      memberEmail: 'priya.v@example.com',
      planName: '1 Month General Fitness',
      planPrice: 1200,
      admissionFee: 500,
      discount: 0,
      totalAmount: 1700,
      paidAmount: 1700,
      dueAmount: 0,
      paymentMode: 'CASH',
      paymentStatus: 'PAID',
      createdAt: '2026-02-01T11:20:00Z',
    },
    {
      id: 'inv-3',
      invoiceNumber: 'INV-2026-0003',
      memberId: 'mem-4',
      memberName: 'Rohit Malhotra',
      memberPhone: '+91 98444 55667',
      memberEmail: 'rohit.m@example.com',
      planName: '3 Months Strength & Conditioning',
      planPrice: 3000,
      admissionFee: 500,
      discount: 0,
      totalAmount: 3500,
      paidAmount: 2500,
      dueAmount: 1000, // Due balance!
      dueDate: getRelativeDate(5),
      paymentMode: 'UPI',
      transactionRef: 'UPI/ROHIT/260301',
      paymentStatus: 'PARTIAL',
      createdAt: getRelativeDate(-10) + 'T14:10:00Z',
    },
  ];

  notifications: NotificationLog[] = [
    {
      id: 'notif-1',
      memberId: 'mem-1',
      memberName: 'Aman Sharma',
      channel: 'WHATSAPP',
      alertType: '7_DAY_EXPIRY',
      recipient: '+91 98111 22334',
      messagePreview: 'Hi Aman! Your gym membership expires in 7 days. Renew today via UPI: ironcore@upi',
      status: 'SENT',
      sentAt: new Date().toISOString(),
    },
    {
      id: 'notif-2',
      memberId: 'mem-2',
      memberName: 'Priya Verma',
      channel: 'WHATSAPP',
      alertType: '3_DAY_EXPIRY',
      recipient: '+91 98222 33445',
      messagePreview: 'Hi Priya! Only 3 days left on your gym membership. Renew before 27-Oct.',
      status: 'SENT',
      sentAt: new Date().toISOString(),
    },
    {
      id: 'notif-3',
      memberId: 'mem-3',
      memberName: 'Vikram Singh',
      channel: 'EMAIL',
      alertType: '1_DAY_EXPIRY',
      recipient: 'vikram.singh@example.com',
      messagePreview: 'Final Notice: Your gym membership expires tomorrow!',
      status: 'SENT',
      sentAt: new Date().toISOString(),
    },
  ];

  // Helper methods
  getDaysRemaining(endDateStr?: string): number {
    if (!endDateStr) return 0;
    const end = new Date(endDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getDashboardMetrics() {
    const totalMembers = this.members.length;
    const activeMembers = this.members.filter((m) => m.status === 'ACTIVE').length;
    const expiredMembers = this.members.filter((m) => m.status === 'EXPIRED').length;

    // Filter alerts
    const expiring7Days = this.members.filter((m) => {
      const days = this.getDaysRemaining(m.currentEndDate);
      return m.status === 'ACTIVE' && days <= 7 && days > 3;
    });

    const expiring3Days = this.members.filter((m) => {
      const days = this.getDaysRemaining(m.currentEndDate);
      return m.status === 'ACTIVE' && days <= 3 && days > 1;
    });

    const expiring1Day = this.members.filter((m) => {
      const days = this.getDaysRemaining(m.currentEndDate);
      return m.status === 'ACTIVE' && days <= 1 && days >= 0;
    });

    const pendingDues = this.invoices.filter((inv) => inv.dueAmount > 0);
    const totalDueAmount = pendingDues.reduce((sum, inv) => sum + inv.dueAmount, 0);
    const totalRevenue = this.invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);

    return {
      totalMembers,
      activeMembers,
      expiredMembers,
      expiring7DaysCount: expiring7Days.length,
      expiring3DaysCount: expiring3Days.length,
      expiring1DayCount: expiring1Day.length,
      totalDueAmount,
      totalRevenue,
      pendingDuesCount: pendingDues.length,
    };
  }
}

// Global Singleton
let globalStore: GymDataStore;
if ((global as any).gymStore && (global as any).gymStore.checkInMember && (global as any).gymStore.attendance) {
  globalStore = (global as any).gymStore;
} else {
  globalStore = new GymDataStore();
  if (process.env.NODE_ENV !== 'production') {
    (global as any).gymStore = globalStore;
  }
}

export const gymStore = globalStore;
