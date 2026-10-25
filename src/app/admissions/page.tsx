'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Users,
  PlusCircle,
  Search,
  Upload,
  FileText,
  Phone,
  Mail,
  Calendar,
  Check,
  ShieldCheck,
  QrCode,
  DollarSign,
  AlertCircle,
  Eye,
  Receipt,
  Sparkles,
  Edit3,
  Send,
  ExternalLink,
  Shield,
  Activity,
  Camera,
  FolderOpen,
  FileSpreadsheet,
  BadgeCheck,
  Zap,
} from 'lucide-react';
import { Member, Plan, GymSettings } from '@/lib/types';
import CollectFeeModal from '@/components/CollectFeeModal';
import EditMemberModal from '@/components/EditMemberModal';
import MemberDocumentsModal from '@/components/MemberDocumentsModal';
import MemberIdCardModal from '@/components/MemberIdCardModal';
import PhotoUploadZone from '@/components/PhotoUploadZone';
import { getDirectWhatsAppUrl } from '@/lib/whatsapp';

export default function AdmissionsPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [settings, setSettings] = useState<GymSettings | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Edit Member Profile Modal State
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Member Document Vault Modal State (Download & View Aadhaar/DL)
  const [vaultMember, setVaultMember] = useState<Member | null>(null);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);

  // Member Digital ID Card Modal State
  const [selectedIdCardMember, setSelectedIdCardMember] = useState<Member | null>(null);
  const [isIdCardModalOpen, setIsIdCardModalOpen] = useState(false);

  // Collect Fee Modal
  const [isCollectFeeOpen, setIsCollectFeeOpen] = useState(false);
  const [billingTargetMemberId, setBillingTargetMemberId] = useState<string | undefined>(undefined);

  // New Admission Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('Male');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [address, setAddress] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [admissionFee, setAdmissionFee] = useState<number>(500);
  const [discount, setDiscount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(1700);
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'CASH'>('UPI');
  const [transactionRef, setTransactionRef] = useState('');

  // File Upload State (Cloudflare R2)
  const [photoUrl, setPhotoUrl] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [documentType, setDocumentType] = useState('AADHAAR');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [membersRes, settingsRes] = await Promise.all([
        fetch('/api/members'),
        fetch('/api/settings'),
      ]);

      const membersData = await membersRes.json();
      const settingsData = await settingsRes.json();

      setMembers(membersData);
      setSettings(settingsData.settings);
      setPlans(settingsData.plans);

      if (settingsData.plans?.length > 0) {
        setSelectedPlanId(settingsData.plans[0].id);
        const defaultFee = Number(settingsData.settings?.defaultAdmissionFee || 500);
        setAdmissionFee(defaultFee);
        setPaidAmount(Number(settingsData.plans[0].price) + defaultFee);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleReload = () => loadData();
    window.addEventListener('reload-billing-data', handleReload);
    return () => window.removeEventListener('reload-billing-data', handleReload);
  }, []);

  const activePlan = plans.find((p) => p.id === selectedPlanId) || plans[0];
  const totalPayable = activePlan ? Number(activePlan.price) + Number(admissionFee) - Number(discount) : 0;
  const dueAmount = Math.max(0, totalPayable - Number(paidAmount));

  // Dynamic UPI URL & QR
  const upiVpa = settings?.upiId || 'irongym@upi';
  const upiPaymentUri = `upi://pay?pa=${upiVpa}&pn=GymAdmission&am=${paidAmount}&cu=INR&tn=AdmissionFee`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    upiPaymentUri
  )}`;

  // Handle Photo Upload (R2)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'PHOTO');

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.fileUrl) setPhotoUrl(data.fileUrl);
    } catch (err) {
      alert('Photo upload failed');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Handle Document Upload (Aadhaar/DL to Cloudflare R2)
  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingDoc(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', documentType);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.fileUrl) {
        setDocumentUrl(data.fileUrl);
        setDocumentName(file.name);
      }
    } catch (err) {
      alert('Document upload failed');
    } finally {
      setUploadingDoc(false);
    }
  };

  // Handle New Admission Submission
  const handleSubmitAdmission = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          phone,
          email,
          gender,
          emergencyContact,
          address,
          photoUrl,
          planId: selectedPlanId,
          admissionFee,
          discount,
          paidAmount,
          paymentMode,
          transactionRef,
          documentUrl,
          documentName,
          documentType,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register member');

      setFormSuccess(
        `🎉 Lifetime Admission Successful for ${fullName}! Member ID: ${data.member.memberId}. Receipt sent via WhatsApp & Email.`
      );
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFullName('');
    setPhone('');
    setEmail('');
    setEmergencyContact('');
    setAddress('');
    setPhotoUrl('');
    setDocumentUrl('');
    setDocumentName('');
    setDiscount(0);
    setTransactionRef('');
  };

  // Export Members to CSV for Excel / Audit
  const exportToCsv = () => {
    if (!members.length) return;
    const headers = ['Member ID', 'Full Name', 'Phone', 'Email', 'Gender', 'Status', 'Admission Date', 'Current Plan', 'Valid Until', 'Emergency Contact', 'Address'];
    const rows = members.map((m) => [
      `"${m.memberId}"`,
      `"${m.fullName.replace(/"/g, '""')}"`,
      `"${m.phone}"`,
      `"${m.email || ''}"`,
      `"${m.gender}"`,
      `"${m.status}"`,
      `"${m.admissionDate}"`,
      `"${m.currentPlanName || ''}"`,
      `"${m.currentEndDate || ''}"`,
      `"${m.emergencyContact || ''}"`,
      `"${m.address || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Gym_Members_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.fullName.toLowerCase().includes(search.toLowerCase()) ||
      m.phone.includes(search) ||
      m.memberId.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filter === 'active') return m.status === 'ACTIVE';
    if (filter === 'expired') return m.status === 'EXPIRED';
    if (filter === 'paused') return m.status === 'PAUSED';
    return true;
  });

  return (
    <div suppressHydrationWarning className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Member Admissions & Vault
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold uppercase font-mono tracking-wider">
              Permanent Records
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Lifetime Admission Records with Cloudflare R2 Document Vault (Aadhaar / ID Proofs)
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-3">

          {/* Export to CSV Button */}
          <button
            onClick={exportToCsv}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/[0.08] text-xs font-bold transition-all active:scale-95 shadow-sm cursor-pointer"
            title="Download member records for Excel / CA audit"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          {/* Quick Collect Fee Button */}
          <button
            onClick={() => {
              setBillingTargetMemberId(undefined);
              setIsCollectFeeOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/[0.12] text-xs font-bold transition-all active:scale-95 cursor-pointer"
          >
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span>➕ Collect Fee</span>
          </button>

          {/* New Admission Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-cyber flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold shadow-[0_0_20px_-3px_rgba(16,185,129,0.4)] transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.75]" />
            <span>New Lifetime Admission</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {formSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-center justify-between">
          <span>{formSuccess}</span>
          <button onClick={() => setFormSuccess(null)} className="text-xs text-emerald-400 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 glass-panel p-3.5 rounded-2xl border border-white/[0.06]">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, phone or member ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#050811] border border-white/[0.1] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: 'all', label: `All Members (${members.length})` },
            { key: 'active', label: `Active (${members.filter((m) => m.status === 'ACTIVE').length})` },
            { key: 'expired', label: `Expired (${members.filter((m) => m.status === 'EXPIRED').length})` },
            { key: 'paused', label: `🟡 Gym Off / Paused (${members.filter((m) => m.status === 'PAUSED').length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                filter === tab.key
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 font-extrabold shadow-[0_0_15px_-3px_rgba(16,185,129,0.4)]'
                  : 'bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>


      {/* 4 Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="surface-card p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lifetime Members</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
            {members.length}
          </div>
          <div className="text-[10px] text-amber-400 mt-1 font-semibold">Permanent Records</div>
        </div>

        <div className="surface-card p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Workout</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">
            {members.filter((m) => m.status === 'ACTIVE').length}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Pass Valid</div>
        </div>

        <div className="surface-card p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Plan Expired</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 font-mono tracking-tight">
            {members.filter((m) => m.status === 'EXPIRED').length}
          </div>
          <div className="text-[10px] text-rose-400/80 mt-1">Needs Monthly Renewal</div>
        </div>

        <div className="surface-card p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cloudflare Vault</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400 font-mono tracking-tight">
            {members.filter((m) => (m.documents && m.documents.length > 0) || m.photoUrl).length}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Photos & Aadhaar Stored</div>
        </div>
      </div>

      {/* Members Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member) => {
          const waMessage = `Hello ${member.fullName}! Greetings from ${settings?.gymName || 'Iron Core Gym'}.`;
          const waUrl = getDirectWhatsAppUrl(member.phone, waMessage);

          return (
            <div
              key={member.id}
              className="glass-card rounded-3xl p-5 flex flex-col justify-between space-y-4 hover:border-amber-500/30 transition-all duration-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    {/* Clickable Avatar to Edit Photo */}
                    <div
                      onClick={() => {
                        setEditingMember(member);
                        setIsEditModalOpen(true);
                      }}
                      className="relative group cursor-pointer flex-shrink-0"
                      title="Click to change photo or edit profile"
                    >
                      <img
                        src={
                          member.photoUrl ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=face'
                        }
                        alt={member.fullName}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-white/[0.1] group-hover:border-amber-400/80 transition-all shadow-md group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="w-4 h-4 text-amber-300" />
                      </div>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-white text-base leading-tight tracking-tight">
                        {member.fullName}
                      </h3>
                      <div className="text-xs font-mono font-bold text-amber-400 mt-0.5">
                        {member.memberId}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5 font-mono">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{member.phone}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                      member.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                        : member.status === 'PAUSED'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                    }`}
                  >
                    {member.status === 'PAUSED' ? '🟡 PAUSED (GYM OFF)' : member.status}
                  </span>
                </div>

                {/* Badges & Details */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Admission Date:</span>
                    <span className="text-slate-200 font-semibold font-mono">{member.admissionDate}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Current Plan:</span>
                    <span className="text-emerald-300 font-semibold">
                      {member.currentPlanName || '1 Month Fitness'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Validity End:</span>
                    <span className="text-slate-200 font-semibold font-mono">
                      {member.currentEndDate || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 pt-1">
                    <span>Cloudflare Vault:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setVaultMember(member);
                        setIsVaultModalOpen(true);
                      }}
                      className="flex items-center gap-1 font-mono text-[11px] font-bold text-emerald-400 hover:text-emerald-300 hover:underline transition-all"
                      title="View & Download ID proofs"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>
                        {member.documents && member.documents.length > 0
                          ? `${member.documents.length} Docs (${member.documents[0].documentType || 'ID'})`
                          : member.photoUrl
                          ? 'Photo Stored'
                          : 'Upload ID'}
                      </span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Actions Bar */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5" /> Lifetime ID
                </span>

                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {/* Direct WhatsApp Quick Chat */}
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 transition-all active:scale-95"
                    title="Send WhatsApp message"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </a>

                  {/* Document Vault Button (View & Download) */}
                  <button
                    onClick={() => {
                      setVaultMember(member);
                      setIsVaultModalOpen(true);
                    }}
                    className="btn-tactile px-2 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.07] text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 shadow-sm cursor-pointer"
                    title="Check & Download Documents"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="hidden sm:inline">Docs</span>
                  </button>

                  {/* Digital ID Pass Button */}
                  <button
                    onClick={() => {
                      setSelectedIdCardMember(member);
                      setIsIdCardModalOpen(true);
                    }}
                    className="btn-tactile px-2 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/25 text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 shadow-sm cursor-pointer"
                    title="View & Print Digital Membership Card"
                  >
                    <BadgeCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="hidden sm:inline">Pass</span>
                  </button>

                  {/* Edit Profile Button */}
                  <button
                    onClick={() => {
                      setEditingMember(member);
                      setIsEditModalOpen(true);
                    }}
                    className="btn-tactile px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 hover:text-white border border-slate-700/80 text-xs font-bold flex items-center gap-1 transition-all active:scale-95 shadow-sm cursor-pointer"
                    title="Edit Member Profile"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>

                  {/* 1-Click Bill Member Button */}
                  <button
                    onClick={() => {
                      setBillingTargetMemberId(member.id);
                      setIsCollectFeeOpen(true);
                    }}
                    className="btn-tactile px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Bill</span>
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Collect Fee Modal */}
      <CollectFeeModal
        isOpen={isCollectFeeOpen}
        initialMemberId={billingTargetMemberId}
        onClose={() => setIsCollectFeeOpen(false)}
        onSuccess={(msg) => {
          setFormSuccess(msg);
          loadData();
          setTimeout(() => setFormSuccess(null), 5000);
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
          setFormSuccess(msg);
          loadData();
          setTimeout(() => setFormSuccess(null), 5000);
        }}
      />

      {/* Member Document Vault Modal (View, Download, Upload Aadhaar / DL) */}
      <MemberDocumentsModal
        member={vaultMember}
        isOpen={isVaultModalOpen}
        onClose={() => {
          setIsVaultModalOpen(false);
          setVaultMember(null);
        }}
        onUpdate={() => loadData()}
      />

      {/* Digital Member ID Card Pass Modal */}
      <MemberIdCardModal
        member={selectedIdCardMember}
        settings={settings}
        isOpen={isIdCardModalOpen}
        onClose={() => {
          setIsIdCardModalOpen(false);
          setSelectedIdCardMember(null);
        }}
      />

      {/* New Lifetime Admission Modal */}
      {isModalOpen && (
        <div suppressHydrationWarning className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 overflow-y-auto animate-in fade-in duration-200">
          <div suppressHydrationWarning className="bg-[#0b0f17] border border-white/[0.1] rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.08)] relative my-6 text-slate-100">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-5">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2 tracking-tight">
                  <span>New Lifetime Admission & Fee Setup</span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-bold uppercase">
                    Permanent Registration
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  Once registered, this member's ID and documents remain in the system forever. Admission fee is charged only once.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold transition-all"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitAdmission} className="space-y-5">
              {/* Personal Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#111726] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mobile Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#111726] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address (For Receipts)</label>
                  <input
                    type="email"
                    placeholder="member@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#111726] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-[#111726] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Member Photo Upload Zone (Live Snap / R2 Upload / Curated Avatars) */}
              <PhotoUploadZone
                currentPhotoUrl={photoUrl}
                onPhotoSelected={(url) => setPhotoUrl(url)}
                label="Member Photo & Face Vault"
              />

              {/* Cloudflare R2 Document Vault (Aadhaar / ID Proof) */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-b from-[#101625] to-[#0c101a] border border-white/[0.08] space-y-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Cloudflare R2 Document Vault (Aadhaar / DL)</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    Encrypted Storage
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Document Type</label>
                    <select
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value)}
                      className="w-full bg-[#0a0d14] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-amber-500"
                    >
                      <option value="AADHAAR">Aadhaar Card</option>
                      <option value="DRIVING_LICENSE">Driving License</option>
                      <option value="PAN_CARD">PAN Card</option>
                      <option value="VOTER_ID">Voter ID</option>
                      <option value="MEDICAL_FORM">Medical Form</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Upload Document File (PDF / JPG / PNG)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      ref={fileInputRef}
                      onChange={handleDocUpload}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingDoc}
                        className={`flex-1 px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all active:scale-95 ${
                          documentUrl
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-[#0a0d14] hover:bg-white/[0.04] border-white/[0.08] text-slate-300'
                        }`}
                      >
                        <span className="truncate flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                          <span>{uploadingDoc ? 'Uploading to R2...' : documentName || 'Click to Upload Aadhaar / DL'}</span>
                        </span>
                        {documentUrl && (
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-500/20">
                            Attached ✓
                          </span>
                        )}
                      </button>

                      {documentUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setDocumentUrl('');
                            setDocumentName('');
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="p-2 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/[0.08] transition-all"
                          title="Remove Document"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Custom Admission Billing Engine */}
              <div className="p-4 sm:p-5 rounded-3xl bg-[#101625] border border-white/[0.08] space-y-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <div className="text-xs font-bold text-white flex items-center justify-between">
                  <span className="uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Admission Pricing & Fee Breakdown</span>
                  </span>
                  <span className="text-[11px] text-amber-400 font-mono font-bold">0% Direct UPI Settlement</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Workout Plan</label>
                    <select
                      value={selectedPlanId}
                      onChange={(e) => {
                        setSelectedPlanId(e.target.value);
                        const p = plans.find((pl) => pl.id === e.target.value);
                        if (p) setPaidAmount(Number(p.price) + admissionFee - discount);
                      }}
                      className="w-full bg-[#0a0d14] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-amber-500"
                    >
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (₹{p.price})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Lifetime Admission Fee (₹)
                    </label>
                    <input
                      type="number"
                      value={admissionFee}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setAdmissionFee(val);
                        setPaidAmount(Number(activePlan?.price || 0) + val - discount);
                      }}
                      className="w-full bg-[#0a0d14] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Discount Offer (₹)</label>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setDiscount(val);
                        setPaidAmount(Number(activePlan?.price || 0) + admissionFee - val);
                      }}
                      className="w-full bg-[#0a0d14] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Calculation Bar */}
                <div className="pt-3 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">Total Payable: </span>
                    <strong className="text-amber-400 text-lg font-mono font-extrabold ml-1">₹{totalPayable}</strong>
                    <span className="text-slate-500 text-[11px] ml-2 font-mono">
                      (Plan: ₹{activePlan?.price} + Lifetime Fee: ₹{admissionFee} - Discount: ₹{discount})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-300 font-semibold">Paid Today:</span>
                    <input
                      type="number"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(Number(e.target.value))}
                      className="w-24 bg-[#0a0d14] border border-amber-500 rounded-xl px-2.5 py-1 text-xs text-amber-400 font-bold font-mono focus:outline-none"
                    />
                    {dueAmount > 0 && (
                      <span className="text-rose-400 font-bold font-mono text-[11px] px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20">
                        Due: ₹{dueAmount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Payment Mode Selection */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('UPI')}
                    className={`btn-tactile py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      paymentMode === 'UPI'
                        ? 'bg-emerald-500/20 border-emerald-400/80 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                        : 'bg-[#0a0d14] border-white/[0.08] text-slate-400 hover:text-white'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    <span>UPI QR Code (0% Fee)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('CASH')}
                    className={`btn-tactile py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      paymentMode === 'CASH'
                        ? 'bg-emerald-500/20 border-emerald-400/80 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                        : 'bg-[#0a0d14] border-white/[0.08] text-slate-400 hover:text-white'
                    }`}
                  >
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span>Cash Payment</span>
                  </button>
                </div>

                {paymentMode === 'UPI' && (
                  <div className="p-3.5 bg-[#0a0d14] rounded-2xl border border-white/[0.08] flex items-center gap-4 animate-in fade-in duration-200">
                    <img src={qrCodeUrl} alt="UPI QR" className="w-16 h-16 bg-white p-1 rounded-xl shadow-md flex-shrink-0" />
                    <div className="text-xs">
                      <div className="font-bold text-white tracking-tight">Direct Owner UPI Settlement</div>
                      <div className="text-slate-400 font-mono text-[11px] mt-0.5">{upiVpa}</div>
                      <div className="text-emerald-400 font-bold font-mono text-sm mt-1">₹{paidAmount} Live Scan</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-cyber px-6 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-[0_0_20px_-3px_rgba(16,185,129,0.4)] disabled:opacity-50 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[2.75]" />
                  <span>{isSubmitting ? 'Registering...' : 'Complete Admission & Generate Receipt'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
