'use client';

import { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Printer,
  Send,
  Plus,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Phone,
  Calendar,
  CreditCard,
  QrCode,
  TrendingUp,
  Clock,
  Sparkles,
  FileSpreadsheet,
} from 'lucide-react';
import { Invoice, GymSettings } from '@/lib/types';
import { getDirectWhatsAppUrl, generateWhatsAppMessage } from '@/lib/whatsapp';
import CollectFeeModal from '@/components/CollectFeeModal';

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [settings, setSettings] = useState<GymSettings | null>(null);
  const [filter, setFilter] = useState<'all' | 'paid' | 'due' | 'today'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Collect Fee Modal
  const [isCollectFeeOpen, setIsCollectFeeOpen] = useState(false);
  const [prefilledMemberId, setPrefilledMemberId] = useState<string | undefined>(undefined);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Active Receipt Modal for Printing
  const [activeReceipt, setActiveReceipt] = useState<Invoice | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [billingRes, settingsRes] = await Promise.all([
        fetch('/api/billing'),
        fetch('/api/settings'),
      ]);

      const billingData = await billingRes.json();
      const settingsData = await settingsRes.json();

      setInvoices(billingData.invoices);
      setMetrics(billingData.metrics);
      setSettings(settingsData.settings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadData();

    const handleReload = () => loadData();
    window.addEventListener('reload-billing-data', handleReload);
    return () => window.removeEventListener('reload-billing-data', handleReload);
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.memberName.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.memberPhone.includes(search);

    if (!matchesSearch) return false;
    if (filter === 'paid') return inv.dueAmount === 0;
    if (filter === 'due') return inv.dueAmount > 0;
    if (filter === 'today') return inv.createdAt.startsWith(todayStr);
    return true;
  });

  // Export Invoices Ledger to CSV
  const exportInvoicesToCsv = () => {
    if (!invoices.length) return;
    const headers = ['Invoice Number', 'Member Name', 'Phone', 'Email', 'Plan', 'Plan Price', 'Admission Fee', 'Discount', 'Total Amount', 'Paid Amount', 'Due Amount', 'Payment Mode', 'Status', 'Date'];
    const rows = invoices.map((inv) => [
      `"${inv.invoiceNumber}"`,
      `"${inv.memberName.replace(/"/g, '""')}"`,
      `"${inv.memberPhone}"`,
      `"${inv.memberEmail || ''}"`,
      `"${inv.planName}"`,
      inv.planPrice,
      inv.admissionFee,
      inv.discount,
      inv.totalAmount,
      inv.paidAmount,
      inv.dueAmount,
      `"${inv.paymentMode}"`,
      `"${inv.paymentStatus}"`,
      `"${inv.createdAt.split('T')[0]}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Gym_Invoices_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div suppressHydrationWarning className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
      {/* Top Header & Collect Fee CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Billing & Invoices
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
              0% Fee Direct UPI
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Collect fees, generate instant tax invoices, and dispatch digital receipts on WhatsApp & Email.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Export Invoices CSV */}
          <button
            onClick={exportInvoicesToCsv}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/[0.08] text-xs font-bold transition-all active:scale-95 shadow-sm"
            title="Export Invoices to CSV / Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          {/* Primary Collect Fee Action Button */}
          <button
            onClick={() => {
              setPrefilledMemberId(undefined);
              setIsCollectFeeOpen(true);
            }}
            className="btn-cyber flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-extrabold shadow-[0_0_20px_-3px_rgba(16,185,129,0.4)] active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>➕ Collect Fee / New Bill</span>
          </button>
        </div>
      </div>


      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-xs underline text-emerald-400">
            Dismiss
          </button>
        </div>
      )}

      {/* Financial Overview Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Collection */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Today's Collection</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
            ₹{(metrics?.todayCollected || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Direct to UPI / Cash</div>
        </div>

        {/* Total Collected */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            ₹{(metrics?.totalCollected || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Total revenue collected</div>
        </div>

        {/* Pending Unpaid Dues */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Dues</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 font-mono">
            ₹{(metrics?.totalDue || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-rose-400/80 mt-1">
            {metrics?.dueCount || 0} Unpaid Installments
          </div>
        </div>

        {/* Total Invoices Issued */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Invoices Issued</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {metrics?.totalCount || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">100% Digital records</div>
        </div>
      </div>

      {/* Search & Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 glass-panel p-3.5 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search invoice number, name, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#050811] border border-white/[0.1] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: 'all', label: 'All Invoices' },
            { key: 'today', label: "Today's Bills" },
            { key: 'due', label: `Pending Dues (${metrics?.dueCount || 0})` },
            { key: 'paid', label: 'Fully Paid' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
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


      {/* Invoices Ledger Table & Mobile Cards */}
      <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-4">Invoice No</th>
                <th className="px-5 py-4">Member Details</th>
                <th className="px-5 py-4">Plan & Breakdown</th>
                <th className="px-5 py-4">Total Amount</th>
                <th className="px-5 py-4">Paid / Due</th>
                <th className="px-5 py-4">Mode</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <Receipt className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-50" />
                    <div className="text-sm font-semibold text-slate-300">No invoices found</div>
                    <div className="text-xs text-slate-500 mt-1">
                      Click the "Collect Fee" button above to generate a new bill.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const waText = generateWhatsAppMessage('INVOICE', {
                    memberName: inv.memberName,
                    gymName: settings?.gymName || 'Iron Core Gym',
                    planName: inv.planName,
                    amount: inv.paidAmount,
                    dueAmount: inv.dueAmount,
                    invoiceNumber: inv.invoiceNumber,
                  });
                  const waUrl = getDirectWhatsAppUrl(inv.memberPhone, waText);

                  return (
                    <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Invoice Number */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg text-xs">
                          {inv.invoiceNumber}
                        </span>
                      </td>

                      {/* Member Info */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-white text-sm">{inv.memberName}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{inv.memberPhone}</span>
                        </div>
                      </td>

                      {/* Plan Breakdown */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-200">{inv.planName}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Plan: ₹{inv.planPrice}
                          {inv.admissionFee > 0 && ` + Adm: ₹${inv.admissionFee}`}
                          {inv.discount > 0 && ` - Disc: ₹${inv.discount}`}
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="px-5 py-4 font-mono font-bold text-white text-sm whitespace-nowrap">
                        ₹{inv.totalAmount}
                      </td>

                      {/* Paid & Due */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-emerald-400 text-sm">
                          ₹{inv.paidAmount}
                        </div>
                        {inv.dueAmount > 0 && (
                          <div className="text-[11px] font-bold text-rose-400 flex items-center gap-1 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Due: ₹{inv.dueAmount}
                          </div>
                        )}
                      </td>

                      {/* Payment Mode */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                          {inv.paymentMode}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                        {inv.createdAt.split('T')[0]}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {inv.dueAmount > 0 && (
                            <button
                              onClick={() => {
                                setPrefilledMemberId(inv.memberId);
                                setIsCollectFeeOpen(true);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-bold transition-all"
                            >
                              Collect Due
                            </button>
                          )}

                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all"
                            title="Send Receipt on WhatsApp"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </a>

                          <button
                            onClick={() => setActiveReceipt(inv)}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-all"
                          >
                            <Printer className="w-3.5 h-3.5 text-amber-400" />
                            <span>Receipt</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View (Optimized for Small Screens) */}
        <div className="md:hidden divide-y divide-white/[0.06]">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12 px-4 text-slate-400">
              <Receipt className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-50" />
              <div className="text-sm font-semibold text-slate-300">No invoices found</div>
              <div className="text-xs text-slate-500 mt-1">
                Click "➕ Collect Fee" above to create an invoice.
              </div>
            </div>
          ) : (
            filteredInvoices.map((inv) => {
              const waText = generateWhatsAppMessage('INVOICE', {
                memberName: inv.memberName,
                gymName: settings?.gymName || 'Iron Core Gym',
                planName: inv.planName,
                amount: inv.paidAmount,
                dueAmount: inv.dueAmount,
                invoiceNumber: inv.invoiceNumber,
              });
              const waUrl = getDirectWhatsAppUrl(inv.memberPhone, waText);

              return (
                <div key={inv.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-lg text-xs">
                      {inv.invoiceNumber}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-white/[0.05] text-slate-300 border border-white/[0.08]">
                        {inv.paymentMode}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {inv.createdAt.split('T')[0]}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="font-bold text-white text-base">{inv.memberName}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 font-mono">
                      <Phone className="w-3 h-3 text-slate-500" />
                      <span>{inv.memberPhone}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.05] text-xs">
                    <div>
                      <div className="text-slate-400 text-[10px] uppercase font-bold">Plan</div>
                      <div className="text-slate-200 font-semibold">{inv.planName}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-400 text-[10px] uppercase font-bold">Paid / Total</div>
                      <div className="font-mono font-bold text-emerald-400">
                        ₹{inv.paidAmount} <span className="text-slate-400 font-normal">/ ₹{inv.totalAmount}</span>
                      </div>
                      {inv.dueAmount > 0 && (
                        <div className="text-[10px] text-rose-400 font-bold font-mono">
                          Due: ₹{inv.dueAmount}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    {inv.dueAmount > 0 && (
                      <button
                        onClick={() => {
                          setPrefilledMemberId(inv.memberId);
                          setIsCollectFeeOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all"
                      >
                        Collect Due
                      </button>
                    )}

                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </a>

                    <button
                      onClick={() => setActiveReceipt(inv)}
                      className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white font-bold text-xs flex items-center gap-1.5 border border-white/[0.1]"
                    >
                      <Printer className="w-3 h-3 text-emerald-400" />
                      <span>Receipt</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Collect Fee Modal */}
      <CollectFeeModal
        isOpen={isCollectFeeOpen}
        initialMemberId={prefilledMemberId}
        onClose={() => setIsCollectFeeOpen(false)}
        onSuccess={(msg) => {
          setSuccessMessage(msg);
          loadData();
          setTimeout(() => setSuccessMessage(null), 5000);
        }}
      />

      {/* Printable Receipt Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl relative my-6 print:p-0 print:shadow-none">
            {/* Header controls (Hidden during print) */}
            <div className="no-print flex items-center justify-between border-b pb-3 mb-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Official Gym Payment Receipt
              </span>
              <button
                onClick={() => setActiveReceipt(null)}
                className="text-slate-400 hover:text-slate-900 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Printable Area */}
            <div className="text-center pb-4 border-b border-dashed border-slate-300 space-y-1">
              <h2 className="text-xl font-extrabold tracking-tight uppercase">
                {settings?.gymName || 'Iron Core Gym'}
              </h2>
              <p className="text-xs text-slate-600">{settings?.address}</p>
              <p className="text-xs text-slate-600">
                Phone: {settings?.phone} • UPI: {settings?.upiId}
              </p>
              <div className="pt-2 text-xs font-mono font-bold text-slate-800">
                INVOICE: #{activeReceipt.invoiceNumber}
              </div>
              <div className="text-[11px] text-slate-500">
                Date: {activeReceipt.createdAt.replace('T', ' ').substring(0, 19)}
              </div>
            </div>

            {/* Member Details */}
            <div className="py-3 border-b border-dashed border-slate-300 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Member Name:</span>
                <strong className="text-slate-900">{activeReceipt.memberName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="font-mono">{activeReceipt.memberPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Membership Plan:</span>
                <span className="font-semibold text-slate-800">{activeReceipt.planName}</span>
              </div>
            </div>

            {/* Itemized Cost Breakdown */}
            <div className="py-3 border-b border-dashed border-slate-300 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-600 font-sans">Plan Fee:</span>
                <span>₹{activeReceipt.planPrice}</span>
              </div>
              {activeReceipt.admissionFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600 font-sans">One-time Admission Fee:</span>
                  <span>₹{activeReceipt.admissionFee}</span>
                </div>
              )}
              {activeReceipt.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span className="font-sans">Discount:</span>
                  <span>- ₹{activeReceipt.discount}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm pt-2 border-t border-slate-200">
                <span className="font-sans">Total Amount:</span>
                <span>₹{activeReceipt.totalAmount}</span>
              </div>
            </div>

            {/* Paid & Due */}
            <div className="py-3 text-xs space-y-1 font-mono">
              <div className="flex justify-between font-bold text-base text-slate-900">
                <span className="font-sans">Amount Paid:</span>
                <span>₹{activeReceipt.paidAmount}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="font-sans">Payment Mode:</span>
                <span className="uppercase">{activeReceipt.paymentMode}</span>
              </div>
              {activeReceipt.dueAmount > 0 && (
                <div className="flex justify-between font-bold text-rose-600 pt-1">
                  <span className="font-sans">Balance Due:</span>
                  <span>₹{activeReceipt.dueAmount}</span>
                </div>
              )}
            </div>

            {/* Footer message */}
            <div className="text-center pt-4 border-t border-dashed border-slate-300 text-[11px] text-slate-500">
              Thank you for choosing {settings?.gymName || 'our gym'}!
              <div className="text-[10px] text-slate-400 mt-1">
                Computer-generated receipt with permanent lifetime record.
              </div>
            </div>

            {/* Action Bar (Hidden during print) */}
            <div className="no-print pt-6 flex items-center justify-end gap-3 border-t mt-4">
              <button
                onClick={() => setActiveReceipt(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 text-slate-800 text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-2 shadow-lg"
              >
                <Printer className="w-4 h-4" />
                <span>Print Thermal Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
