'use client';

import { useRef } from 'react';
import {
  Printer,
  Download,
  Share2,
  X,
  QrCode,
  ShieldCheck,
  Dumbbell,
  Sparkles,
  Phone,
  Calendar,
} from 'lucide-react';
import { Member, GymSettings } from '@/lib/types';
import { getDirectWhatsAppUrl } from '@/lib/whatsapp';

interface MemberIdCardModalProps {
  member: Member | null;
  settings: GymSettings | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MemberIdCardModal({
  member,
  settings,
  isOpen,
  onClose,
}: MemberIdCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !member) return null;

  const gymName = settings?.gymName || 'IRON CORE FITNESS';
  const qrData = `MEMBER:${member.memberId}|NAME:${member.fullName}|STATUS:${member.status}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
    qrData
  )}`;

  const handlePrint = () => {
    window.print();
  };

  const shareText = `Hi ${member.fullName}! Here is your Official Gym Membership Pass for ${gymName}.\nMember ID: ${member.memberId}\nValid Till: ${member.currentEndDate || 'Lifetime'}\nStatus: ${member.status}`;
  const shareWhatsAppUrl = getDirectWhatsAppUrl(member.phone, shareText);

  return (
    <div
      suppressHydrationWarning
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        suppressHydrationWarning
        className="bg-[#0b0f17] border border-white/[0.1] rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.08)] relative my-6 text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
              <Dumbbell className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>Official Digital Member Pass</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">
                  Verified
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Print plastic pass or send digital card directly to member's WhatsApp
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

        {/* The VIP Member ID Card (Printable Area) */}
        <div className="flex justify-center my-3 print:my-0">
          <div
            ref={cardRef}
            className="w-full max-w-[390px] rounded-3xl p-5 bg-gradient-to-br from-[#121829] via-[#0c101a] to-[#090c14] border-2 border-amber-500/40 shadow-[0_15px_35px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.15)] relative overflow-hidden"
          >
            {/* Ambient Background Gold Glow */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

            {/* Top Bar: Gym Name & Brand */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-md">
                  IC
                </div>
                <div>
                  <h4 className="text-xs font-black tracking-widest text-amber-400 uppercase font-sans">
                    {gymName}
                  </h4>
                  <div className="text-[9px] text-slate-400 font-bold tracking-wider uppercase">
                    Permanent Member Pass
                  </div>
                </div>
              </div>

              <span
                className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                  member.status === 'ACTIVE'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                }`}
              >
                {member.status}
              </span>
            </div>

            {/* Member Details & Photo */}
            <div className="flex items-center gap-4">
              {/* Photo with double glowing gold ring */}
              <div className="relative flex-shrink-0">
                <img
                  src={
                    member.photoUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face'
                  }
                  alt={member.fullName}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-400/80 shadow-lg shadow-black/80"
                />
                <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-500 text-slate-950 shadow-md">
                  <ShieldCheck className="w-3 h-3 stroke-[3]" />
                </div>
              </div>

              {/* Member Meta */}
              <div className="flex-1 space-y-1">
                <h3 className="text-base font-extrabold text-white tracking-tight leading-tight">
                  {member.fullName}
                </h3>
                <div className="text-xs font-mono font-bold text-amber-400">
                  {member.memberId}
                </div>
                <div className="text-[11px] text-slate-300 flex items-center gap-1 font-mono">
                  <Phone className="w-3 h-3 text-slate-500" />
                  <span>{member.phone}</span>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  <span>Admitted: {member.admissionDate}</span>
                </div>
              </div>
            </div>

            {/* Bottom Card Footer with QR Code & Expiry */}
            <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between">
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Workout Plan
                </div>
                <div className="text-xs font-bold text-slate-200">
                  {member.currentPlanName || 'Fitness Pass'}
                </div>
                <div className="text-[10px] text-amber-400/90 font-mono mt-0.5 font-bold">
                  Valid Till: {member.currentEndDate || 'Permanent'}
                </div>
              </div>

              {/* Personal Entry QR Code */}
              <div className="text-center">
                <img
                  src={qrUrl}
                  alt="Entry QR"
                  className="w-14 h-14 bg-white p-1 rounded-xl shadow-md border border-white/20"
                />
                <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest block mt-0.5">
                  Scan Desk
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 pt-3 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            {/* 1-Click WhatsApp Share */}
            <a
              href={shareWhatsAppUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-tactile px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Send on WhatsApp</span>
            </a>

            {/* Print Pass Button */}
            <button
              onClick={handlePrint}
              className="btn-tactile px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 hover:text-white border border-white/[0.08] font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Print Badge</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 font-semibold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
