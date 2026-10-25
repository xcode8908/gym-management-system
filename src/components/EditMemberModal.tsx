'use client';

import { useState, useEffect, useRef } from 'react';
import {
  User,
  Phone,
  Mail,
  Calendar,
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  ShieldCheck,
  Save,
  Clock,
  Sparkles,
  FolderOpen,
} from 'lucide-react';
import { Member } from '@/lib/types';
import PhotoUploadZone from '@/components/PhotoUploadZone';
import MemberDocumentsModal from '@/components/MemberDocumentsModal';

interface EditMemberModalProps {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export default function EditMemberModal({
  member,
  isOpen,
  onClose,
  onSuccess,
}: EditMemberModalProps) {
  if (!isOpen || !member) return null;

  const [fullName, setFullName] = useState(member.fullName);
  const [phone, setPhone] = useState(member.phone);
  const [email, setEmail] = useState(member.email || '');
  const [gender, setGender] = useState(member.gender || 'Male');
  const [emergencyContact, setEmergencyContact] = useState(member.emergencyContact || '');
  const [address, setAddress] = useState(member.address || '');
  const [status, setStatus] = useState<'ACTIVE' | 'EXPIRED' | 'PAUSED'>(member.status);
  const [currentEndDate, setCurrentEndDate] = useState(member.currentEndDate || '');
  const [notes, setNotes] = useState(member.notes || '');
  const [photoUrl, setPhotoUrl] = useState(member.photoUrl || '');

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDocVault, setShowDocVault] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (member) {
      setFullName(member.fullName);
      setPhone(member.phone);
      setEmail(member.email || '');
      setGender(member.gender || 'Male');
      setEmergencyContact(member.emergencyContact || '');
      setAddress(member.address || '');
      setStatus(member.status);
      setCurrentEndDate(member.currentEndDate || '');
      setNotes(member.notes || '');
      setPhotoUrl(member.photoUrl || '');
    }
  }, [member]);

  // Handle Photo Upload (Cloudflare R2)
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
      if (data.fileUrl) {
        setPhotoUrl(data.fileUrl);
      }
    } catch (err) {
      alert('Photo upload failed');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Submit Profile Changes
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setIsSaving(true);
      const res = await fetch('/api/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: member.id,
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
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update member');

      onSuccess(data.message || 'Member profile updated successfully!');
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Member
  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to permanently remove member "${member.fullName}"?`)) {
      return;
    }

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/members?id=${member.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete member');

      onSuccess(data.message || 'Member deleted.');
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div suppressHydrationWarning className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 overflow-y-auto animate-in fade-in duration-200">
      <div suppressHydrationWarning className="bg-[#0b0f17] border border-white/[0.1] rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.08)] relative my-6 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-5">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <img
                src={photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face'}
                alt={fullName}
                className="w-12 h-12 rounded-2xl object-cover border border-white/[0.12] shadow-md"
              />
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-amber-500 text-slate-950 shadow-md hover:bg-amber-400 transition-all"
                title="Change Photo"
              >
                <Camera className="w-3 h-3 stroke-[2.5]" />
              </button>
              <input
                type="file"
                accept="image/*"
                ref={photoInputRef}
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  Edit Member Profile
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.06] text-amber-400 border border-white/[0.08]">
                  {member.memberId}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-bold">
                  Lifetime Member
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                Admitted on {member.admissionDate} • 1st Fee: ₹{member.admissionFeePaid}
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
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Member Photo Upload Zone (Webcam / File / Avatar) */}
          <PhotoUploadZone
            currentPhotoUrl={photoUrl}
            onPhotoSelected={(url) => setPhotoUrl(url)}
            label="Member Photo & Cloudflare Vault"
          />

          {/* Row 1: Full Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[#111726] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Mobile Phone <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#111726] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white font-mono font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Row 2: Email & Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Email Address (For Receipts)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#111726] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-[#111726] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500 font-medium"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Row 3: Emergency Contact & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Emergency Contact</label>
              <input
                type="tel"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                className="w-full bg-[#111726] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Membership Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-[#111726] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white font-bold focus:outline-none focus:border-amber-500"
              >
                <option value="ACTIVE">🟢 ACTIVE (Gym Pass Chalu - Normal Alerts)</option>
                <option value="EXPIRED">🔴 EXPIRED (Plan Khatam - Har 2 Din Me Reminder)</option>
                <option value="PAUSED">🟡 PAUSED (Gym Off / Chhutti - All Messages STOPPED)</option>
              </select>
              {status === 'PAUSED' && (
                <div className="mt-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                  <span>⏸️</span>
                  <span><strong>Gym Off Mode:</strong> Is member ko WhatsApp aur Email pe koi reminder nahi jayega jab tak aap wapas <strong>ACTIVE</strong> na karein.</span>
                </div>
              )}
            </div>
          </div>

          {/* Row 4: Plan Expiry Date Adjustment */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Current Plan Validity Expiry Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={currentEndDate}
                onChange={(e) => setCurrentEndDate(e.target.value)}
                className="w-full bg-[#111726] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white font-mono font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">
              You can manually adjust this date if the member requested a vacation pause or extension.
            </p>
          </div>

          {/* Row 5: Address */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Home Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-[#111726] border border-white/[0.08] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Row 6: Notes */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Notes / Fitness Goals</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Morning batch 7 AM, Weight loss focus, Left knee injury"
              className="w-full bg-[#111726] border border-white/[0.08] rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 resize-none font-medium"
            />
          </div>

          {/* Row 7: Document Vault Access */}
          <div className="p-3.5 rounded-2xl bg-[#101625] border border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-xs font-bold text-white tracking-tight">Cloudflare R2 Document Vault</div>
                <div className="text-[11px] text-slate-400">View, download, or upload Aadhaar, DL, & medical forms</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowDocVault(true)}
              className="btn-tactile px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/25 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Manage Documents</span>
            </button>
          </div>

          {/* Action Bar */}
          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
            {/* Delete button */}
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-3.5 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeleting ? 'Deleting...' : 'Delete Member'}</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="btn-tactile px-6 py-2.5 rounded-xl bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_6px_20px_-3px_rgba(245,158,11,0.35)] disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Member Document Vault Modal */}
      <MemberDocumentsModal
        member={member}
        isOpen={showDocVault}
        onClose={() => setShowDocVault(false)}
        onUpdate={() => {
          // Trigger refresh if needed
        }}
      />
    </div>
  );
}
