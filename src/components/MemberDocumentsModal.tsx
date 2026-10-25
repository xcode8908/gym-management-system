'use client';

import { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Download,
  Eye,
  Trash2,
  Plus,
  Upload,
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  FileCheck,
} from 'lucide-react';
import { Member, MemberDocument } from '@/lib/types';

interface MemberDocumentsModalProps {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export default function MemberDocumentsModal({
  member,
  isOpen,
  onClose,
  onUpdate,
}: MemberDocumentsModalProps) {
  if (!isOpen || !member) return null;

  const [documents, setDocuments] = useState<MemberDocument[]>(member.documents || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New Document Upload State
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [newDocType, setNewDocType] = useState<'AADHAAR' | 'DRIVING_LICENSE' | 'MEDICAL_FORM' | 'OTHER'>('AADHAAR');
  const [newDocName, setNewDocName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fullscreen Preview Modal
  const [previewDoc, setPreviewDoc] = useState<MemberDocument | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMemberDocs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/documents?memberId=${member.id}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setDocuments(data);
      }
    } catch (err: any) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (member) {
      fetchMemberDocs();
    }
  }, [member]);

  // Handle Download Action
  const handleDownload = async (doc: MemberDocument) => {
    try {
      // If it's a data URL or direct link, download it
      if (doc.fileUrl.startsWith('data:')) {
        const a = document.createElement('a');
        a.href = doc.fileUrl;
        a.download = doc.documentName || `${doc.documentType}_Document`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }

      const res = await fetch(doc.fileUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.documentName || `${doc.documentType}_Document`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      // Fallback: open in new tab
      window.open(doc.fileUrl, '_blank');
    }
  };

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setNewDocName(file.name);
    }
  };

  // Upload New Document
  const handleUploadNewDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Step 1: Upload file to /api/upload (Cloudflare R2)
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', newDocType);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.fileUrl) {
        throw new Error(uploadData.error || 'Failed to upload file to Cloudflare R2');
      }

      // Step 2: Attach to Member Document Vault
      const attachRes = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: member.id,
          documentType: newDocType,
          documentName: newDocName || selectedFile.name,
          fileUrl: uploadData.fileUrl,
          fileSize: uploadData.fileSize || Math.round(selectedFile.size / 1024),
        }),
      });

      const attachData = await attachRes.json();
      if (!attachRes.ok) throw new Error(attachData.error || 'Failed to attach document to member');

      setSuccess(`Document "${newDocName || selectedFile.name}" added to Vault successfully!`);
      setShowUploadForm(false);
      setSelectedFile(null);
      setNewDocName('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      fetchMemberDocs();
      if (onUpdate) onUpdate();

      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Delete Document
  const handleDeleteDocument = async (docId: string, docName: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${docName}" from the vault?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/documents?id=${docId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');

      setSuccess(`Document "${docName}" removed.`);
      fetchMemberDocs();
      if (onUpdate) onUpdate();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getDocTypeBadge = (type: string) => {
    switch (type) {
      case 'AADHAAR':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
      case 'DRIVING_LICENSE':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/25';
      case 'MEDICAL_FORM':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25';
      default:
        return 'bg-purple-500/10 text-purple-400 border-purple-500/25';
    }
  };

  return (
    <>
      <div suppressHydrationWarning className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 overflow-y-auto animate-in fade-in duration-200">
        <div suppressHydrationWarning className="bg-[#0b0f17] border border-white/[0.1] rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.08)] relative my-6 text-slate-100">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-5">
            <div className="flex items-center gap-3.5">
              <img
                src={member.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face'}
                alt={member.fullName}
                className="w-12 h-12 rounded-2xl object-cover border border-white/[0.12] shadow-md flex-shrink-0"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-extrabold text-white tracking-tight">
                    Document Vault
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.06] text-amber-400 border border-white/[0.08]">
                    {member.memberId}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Cloudflare R2
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                  Verified ID Proofs & Forms for <strong className="text-white">{member.fullName}</strong>
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

          {/* Alerts */}
          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Action Bar: Upload New Document Button */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>Vault Documents ({documents.length})</span>
            </div>

            <button
              type="button"
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="btn-tactile px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showUploadForm ? 'Close Upload Form' : 'Upload New Document'}</span>
            </button>
          </div>

          {/* Upload New Document Form (Collapsible) */}
          {showUploadForm && (
            <form
              onSubmit={handleUploadNewDocument}
              className="mb-5 p-4 rounded-2xl bg-[#111726] border border-white/[0.08] space-y-3.5 animate-in slide-in-from-top-2 duration-200"
            >
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-amber-400" />
                <span>Upload New ID Proof / Document</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Document Type
                  </label>
                  <select
                    value={newDocType}
                    onChange={(e) => setNewDocType(e.target.value as any)}
                    className="w-full bg-[#0a0d14] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                  >
                    <option value="AADHAAR">Aadhaar Card</option>
                    <option value="DRIVING_LICENSE">Driving License</option>
                    <option value="MEDICAL_FORM">Medical Certificate</option>
                    <option value="OTHER">Other Agreement / Proof</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Document Label / Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Aadhaar Front & Back"
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    className="w-full bg-[#0a0d14] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Choose File (PDF / JPG / PNG)
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 rounded-xl border border-dashed border-white/[0.15] hover:border-amber-400/60 bg-[#0a0d14] hover:bg-white/[0.02] text-xs font-semibold text-slate-300 flex items-center justify-center gap-2 transition-all"
                >
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span>{selectedFile ? selectedFile.name : 'Click to select Aadhaar / DL File'}</span>
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="btn-tactile px-5 py-2 rounded-xl bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 disabled:opacity-50"
                >
                  <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{uploading ? 'Uploading to R2 Vault...' : 'Save to Vault'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Documents List */}
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">Loading vault records...</div>
            ) : documents.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-white/[0.02] border border-white/[0.06] text-slate-400 space-y-2">
                <FileText className="w-10 h-10 text-slate-600 mx-auto" />
                <div className="text-sm font-bold text-slate-300">No Documents Uploaded Yet</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Member has not submitted an Aadhaar or Driving License yet. Click "Upload New Document" above to store it in Cloudflare R2.
                </p>
              </div>
            ) : (
              documents.map((doc) => {
                const isImage = doc.fileUrl?.match(/\.(jpeg|jpg|png|webp)($|\?)/i) || doc.fileUrl?.startsWith('data:image');
                const isPdf = doc.fileUrl?.match(/\.pdf($|\?)/i) || doc.fileUrl?.startsWith('data:application/pdf');

                return (
                  <div
                    key={doc.id}
                    className="p-4 rounded-2xl bg-[#101625] border border-white/[0.08] hover:border-white/[0.14] flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                  >
                    {/* Left: Icon, Name & Type */}
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-[#0a0d14] border border-white/[0.08] flex items-center justify-center flex-shrink-0 text-amber-400">
                        <FileText className="w-5 h-5" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white tracking-tight">
                            {doc.documentName}
                          </span>
                          <span
                            className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${getDocTypeBadge(
                              doc.documentType || (doc as any).type || 'OTHER'
                            )}`}
                          >
                            {doc.documentType || (doc as any).type || 'DOCUMENT'}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-3 font-mono">
                          <span>{doc.fileSize ? `${doc.fileSize} KB` : 'Cloud Object'}</span>
                          <span>•</span>
                          <span>
                            Uploaded on{' '}
                            {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions (View, Download, Delete) */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {/* View / Preview Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (isImage) {
                            setPreviewDoc(doc);
                          } else {
                            window.open(doc.fileUrl, '_blank');
                          }
                        }}
                        className="btn-tactile px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 hover:text-white border border-white/[0.08] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                        title="View / Inspect Document"
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        <span>View</span>
                      </button>

                      {/* Download Button */}
                      <button
                        type="button"
                        onClick={() => handleDownload(doc)}
                        className="btn-tactile px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/25 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                        title="Download to Computer / Phone"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteDocument(doc.id, doc.documentName)}
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Info */}
          <div className="mt-5 pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Lifetime Permanent Storage (Free Cloudflare R2 / Neon)</span>
            </span>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-semibold transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Preview Lightbox */}
      {previewDoc && (
        <div
          suppressHydrationWarning
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 animate-in fade-in duration-150"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="max-w-3xl w-full bg-[#0a0d14] border border-white/[0.15] rounded-3xl p-5 shadow-2xl relative space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h4 className="text-base font-bold text-white tracking-tight">{previewDoc.documentName}</h4>
                <p className="text-xs text-slate-400 font-mono">{previewDoc.documentType} • {member.fullName}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownload(previewDoc)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="max-h-[70vh] overflow-hidden flex items-center justify-center rounded-2xl bg-black/60 p-2">
              <img
                src={previewDoc.fileUrl}
                alt={previewDoc.documentName}
                className="max-h-[65vh] w-auto object-contain rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
