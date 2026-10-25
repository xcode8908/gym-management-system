'use client';

import { useState, useEffect } from 'react';
import {
  CreditCard,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Phone,
  User,
  Receipt,
  X,
  Search,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Percent,
} from 'lucide-react';
import { Member, Plan, GymSettings } from '@/lib/types';

interface CollectFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  initialMemberId?: string;
}

export default function CollectFeeModal({
  isOpen,
  onClose,
  onSuccess,
  initialMemberId,
}: CollectFeeModalProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [settings, setSettings] = useState<GymSettings | null>(null);

  // Form Fields
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [planAmount, setPlanAmount] = useState<number>(1200);
  const [admissionFee, setAdmissionFee] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(1200);
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'CASH'>('UPI');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [extendValidity, setExtendValidity] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [memberSearch, setMemberSearch] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      Promise.all([fetch('/api/members'), fetch('/api/settings')])
        .then(async ([membersRes, settingsRes]) => {
          const membersData = await membersRes.json();
          const settingsData = await settingsRes.json();

          setMembers(membersData);
          setPlans(settingsData.plans || []);
          setSettings(settingsData.settings || null);

          if (initialMemberId) {
            setSelectedMemberId(initialMemberId);
          } else if (membersData.length > 0) {
            setSelectedMemberId(membersData[0].id);
          }

          if (settingsData.plans?.length > 0) {
            setSelectedPlanId(settingsData.plans[0].id);
            setPlanAmount(Number(settingsData.plans[0].price));
            setPaidAmount(Number(settingsData.plans[0].price));
          }
        })
        .catch(console.error);
    }
  }, [isOpen, initialMemberId]);

  if (!isOpen) return null;

  const currentMember = members.find((m) => m.id === selectedMemberId);
  const currentPlan = plans.find((p) => p.id === selectedPlanId);

  const totalPayable = planAmount + admissionFee - discount;
  const dueAmount = Math.max(0, totalPayable - paidAmount);

  // Dynamic UPI Intent URI and QR code
  const upiVpa = settings?.upiId || 'irongym@upi';
  const gymTitle = encodeURIComponent(settings?.gymName || 'Iron Core Gym');
  const upiPaymentUri = `upi://pay?pa=${upiVpa}&pn=${gymTitle}&am=${paidAmount}&cu=INR&tn=GymFee`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    upiPaymentUri
  )}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedMemberId) {
      setError('Please select a member to bill');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: selectedMemberId,
          planId: selectedPlanId,
          customTitle: customTitle || currentPlan?.name || 'Gym Fee',
          amount: planAmount,
          admissionFee,
          discount,
          paidAmount,
          paymentMode,
          transactionRef,
          extendValidity,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process billing');

      onSuccess(data.message || 'Payment recorded and receipt sent!');
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      m.fullName.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.phone.includes(memberSearch) ||
      m.memberId.toLowerCase().includes(memberSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#0b0f17] border border-white/[0.1] rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.08)] relative my-6 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shadow-[0_0_15px_-3px_rgba(245,158,11,0.2)]">
              <Receipt className="w-5 h-5 stroke-[2.25]" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2 tracking-tight">
                <span>Collect Fee & Issue Bill</span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-bold">
                  Instant Dispatch
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                0% Fee Direct UPI / Cash • Auto Server Sync & Dual WhatsApp/Email Receipt
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Member Selector with Live Search */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Select Member</span>
              </label>
              {currentMember && (
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5" /> Lifetime Member: ₹0 Admission Fee
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by name / phone..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="w-full bg-[#111726] border border-white/[0.08] rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/80 transition-all font-medium"
                />
              </div>

              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full bg-[#111726] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-amber-500/80"
              >
                {filteredMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} ({m.phone}) - {m.memberId}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Member Preview Card */}
            {currentMember && (
              <div className="mt-2 p-3 rounded-xl bg-[#111726]/80 border border-white/[0.06] flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      currentMember.photoUrl ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=face'
                    }
                    alt={currentMember.fullName}
                    className="w-10 h-10 rounded-xl object-cover border border-white/[0.1] shadow-md"
                  />
                  <div>
                    <div className="font-extrabold text-white text-sm">{currentMember.fullName}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono mt-0.5">
                      <span>{currentMember.phone}</span>
                      <span>•</span>
                      <span>Expires: {currentMember.currentEndDate || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      currentMember.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {currentMember.status}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 2. Fee / Plan Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Fee / Plan</label>
              <select
                value={selectedPlanId}
                onChange={(e) => {
                  setSelectedPlanId(e.target.value);
                  const p = plans.find((pl) => pl.id === e.target.value);
                  if (p) {
                    setPlanAmount(Number(p.price));
                    setPaidAmount(Number(p.price) + admissionFee - discount);
                  }
                }}
                className="w-full bg-[#111726] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (₹{p.price})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Plan Fee (₹)</label>
              <input
                type="number"
                value={planAmount}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setPlanAmount(val);
                  setPaidAmount(val + admissionFee - discount);
                }}
                className="w-full bg-[#111726] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Discount (₹)</label>
              <input
                type="number"
                value={discount}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setDiscount(val);
                  setPaidAmount(planAmount + admissionFee - val);
                }}
                className="w-full bg-[#111726] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* 3. Payment Mode & Dynamic QR Code */}
          <div className="p-4 rounded-2xl bg-amber-500/[0.03] border border-amber-500/20 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Payment Collection
              </span>
              <div className="flex items-center gap-1 text-xs text-amber-400 font-mono font-bold">
                <span>Total: ₹{totalPayable}</span>
              </div>
            </div>

            {/* Mode Selector */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMode('UPI')}
                className={`btn-tactile py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 ${
                  paymentMode === 'UPI'
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-[0_0_15px_-3px_rgba(245,158,11,0.25)]'
                    : 'bg-[#111726] border-white/[0.06] text-slate-400 hover:text-white'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>UPI QR Code (0% Fee)</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode('CASH')}
                className={`btn-tactile py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 ${
                  paymentMode === 'CASH'
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-[0_0_15px_-3px_rgba(245,158,11,0.25)]'
                    : 'bg-[#111726] border-white/[0.06] text-slate-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Cash Collection</span>
              </button>
            </div>

            {/* Live UPI QR Display */}
            {paymentMode === 'UPI' && (
              <div className="p-4 rounded-2xl bg-[#060913] border border-emerald-500/25 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left shadow-inner">
                <div className="p-2.5 bg-white rounded-2xl shadow-xl flex-shrink-0">
                  <img
                    src={qrCodeUrl}
                    alt="UPI Payment QR"
                    className="w-28 h-28 object-contain rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5 justify-center sm:justify-start">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Scan with Google Pay, PhonePe, Paytm</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    UPI VPA: <strong className="text-emerald-400 font-mono">{upiVpa}</strong>
                  </div>
                  <div className="text-base font-mono font-extrabold text-emerald-300 pt-1">
                    Amount: ₹{paidAmount}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Once customer pays, verify screen and click Confirm below.
                  </div>
                </div>
              </div>
            )}

            {/* Amount Paid & Due */}
            <div className="pt-2 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Amount Paid Now:</span>
                <input
                  type="number"
                  required
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  className="w-32 bg-[#060913] border border-emerald-500/60 rounded-xl px-3 py-1.5 text-xs text-emerald-300 font-bold font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {dueAmount > 0 && (
                <div className="text-rose-400 font-bold font-mono text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  Remaining Due: ₹{dueAmount}
                </div>
              )}
            </div>

            {/* Transaction Ref */}
            <div>
              <input
                type="text"
                placeholder="UPI Reference No. / Transaction ID (Optional)"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="w-full bg-[#060913] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            {/* Auto-extend checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="extendVal"
                checked={extendValidity}
                onChange={(e) => setExtendValidity(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 bg-[#060913] border-white/[0.1] focus:ring-0"
              />
              <label htmlFor="extendVal" className="text-xs text-slate-300 font-medium cursor-pointer">
                Auto-extend member validity by plan duration (+30 Days)
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-cyber px-6 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>{isSubmitting ? 'Recording...' : 'Record Payment & Send Receipt'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
