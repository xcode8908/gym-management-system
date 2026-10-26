-- ====================================================================
-- KJP FITNESS CLUB, KUSUPUR - LIFETIME FREE DATABASE SCHEMA
-- Platform: Supabase / PostgreSQL (100% Lifetime Free Tier)
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Members Table (Lifetime Profile Record)
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id VARCHAR(50) UNIQUE NOT NULL, -- e.g., KJP-101
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255),
    photo_url TEXT,
    id_proof_url TEXT,
    admission_date DATE NOT NULL DEFAULT CURRENT_DATE,
    admission_fee NUMERIC(10, 2) NOT NULL DEFAULT 1000.00,
    monthly_fee NUMERIC(10, 2) NOT NULL DEFAULT 400.00,
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'DUE', 'PAUSED', 'INACTIVE'
    pause_days_left INT DEFAULT 0,
    pause_date DATE,
    emergency_contact VARCHAR(20),
    blood_group VARCHAR(10),
    notes TEXT,
    last_reminder_sent_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Payments Table (Complete Billing History)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_no VARCHAR(50) UNIQUE NOT NULL, -- e.g., REC-2026-0001
    member_id VARCHAR(50) NOT NULL REFERENCES members(member_id) ON DELETE CASCADE,
    member_name VARCHAR(255) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    payment_type VARCHAR(50) NOT NULL, -- 'ADMISSION_WITH_MONTHLY', 'MONTHLY_RENEWAL'
    payment_mode VARCHAR(20) NOT NULL DEFAULT 'CASH', -- 'CASH', 'UPI'
    transaction_id VARCHAR(100),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Pause / Freeze History Table
CREATE TABLE IF NOT EXISTS pause_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id VARCHAR(50) NOT NULL REFERENCES members(member_id) ON DELETE CASCADE,
    paused_on DATE NOT NULL,
    resumed_on DATE,
    remaining_days_preserved INT NOT NULL,
    old_due_date DATE NOT NULL,
    new_due_date DATE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Daily Summary Cache / App Settings Table
CREATE TABLE IF NOT EXISTS app_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Default Settings Insert
INSERT INTO app_settings (key, value) VALUES 
('gym_profile', '{
    "gym_name": "KJP Fitness Club",
    "location": "Kusupur",
    "contact_phone": "+91 9876543210",
    "default_admission_fee": 1000,
    "default_monthly_fee": 400,
    "timings": "Morning: 5:30 AM - 10:00 AM | Evening: 4:30 PM - 9:30 PM",
    "telegram_owner_chat_id": "",
    "upi_id": "kjpfitness@upi"
}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 6. Indexes for Lightning Fast Search
CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone);
CREATE INDEX IF NOT EXISTS idx_members_member_id ON members(member_id);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_members_due_date ON members(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- 7. Supabase Storage Setup (For Member Photos & Aadhar)
-- Run this in Supabase SQL Editor if storage bucket is not created
INSERT INTO storage.buckets (id, name, public) 
VALUES ('member_documents', 'member_documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Allow public read
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'member_documents');

-- Storage Policy: Allow authenticated / service insert
CREATE POLICY "Allow Upload" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'member_documents');
