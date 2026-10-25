'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  UserCheck,
  AlertTriangle,
  Clock,
  Flame,
  CreditCard,
  Send,
  PlusCircle,
  Play,
  CheckCircle2,
  Phone,
  QrCode,
  DollarSign,
  ArrowRight,
  TrendingUp,
  Receipt,
  Sparkles,
  ShieldCheck,
  Edit3,
  Zap,
  Activity,
} from 'lucide-react';
import { Member, Invoice, NotificationLog } from '@/lib/types';
import { getDirectWhatsAppUrl, generateWhatsAppMessage } from '@/lib/whatsapp';
import CollectFeeModal from '@/components/CollectFeeModal';
import EditMemberModal from '@/components/EditMemberModal';

export default function Dashboard() {
  const [members, setMembers] = useState<Member[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cronRunning, setCronRunning] = useState(false);
  const [cronResult, setCronResult] = useState<string | null>(null);

  // Collect Fee Modal
  const [isCollectFeeOpen, setIsCollectFeeOpen] = useState(false);
  const [selectedMemberForBilling, setSelectedMemberForBilling] = useState<string | undefined>(undefined);

  // Edit Member Profile Modal State
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Quick Renewal Modal State
  const [renewingMember, setRenewingMember] = useState<Member | null>(null);
  const [renewalPlanId, setRenewalPlanId] = useState<string>('plan-1');
  const [renewalAmount, setRenewalAmount] = useState<number>(1200);
  const [renewalMode, setRenewalMode] = useState<'CASH' | 'UPI'>('UPI');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [isSubmittingRenewal, setIsSubmittingRenewal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [membersRes, billingRes] = await Promise.all([
        fetch('/api/members'),
        fetch('/api/billing'),
      ]);

      const membersData = await membersRes.json();
      const billingData = await billingRes.json();

      setMembers(membersData);

      const totalMembers = membersData.length;
      const activeMembers = membersData.filter((m: Member) => m.status === 'ACTIVE').length;
      const expiredMembers = membersData.filter((m: Member) => m.status === 'EXPIRED').length;

      const exp7 = membersData.filter((m: Member) => m.status === 'ACTIVE' && m.daysRemaining !== undefined && m.daysRemaining <= 7 && m.daysRemaining > 3);
      const exp3 = membersData.filter((m: Member) => m.status === 'ACTIVE' && m.daysRemaining !== undefined && m.daysRemaining <= 3 && m.daysRemaining > 1);
      const exp1 = membersData.filter((m: Member) => m.status === 'ACTIVE' && m.daysRemaining !== undefined && m.daysRemaining <= 1 && m.daysRemaining >= 0);

      setMetrics({
        totalMembers,
        activeMembers,
        expiredMembers,
        expiring7Count: exp7.length,
        expiring3Count: exp3.length,
        expiring1Count: exp1.length,
        totalRevenue: billingData.metrics?.totalCollected || 0,
        todayCollected: billingData.metrics?.todayCollected || 0,
        totalDue: billingData.metrics?.totalDue || 0,
        dueCount: billingData.metrics?.dueCount || 0,
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleReload = () => fetchData();
    window.addEventListener('reload-billing-data', handleReload);
    return () => window.removeEventListener('reload-billing-data', handleReload);
  }, []);

  // Trigger Daily 8:00 AM Cron Simulator
  const handleTriggerCron = async () => {
    try {
      setCronRunning(true);
      setCronResult(null);
      const res = await fetch('/api/cron/reminders', { method: 'POST' });
      const data = await res.json();
      setCronResult(
        `✅ 8:00 AM Cron Completed: Scanned ${data.totalActiveChecked} active members. Dispatched ${data.alertsDispatchedCount} WhatsApp & Email alerts.`
      );
      fetchData();
    } catch (err: any) {
      setCronResult(`❌ Cron execution failed: ${err.message}`);
    } finally {
      setCronRunning(false);
    }
  };

  // Submit Manual Monthly Renewal
  const handleConfirmRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewingMember) return;

    try {
      setIsSubmittingRenewal(true);
      const res = await fetch('/api/billing/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: renewingMember.id,
          planId: renewalPlanId,
          paidAmount: renewalAmount,
          paymentMode: renewalMode,
          transactionRef,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to renew');

      setSuccessMessage(data.message);
      setRenewingMember(null);
      fetchData();

      setTimeout(() => setSuccessMessage(null), 6000);
    } catch (err: any) {
      alert(`Error confirming payment: ${err.message}`);
    } finally {
      setIsSubmittingRenewal(false);
    }
  };

  const urgentMembers = members.filter(
    (m) =>
      m.status === 'EXPIRED' ||
      (m.status === 'ACTIVE' && m.daysRemaining !== undefined && m.daysRemaining <= 7)
  );

  return (
    <div suppressHydrationWarning className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
      {/* Top Header & Tactical Action Stack */}
      <div className="surface-panel p-6 sm:p-7 rounded-3xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5 border border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Dashboard Overview
            </h1>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 tracking-widest uppercase">
              LIVE ENGINE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            Permanent Lifetime Admissions • Automated 7/3/1-Day Expiry Alerts • Direct UPI Billing
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleTriggerCron}
            disabled={cronRunning}
            className="btn-tactile flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 text-emerald-400 ${cronRunning ? 'animate-spin' : ''}`} />
            <span>{cronRunning ? 'Dispatching...' : 'Test 8 AM Cron Alerts'}</span>
          </button>

          {/* Collect Fee Button */}
          <button
            onClick={() => {
              setSelectedMemberForBilling(undefined);
              setIsCollectFeeOpen(true);
            }}
            className="btn-tactile flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/[0.12] text-xs font-bold transition-all shadow-sm"
          >
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span>➕ Collect Fee</span>
          </button>

          {/* New Admission Button */}
          <Link
            href="/admissions"
            className="btn-cyber flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold shadow-[0_0_20px_-3px_rgba(16,185,129,0.35)] transition-all"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.75]" />
            <span>New Admission</span>
          </Link>
        </div>
      </div>

      {/* Cron Result Alert */}
      {cronResult && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-2 font-medium">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{cronResult}</span>
          </div>
          <button onClick={() => setCronResult(null)} className="text-[11px] text-emerald-400 underline font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Core Metrics Grid - Clean Specular Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5 sm:gap-4">
        {/* Total Lifetime Members */}
        <div className="surface-card p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lifetime Members</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
            {metrics?.totalMembers || 0}
          </div>
          <div className="text-[10px] text-emerald-400 mt-1 font-semibold flex items-center gap-1 font-mono">
            <ShieldCheck className="w-3 h-3" /> Permanent Vault
          </div>
        </div>

        {/* Active Members */}
        <div className="surface-card p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Workout</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">
            {metrics?.activeMembers || 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Valid gym passes</div>
        </div>

        {/* 7-Day Alert Count */}
        <div className="surface-card p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">7-Day Alert</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400 font-mono tracking-tight">
            {metrics?.expiring7Count || 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Due next week</div>
        </div>

        {/* 3-Day Alert Count */}
        <div className="surface-card p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">3-Day Alert</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono tracking-tight">
            {metrics?.expiring3Count || 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Action reminder</div>
        </div>

        {/* 1-Day Final Notice */}
        <div className="surface-card p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">1-Day Notice</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-500 font-mono tracking-tight">
            {metrics?.expiring1Count || 0}
          </div>
          <div className="text-[10px] text-rose-400 mt-1 font-medium">Expires tomorrow</div>
        </div>

        {/* Pending Due Amount */}
        <div className="surface-card p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Dues</span>
            <CreditCard className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
            ₹{(metrics?.totalDue || 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-rose-400 mt-1 font-mono">
            {metrics?.dueCount || 0} Unpaid Installments
          </div>
        </div>
      </div>

      {/* Monthly Dues & Expiry Renewal Queue */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2 tracking-tight">
              <span>Monthly Dues & Expiry Renewal Queue</span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25 font-bold uppercase tracking-wider">
                Manual Confirmation Required
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              When a member pays via UPI or Cash, click "Confirm & Extend (+1M)" to update the server and dispatch receipts.
            </p>
          </div>
        </div>

        {/* Queue List Table */}
        <div className="surface-panel rounded-3xl overflow-hidden border border-white/[0.08]">
          {urgentMembers.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-60" />
              <div className="text-base font-bold text-slate-200">All memberships are up to date!</div>
              <div className="text-xs text-slate-500 mt-1">No pending expirations in the next 7 days.</div>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {urgentMembers.map((member) => {
                const days = member.daysRemaining ?? 0;
                const isExpired = member.status === 'EXPIRED' || days <= 0;

                const waMessage = generateWhatsAppMessage(
                  days === 1 ? 'ALERT_1_DAY' : days <= 3 ? 'ALERT_3_DAYS' : 'ALERT_7_DAYS',
                  {
                    memberName: member.fullName,
                    gymName: 'Iron Core Gym',
                    endDate: member.currentEndDate,
                    upiId: 'ironcore@upi',
                  }
                );
                const waUrl = getDirectWhatsAppUrl(member.phone, waMessage);

                return (
                  <div
                    key={member.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Member Details */}
                    <div className="flex items-center gap-3.5">
                      <img
                        src={member.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face'}
                        alt={member.fullName}
                        className="w-12 h-12 rounded-2xl object-cover border border-white/[0.1] shadow-md flex-shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-white text-sm sm:text-base tracking-tight">{member.fullName}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.05] text-slate-300 border border-white/[0.08]">
                            {member.memberId}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-bold">
                            Lifetime Admitted
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-3 mt-1 font-mono">
                          <span className="flex items-center gap-1 font-sans text-slate-300">
                            <Phone className="w-3 h-3 text-slate-500" /> {member.phone}
                          </span>
                          <span>•</span>
                          <span>Plan: {member.currentPlanName || 'Standard'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Expiry Status Badge & Actions */}
                    <div className="flex items-center gap-3">
                      <div>
                        {isExpired ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/25 flex items-center gap-1.5 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Expired on {member.currentEndDate}
                          </span>
                        ) : days === 1 ? (
                          <span className="badge-glow-rose px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 animate-pulse font-mono">
                            <Flame className="w-3.5 h-3.5 text-rose-400" />
                            Expires Tomorrow!
                          </span>
                        ) : days <= 3 ? (
                          <span className="badge-glow-amber px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 font-mono">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            {days} Days Left
                          </span>
                        ) : (
                          <span className="badge-glow-cyan px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 font-mono">
                            <Clock className="w-3.5 h-3.5 text-cyan-400" />
                            {days} Days Left
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        {/* Edit Profile Button */}
                        <button
                          onClick={() => {
                            setEditingMember(member);
                            setIsEditModalOpen(true);
                          }}
                          className="btn-tactile p-2 sm:px-3 sm:py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.07] text-xs font-semibold flex items-center gap-1.5"
                          title="Edit Member Profile"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>

                        {/* 1-Click WhatsApp Reminder */}
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-tactile p-2 sm:px-3 sm:py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 text-xs font-bold flex items-center gap-1.5"
                          title="Send pre-typed WhatsApp message"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </a>

                        {/* Manual Confirm & Extend Button */}
                        <button
                          onClick={() => {
                            setRenewingMember(member);
                            setRenewalAmount(1200);
                            setRenewalMode('UPI');
                            setTransactionRef('');
                          }}
                          className="btn-cyber px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-[0_0_15px_-3px_rgba(16,185,129,0.35)] cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.75]" />
                          <span>Confirm & Extend (+1M)</span>
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Collect Fee Modal */}
      <CollectFeeModal
        isOpen={isCollectFeeOpen}
        initialMemberId={selectedMemberForBilling}
        onClose={() => setIsCollectFeeOpen(false)}
        onSuccess={(msg) => {
          setSuccessMessage(msg);
          fetchData();
          setTimeout(() => setSuccessMessage(null), 5000);
        }}
      />

      {/* Edit Member Profile Modal */}
      <EditMemberModal
        isOpen={isEditModalOpen}
        member={editingMember}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingMember(null);
        }}
        onSuccess={(msg) => {
          setSuccessMessage(msg);
          fetchData();
          setTimeout(() => setSuccessMessage(null), 5000);
        }}
      />

      {/* Manual Monthly Payment Confirmation Modal */}
      {renewingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-150">
          <div className="bg-[#0b0f17] border border-white/[0.1] rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.08)] relative">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Manual Monthly Fee Confirmation</h3>
                <p className="text-xs text-slate-400 font-medium">
                  Confirming monthly renewal for <strong className="text-amber-400">{renewingMember.fullName}</strong>
                </p>
              </div>
              <button
                onClick={() => setRenewingMember(null)}
                className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmRenewal} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-300 font-medium">
                ⭐ <strong>Lifetime Member Rule Applied:</strong> Admission fee is <strong>₹0.00</strong>. Only the monthly gym renewal fee will be billed.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Plan</label>
                <select
                  value={renewalPlanId}
                  onChange={(e) => {
                    setRenewalPlanId(e.target.value);
                    if (e.target.value === 'plan-1') setRenewalAmount(1200);
                    if (e.target.value === 'plan-2') setRenewalAmount(3000);
                    if (e.target.value === 'plan-3') setRenewalAmount(5500);
                    if (e.target.value === 'plan-4') setRenewalAmount(9999);
                  }}
                  className="w-full bg-[#111726] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                >
                  <option value="plan-1">1 Month General Fitness (₹1,200)</option>
                  <option value="plan-2">3 Months Strength & Conditioning (₹3,000)</option>
                  <option value="plan-3">6 Months Transformation (₹5,500)</option>
                  <option value="plan-4">1 Year VIP Access (₹9,999)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Amount Collected (₹)</label>
                <input
                  type="number"
                  required
                  value={renewalAmount}
                  onChange={(e) => setRenewalAmount(Number(e.target.value))}
                  className="w-full bg-[#111726] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRenewalMode('UPI')}
                    className={`btn-tactile py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                      renewalMode === 'UPI'
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-[0_0_15px_-3px_rgba(245,158,11,0.25)]'
                        : 'bg-[#111726] border-white/[0.06] text-slate-400 hover:text-white'
                    }`}
                  >
                    UPI / QR Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setRenewalMode('CASH')}
                    className={`btn-tactile py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                      renewalMode === 'CASH'
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-[0_0_15px_-3px_rgba(245,158,11,0.25)]'
                        : 'bg-[#111726] border-white/[0.06] text-slate-400 hover:text-white'
                    }`}
                  >
                    Cash
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Transaction Ref / Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref / GPay Ref number"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full bg-[#111726] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRenewingMember(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRenewal}
                  className="btn-cyber px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-[0_0_20px_-3px_rgba(16,185,129,0.4)] disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[2.75]" />
                  <span>{isSubmittingRenewal ? 'Processing...' : 'Confirm Payment & Auto-Extend'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

