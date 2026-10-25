export interface GymSettings {
  id: string;
  gymName: string;
  logoUrl?: string;
  phone: string;
  email: string;
  address: string;
  upiId: string;
  defaultAdmissionFee: number;
  enableAdmissionFee: boolean;
  alertDay7: boolean;
  alertDay3: boolean;
  alertDay1: boolean;
  alertOverdue2Days?: boolean;
  emailProvider?: 'GMAIL' | 'RESEND' | 'SIMULATOR';
  emailUser?: string;
  emailPassword?: string;
  resendApiKey?: string;
  resendFrom?: string;
  isEmailActive?: boolean;
}

export interface Member {
  id: string;
  memberId: string; // e.g. GYM-M001
  fullName: string;
  phone: string;
  email?: string;
  gender: string;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
  photoUrl?: string;
  isLifetimeAdmitted: boolean;
  admissionDate: string;
  admissionFeePaid: number;
  status: 'ACTIVE' | 'EXPIRED' | 'PAUSED';
  currentPlanName?: string;
  currentStartDate?: string;
  currentEndDate?: string;
  daysRemaining?: number;
  notes?: string;
  documents?: MemberDocument[];
  documentUrl?: string;
  documentType?: string;
}

export interface MemberDocument {
  id: string;
  memberId: string;
  documentType: 'AADHAAR' | 'DRIVING_LICENSE' | 'MEDICAL_FORM' | 'OTHER';
  type?: string;
  documentName: string;
  fileUrl: string;
  fileSize?: number;
  uploadedAt: string;
}

export interface Plan {
  id: string;
  name: string;
  durationDays: number;
  price: number;
  description?: string;
  isActive: boolean;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // INV-2026-0001
  memberId: string;
  memberName: string;
  memberPhone: string;
  memberEmail?: string;
  planName: string;
  planPrice: number;
  admissionFee: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  dueDate?: string;
  paymentMode: 'CASH' | 'UPI' | 'CARD';
  transactionRef?: string;
  paymentStatus: 'PAID' | 'PARTIAL' | 'DUE';
  createdAt: string;
}

export interface NotificationLog {
  id: string;
  memberId: string;
  memberName: string;
  channel: 'WHATSAPP' | 'EMAIL';
  alertType: '7_DAY_EXPIRY' | '3_DAY_EXPIRY' | '1_DAY_EXPIRY' | 'ALERT_7_DAYS' | 'ALERT_3_DAYS' | 'ALERT_1_DAY' | 'ALERT_OVERDUE' | 'INVOICE' | 'WELCOME' | 'PAYMENT_CONFIRM';
  recipient: string;
  messagePreview: string;
  status: 'SENT' | 'FAILED';
  sentAt: string;
}

