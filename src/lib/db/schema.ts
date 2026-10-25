import { pgTable, text, serial, timestamp, numeric, boolean, integer, date, uuid, varchar } from 'drizzle-orm/pg-core';

// 1. Gym Profile & Global Billing Settings
export const gymSettings = pgTable('gym_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  gymName: varchar('gym_name', { length: 255 }).default('Iron Core Gym').notNull(),
  logoUrl: text('logo_url'),
  phone: varchar('phone', { length: 20 }).default('+91 98765 43210'),
  email: varchar('email', { length: 100 }).default('contact@irongym.com'),
  address: text('address').default('123 Fitness Boulevard, City Centre'),
  upiId: varchar('upi_id', { length: 100 }).default('irongym@upi'), // Renders dynamic UPI QR on screen
  defaultAdmissionFee: numeric('default_admission_fee', { precision: 10, scale: 2 }).default('500.00').notNull(),
  enableAdmissionFee: boolean('enable_admission_fee').default(true).notNull(),
  // Alert Configuration: 7, 3, 1 Day alerts
  alertDay7: boolean('alert_day_7').default(true).notNull(),
  alertDay3: boolean('alert_day_3').default(true).notNull(),
  alertDay1: boolean('alert_day_1').default(true).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. Members (Lifetime Registered Profiles)
export const members = pgTable('members', {
  id: uuid('id').defaultRandom().primaryKey(),
  memberId: varchar('member_id', { length: 30 }).unique().notNull(), // e.g., GYM-M001
  fullName: varchar('full_name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }).unique().notNull(),
  email: varchar('email', { length: 255 }),
  gender: varchar('gender', { length: 15 }).default('Male'),
  dateOfBirth: date('date_of_birth'),
  address: text('address'),
  emergencyContact: varchar('emergency_contact', { length: 20 }),
  photoUrl: text('photo_url'), // Cloudflare R2
  isLifetimeAdmitted: boolean('is_lifetime_admitted').default(true).notNull(), // Permanent Lifetime Admission
  admissionDate: date('admission_date').defaultNow().notNull(),
  admissionFeePaid: numeric('admission_fee_paid', { precision: 10, scale: 2 }).default('500.00'),
  status: varchar('status', { length: 20 }).default('ACTIVE').notNull(), // ACTIVE, EXPIRED, PAUSED
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 3. Member Uploaded Documents (Cloudflare R2)
export const memberDocuments = pgTable('member_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  memberId: uuid('member_id').references(() => members.id, { onDelete: 'cascade' }).notNull(),
  documentType: varchar('document_type', { length: 50 }).notNull(), // AADHAAR, DRIVING_LICENSE, MEDICAL_FORM, WAIVER
  documentName: varchar('document_name', { length: 255 }).notNull(),
  fileUrl: text('file_url').notNull(), // Cloudflare R2 Public/Signed link
  fileSize: integer('file_size'), // in KB
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
});

// 4. Membership Plans (Configured in Settings)
export const plans = pgTable('plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(), // "1 Month Basic", "3 Months Strength", "Annual VIP"
  durationDays: integer('duration_days').notNull(), // 30, 90, 180, 365
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 5. Subscriptions (Time-bound workout access cycles)
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  memberId: uuid('member_id').references(() => members.id, { onDelete: 'cascade' }).notNull(),
  planId: uuid('plan_id').references(() => plans.id),
  planName: varchar('plan_name', { length: 100 }).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(), // Target for 7, 3, 1 day alerts
  status: varchar('status', { length: 20 }).default('ACTIVE').notNull(), // ACTIVE, EXPIRED, UPCOMING
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 6. Invoices & Billing (Supports Full, Partial, Discounts & One-time Admission Fee)
export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceNumber: varchar('invoice_number', { length: 50 }).unique().notNull(), // e.g. INV-2026-0001
  memberId: uuid('member_id').references(() => members.id, { onDelete: 'cascade' }).notNull(),
  subscriptionId: uuid('subscription_id').references(() => subscriptions.id),
  
  // Cost breakdown
  planPrice: numeric('plan_price', { precision: 10, scale: 2 }).notNull(),
  admissionFee: numeric('admission_fee', { precision: 10, scale: 2 }).default('0.00').notNull(), // Only charged at 1st admission!
  discount: numeric('discount', { precision: 10, scale: 2 }).default('0.00').notNull(),
  
  // Total & Paid
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(), // (planPrice + admissionFee) - discount
  paidAmount: numeric('paid_amount', { precision: 10, scale: 2 }).notNull(),
  dueAmount: numeric('due_amount', { precision: 10, scale: 2 }).default('0.00').notNull(),
  dueDate: date('due_date'), // For partial payment follow-up
  
  // Payment Details
  paymentMode: varchar('payment_mode', { length: 20 }).default('CASH').notNull(), // CASH, UPI, CARD
  transactionRef: varchar('transaction_ref', { length: 100 }),
  paymentStatus: varchar('payment_status', { length: 20 }).default('PAID').notNull(), // PAID, PARTIAL, DUE
  receiptUrl: text('receipt_url'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 7. Notification Logs (Records all WhatsApp & Email alert events)
export const notificationLogs = pgTable('notification_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  memberId: uuid('member_id').references(() => members.id, { onDelete: 'cascade' }).notNull(),
  channel: varchar('channel', { length: 20 }).notNull(), // WHATSAPP, EMAIL
  alertType: varchar('alert_type', { length: 50 }).notNull(), // 7_DAY_EXPIRY, 3_DAY_EXPIRY, 1_DAY_EXPIRY, INVOICE, WELCOME
  recipient: varchar('recipient', { length: 150 }).notNull(), // Phone or Email
  messagePreview: text('message_preview'),
  status: varchar('status', { length: 20 }).default('SENT').notNull(), // SENT, FAILED
  sentAt: timestamp('sent_at').defaultNow().notNull(),
});
