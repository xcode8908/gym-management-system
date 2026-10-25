# 🏋️ Lifetime Free Gym Management System (Admission & Billing Only)

A **100% Lifetime Free**, enterprise-grade Gym Admission and Billing Web Application built with **Next.js 16 (Turbopack)**, **Tailwind CSS v4**, **PostgreSQL (Neon)**, **Cloudflare R2**, **Resend**, and **Upstash QStash**.

---

## ⚡ Core Features Built

### 1. Lifetime Member Admission & Vault
- **Permanent Member Registration**: Every admitted member receives a permanent Lifetime ID.
- **One-time Admission Fee Rule**: Admission fees are charged **only on first registration**. Re-joining or renewing members pay **₹0.00 admission fee**.
- **Cloudflare R2 Document Vault**: Upload member photos and identity proofs (Aadhaar Card, Driver's License, Medical Forms).
- **Flexible Pricing Engine**: Real-time calculation of `Plan Price + Admission Fee - Custom Discount = Total Amount`.
- **Partial Payments & Dues**: Tracks unpaid fee balances and target due dates.

### 2. Manual Monthly Payment Confirmation
- **Zero-Fee Direct UPI / Cash**: No commercial payment gateway fees or 2% cuts.
- **1-Click Admin Approval**: When a member pays their monthly fee, admin clicks **"Confirm & Extend (+1 Month)"** on the dashboard.
- **Instant Server Sync**:
  1. Neon Database updates immediately.
  2. Member's validity extends by +30 days (or plan duration).
  3. Digital invoice is generated.
  4. Confirmation receipt is dispatched on WhatsApp & Email automatically.

### 3. Automated 3-Stage Expiry Alerts (7, 3, 1-Day)
- Every morning at **8:00 AM**, the Upstash QStash cron checks upcoming expirations:
  - **7 Days Left (Stage 1)**: Friendly heads-up alert.
  - **3 Days Left (Stage 2)**: Action reminder with direct Gym UPI QR details.
  - **1 Day Left (Stage 3)**: Final urgent warning before workout access terminates.
- **Dual Channel**: Sends both automated **Email (Resend)** and **WhatsApp (Baileys Bot)**, plus a **1-click WhatsApp direct link** for receptionist use.

### 4. Billing, Thermal Receipts & Settings
- **Thermal Slip Printing**: 1-click printable receipt formatted for 80mm/58mm thermal POS printers and standard A4 printers.
- **Dynamic Settings CRUD**:
  - Add, edit, or delete workout plans (1 Month, 3 Months, 6 Months, 1 Year).
  - Customize the default one-time admission fee.
  - Configure the Gym Owner's UPI ID for automated QR codes.
  - Toggle 7, 3, and 1-day alerts on or off.

---

## 🚀 Running Locally

The local server is already running in your workspace:
```bash
# Start development server
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## ☁️ 100% Lifetime Free Cloud Deployment Guide

| Service | Free Tier Limit | Configuration Location |
| :--- | :--- | :--- |
| **Vercel** | 100 GB Bandwidth, Global CDN | Push to GitHub -> Import on [vercel.com](https://vercel.com) |
| **Neon.tech** | 500 MB PostgreSQL | Set `DATABASE_URL` in `.env.local` / Vercel Environment |
| **Cloudflare R2** | 10 GB Storage, $0 Egress | Set `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` |
| **Resend** | 3,000 Emails / Month | Set `RESEND_API_KEY` |
| **Upstash QStash** | 500 Cron Messages / Day | Point cron to `https://your-domain.vercel.app/api/cron/reminders` |
| **Render** | 750 Free Hours / Month | Deploy the `worker/` directory for the automated WhatsApp bot |
| **UptimeRobot** | 50 Monitors (5-min pings) | Add `https://your-domain.vercel.app` to keep it awake 24/7 |

---

## 📁 Project Structure

```
d:\KJP\
├── src\
│   ├── app\
│   │   ├── page.tsx                      # Main Dashboard (Metrics & Renewal Queue)
│   │   ├── admissions\page.tsx           # Member Directory & Admission Form + R2 Vault
│   │   ├── billing\page.tsx              # Invoices & Thermal Printable Receipts
│   │   ├── settings\page.tsx             # Pricing Setup, Plans CRUD & Alert Toggles
│   │   ├── api\
│   │   │   ├── members\route.ts          # Lifetime Member Admissions API
│   │   │   ├── billing\
│   │   │   │   ├── route.ts              # Invoices API
│   │   │   │   └── renew\route.ts        # Manual Monthly Renewal Confirmation
│   │   │   ├── cron\reminders\route.ts   # 8:00 AM Automated 7, 3, 1-Day Alerts
│   │   │   ├── upload\route.ts           # Cloudflare R2 File Upload API
│   │   │   └── settings\route.ts         # Settings & Plans CRUD API
│   ├── components\
│   │   └── Navbar.tsx                    # Shared Responsive Navigation Header
│   └── lib\
│       ├── types.ts                      # Core TypeScript Interfaces
│       ├── store.ts                      # Reactive State Store & Seed Database
│       ├── whatsapp.ts                   # 1-Click wa.me & Bot Messaging Helper
│       ├── resend.ts                     # HTML Email Receipts & Alerts Helper
│       └── db\schema.ts                  # Drizzle ORM PostgreSQL Schema
├── worker\                               # Headless Baileys WhatsApp Bot for Render
├── .env.example                          # Documented Environment Variables Template
└── package.json
```
