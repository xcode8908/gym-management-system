'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Dumbbell,
  DollarSign,
  Bell,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  QrCode,
  Shield,
  Smartphone,
  Cloud,
  Sparkles,
  ShieldCheck,
  Check,
  Clock,
  ArrowRight,
  Receipt,
  Info,
  Send,
  LogOut,
  RefreshCw,
  ExternalLink,
  Mail,
  Lock,
  Key,
} from 'lucide-react';
import { GymSettings, Plan } from '@/lib/types';

export default function SettingsPage() {
  const [settings, setSettings] = useState<GymSettings | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'admission' | 'plans' | 'profile' | 'alerts'>('admission');

  // Saving states per section
  const [savingAdmission, setSavingAdmission] = useState(false);
  const [savingPlans, setSavingPlans] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAlerts, setSavingAlerts] = useState(false);
  const [savedBanner, setSavedBanner] = useState<string | null>(null);

  // Form State
  const [gymName, setGymName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [upiId, setUpiId] = useState('');
  const [defaultAdmissionFee, setDefaultAdmissionFee] = useState<number>(500);
  const [enableAdmissionFee, setEnableAdmissionFee] = useState<boolean>(true);
  const [alertDay7, setAlertDay7] = useState<boolean>(true);
  const [alertDay3, setAlertDay3] = useState<boolean>(true);
  const [alertDay1, setAlertDay1] = useState<boolean>(true);
  const [alertOverdue2Days, setAlertOverdue2Days] = useState<boolean>(true);

  // New Plan form
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanDays, setNewPlanDays] = useState(30);
  const [newPlanPrice, setNewPlanPrice] = useState(1200);

  // Hands-Free WhatsApp Bot Status
  const [botStatus, setBotStatus] = useState<'CONNECTED' | 'WAITING_SCAN' | 'OFFLINE'>('WAITING_SCAN');
  const [botQrCode, setBotQrCode] = useState<string | null>(null);
  const [botChecking, setBotChecking] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  const checkBotStatus = async () => {
    try {
      setBotChecking(true);
      const res = await fetch('/api/whatsapp/status', { cache: 'no-store' });
      const data = await res.json();
      if (data.isConnected) {
        setBotStatus('CONNECTED');
        setBotQrCode(null);
      } else if (data.status === 'WAITING_SCAN') {
        setBotStatus('WAITING_SCAN');
        if (data.qrCodeData) {
          setBotQrCode(data.qrCodeData);
        }
      } else {
        setBotStatus('OFFLINE');
      }
    } catch (err) {
      setBotStatus('OFFLINE');
    } finally {
      setBotChecking(false);
    }
  };

  // Test WhatsApp message state
  const [testPhone, setTestPhone] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleSendTestWhatsApp = async () => {
    if (!testPhone) return;
    try {
      setTestSending(true);
      setTestResult(null);
      const res = await fetch('/api/whatsapp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testPhone }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult(`✅ Message delivered to ${testPhone}! Check your WhatsApp.`);
      } else {
        setTestResult(`❌ Failed: ${data.error || 'Could not send WhatsApp message'}`);
      }
    } catch (err: any) {
      setTestResult(`❌ Network Error: ${err.message}`);
    } finally {
      setTestSending(false);
    }
  };

  const handleDisconnectWhatsApp = async () => {
    if (!confirm('Kya aap yeh WhatsApp number disconnect / unlink karna chahte hain? Unlink karne ke baad aap doosra (naya) WhatsApp number scan kar sakenge.')) return;
    try {
      setUnlinking(true);
      const res = await fetch('/api/whatsapp/logout', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert('✅ WhatsApp unlinked successfully! Ab aap naya WhatsApp number scan kar sakte hain.');
        setBotStatus('WAITING_SCAN');
        setTimeout(() => checkBotStatus(), 1000);
      } else {
        alert('Failed to unlink: ' + (data.error || 'Server error'));
      }
    } catch (err: any) {
      alert('Failed to unlink WhatsApp bot: ' + err.message);
    } finally {
      setUnlinking(false);
    }
  };

  // Automated Email Engine Status & Management
  const [emailStatus, setEmailStatus] = useState<'CONNECTED' | 'DISCONNECTED'>('DISCONNECTED');
  const [emailProvider, setEmailProvider] = useState<'GMAIL' | 'RESEND' | 'SIMULATOR'>('SIMULATOR');
  const [emailSenderLabel, setEmailSenderLabel] = useState('');
  const [emailUser, setEmailUser] = useState('');
  const [emailChecking, setEmailChecking] = useState(false);
  const [unlinkingEmail, setUnlinkingEmail] = useState(false);

  // Email Setup Form State
  const [emailSetupTab, setEmailSetupTab] = useState<'GMAIL' | 'RESEND'>('GMAIL');
  const [setupGmailUser, setSetupGmailUser] = useState('');
  const [setupGmailPassword, setSetupGmailPassword] = useState('');
  const [setupResendKey, setSetupResendKey] = useState('');
  const [setupResendFrom, setSetupResendFrom] = useState('');
  const [connectingEmail, setConnectingEmail] = useState(false);

  // Email Live Test State
  const [testEmail, setTestEmail] = useState('');
  const [testEmailSending, setTestEmailSending] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<string | null>(null);
  const [savingEmailOnly, setSavingEmailOnly] = useState(false);

  const checkEmailStatus = async () => {
    try {
      setEmailChecking(true);
      const res = await fetch('/api/email/status', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setEmailStatus(data.isConnected ? 'CONNECTED' : 'DISCONNECTED');
        setEmailProvider(data.provider);
        setEmailSenderLabel(data.senderLabel || '');
        if (data.emailUser) {
          setEmailUser(data.emailUser);
          setSetupGmailUser(data.emailUser);
        }
      }
    } catch (e) {
      setEmailStatus('DISCONNECTED');
    } finally {
      setEmailChecking(false);
    }
  };

  const handleConnectEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setConnectingEmail(true);
      const res = await fetch('/api/email/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: emailSetupTab,
          emailUser: setupGmailUser,
          emailPassword: setupGmailPassword,
          resendApiKey: setupResendKey,
          resendFrom: setupResendFrom,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('🎉 ' + data.message);
        setSetupGmailPassword('');
        checkEmailStatus();
      } else {
        alert('❌ ' + (data.error || 'Connection failed'));
      }
    } catch (err: any) {
      alert('Error connecting email: ' + err.message);
    } finally {
      setConnectingEmail(false);
    }
  };

  const handleDisconnectEmail = async () => {
    if (!confirm('Kya aap yeh Email account disconnect / unlink karna chahte hain? Unlink karne ke baad aap naya email address link kar sakenge.')) return;
    try {
      setUnlinkingEmail(true);
      const res = await fetch('/api/email/logout', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert('✅ ' + data.message);
        setEmailStatus('DISCONNECTED');
        checkEmailStatus();
      } else {
        alert('Failed to disconnect: ' + (data.error || 'Server error'));
      }
    } catch (err: any) {
      alert('Error disconnecting email: ' + err.message);
    } finally {
      setUnlinkingEmail(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) return;
    try {
      setTestEmailSending(true);
      setTestEmailResult(null);
      const res = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setTestEmailResult(`✅ ${data.message}`);
      } else {
        setTestEmailResult(`❌ Failed: ${data.error || 'Could not send test email'}`);
      }
    } catch (err: any) {
      setTestEmailResult(`❌ Network Error: ${err.message}`);
    } finally {
      setTestEmailSending(false);
    }
  };

  // Manual Cron Trigger State
  const [triggeringCron, setTriggeringCron] = useState(false);
  const [cronResult, setCronResult] = useState<string | null>(null);

  const handleTriggerCronNow = async () => {
    try {
      setTriggeringCron(true);
      setCronResult(null);
      const res = await fetch('/api/cron/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer dev_cron_secret',
        },
      });
      const data = await res.json();
      if (data.success) {
        setCronResult(`🚀 Automated Cron Run Successful! Scanned ${data.totalActiveChecked} active members. Automatically dispatched ${data.alertsDispatchedCount} expiry alerts (WhatsApp + Email).`);
      } else {
        setCronResult(`❌ Cron error: ${data.error || 'Failed'}`);
      }
    } catch (e: any) {
      setCronResult(`❌ Cron failed: ${e.message}`);
    } finally {
      setTriggeringCron(false);
    }
  };

  const handleSaveGymEmail = async () => {
    try {
      setSavingEmailOnly(true);
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            gymName,
            phone,
            email,
            address,
            upiId,
          },
        }),
      });
      if (res.ok) {
        showSuccess('Gym official email updated successfully!');
      } else {
        alert('Failed to save email');
      }
    } catch (err: any) {
      alert('Error updating email: ' + err.message);
    } finally {
      setSavingEmailOnly(false);
    }
  };

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setSettings(data.settings);
          setGymName(data.settings.gymName || '');
          setPhone(data.settings.phone || '');
          setEmail(data.settings.email || '');
          setAddress(data.settings.address || '');
          setUpiId(data.settings.upiId || '');
          setDefaultAdmissionFee(data.settings.defaultAdmissionFee || 500);
          setEnableAdmissionFee(data.settings.enableAdmissionFee ?? true);
          setAlertDay7(data.settings.alertDay7 ?? true);
          setAlertDay3(data.settings.alertDay3 ?? true);
          setAlertDay1(data.settings.alertDay1 ?? true);
          setAlertOverdue2Days(data.settings.alertOverdue2Days ?? true);
        }
        if (data.plans) {
          setPlans(data.plans);
        }
      })
      .finally(() => setLoading(false));

    checkBotStatus();
    checkEmailStatus();
  }, []);

  // Auto-refresh bot status every 4 seconds when waiting for QR scan
  useEffect(() => {
    let interval: any;
    if (activeTab === 'alerts' && botStatus === 'WAITING_SCAN') {
      interval = setInterval(() => {
        checkBotStatus();
      }, 4000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTab, botStatus]);

  const showSuccess = (msg: string) => {
    setSavedBanner(msg);
    setTimeout(() => setSavedBanner(null), 4000);
  };

  // 1. Save Admission Pricing Specifically
  const handleSaveAdmissionPricing = async () => {
    try {
      setSavingAdmission(true);
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            defaultAdmissionFee,
            enableAdmissionFee,
          },
        }),
      });

      if (res.ok) {
        showSuccess('Admission pricing & one-time fee rules updated successfully!');
      }
    } catch (err) {
      alert('Failed to save admission pricing');
    } finally {
      setSavingAdmission(false);
    }
  };

  // 2. Save Membership Plans
  const handleSavePlans = async () => {
    try {
      setSavingPlans(true);
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plans }),
      });

      if (res.ok) {
        showSuccess('Membership packages updated successfully!');
      }
    } catch (err) {
      alert('Failed to save plans');
    } finally {
      setSavingPlans(false);
    }
  };

  // 3. Save Gym Profile & UPI
  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            gymName,
            phone,
            email,
            address,
            upiId,
          },
        }),
      });

      if (res.ok) {
        showSuccess('Gym profile and UPI QR details saved!');
      }
    } catch (err) {
      alert('Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // 4. Save Alert Schedule
  const handleSaveAlerts = async () => {
    try {
      setSavingAlerts(true);
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            alertDay7,
            alertDay3,
            alertDay1,
            alertOverdue2Days,
          },
        }),
      });

      if (res.ok) {
        showSuccess('Automated alert schedule & overdue rules updated!');
      }
    } catch (err) {
      alert('Failed to save alerts');
    } finally {
      setSavingAlerts(false);
    }
  };

  const handleAddPlan = () => {
    if (!newPlanName) return;
    const newPlan: Plan = {
      id: `plan-${Date.now()}`,
      name: newPlanName,
      durationDays: Number(newPlanDays),
      price: Number(newPlanPrice),
      isActive: true,
    };
    setPlans([...plans, newPlan]);
    setNewPlanName('');
  };

  const handleDeletePlan = (id: string) => {
    setPlans(plans.filter((p) => p.id !== id));
  };

  // Dynamic Live UPI QR Code preview
  const upiUri = `upi://pay?pa=${upiId || 'irongym@upi'}&pn=${encodeURIComponent(gymName || 'Gym')}&cu=INR`;
  const upiQrPreview = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUri)}`;

  return (
    <div suppressHydrationWarning className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
      {/* Header */}
      <div className="surface-panel p-6 sm:p-7 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Settings & Pricing Setup
            </h1>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25 tracking-widest uppercase">
              ADMIN CONTROL
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
            Configure one-time admission fees, membership packages, direct UPI ID, and automated 7/3/1-day alerts.
          </p>
        </div>

        {/* Global Save Indicator */}
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-3.5 py-1.5 rounded-xl font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>Config Synced</span>
        </div>
      </div>

      {/* Global Toast Success Message */}
      {savedBanner && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-2.5 font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>{savedBanner}</span>
          </div>
          <button onClick={() => setSavedBanner(null)} className="text-[11px] text-emerald-400 underline font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {/* Segmented Category Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 p-1.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
        {[
          { key: 'admission', label: '🏷️ Admission & Pricing Setup', desc: 'One-time registration rules' },
          { key: 'plans', label: '🏋️ Membership Plans', desc: 'Durations & pricing' },
          { key: 'profile', label: '🏢 Gym Profile & UPI QR', desc: 'Direct payment account' },
          { key: 'alerts', label: '🔔 7/3/1-Day Alerts', desc: 'Automated notification engine' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as any)}
            className={`btn-tactile flex-1 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.key
                ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-300 border border-emerald-500/30 shadow-[0_0_15px_-3px_rgba(16,185,129,0.25)]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: ADMISSION PRICING & FEE SETUP */}
      {activeTab === 'admission' && (
        <div className="surface-panel rounded-3xl p-6 sm:p-8 space-y-6 border border-white/[0.08] animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-400 stroke-[2.5]" />
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Admission Pricing & One-Time Fee Setup
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Configure what fresh walk-in members pay on their first day. Existing members automatically pay ₹0.00.
              </p>
            </div>

            {/* DIRECT SECTION SAVE BUTTON */}
            <button
              type="button"
              onClick={handleSaveAdmissionPricing}
              disabled={savingAdmission}
              className="btn-cyber flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold shadow-[0_0_20px_-3px_rgba(16,185,129,0.4)] disabled:opacity-50 self-start sm:self-auto cursor-pointer"
            >
              <Save className="w-4 h-4 stroke-[2.75]" />
              <span>{savingAdmission ? 'Saving...' : '💾 Save Admission Pricing'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Controls */}
            <div className="space-y-5">
              {/* Fee Input & Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Default One-Time Admission Fee (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={defaultAdmissionFee}
                    onChange={(e) => setDefaultAdmissionFee(Number(e.target.value))}
                    className="w-full bg-[#111726] border border-white/[0.08] rounded-2xl pl-8 pr-4 py-3 text-base text-amber-400 font-mono font-extrabold focus:outline-none focus:border-amber-500/80 shadow-inner"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-2 mt-2.5">
                  <span className="text-[11px] text-slate-500 font-medium">Quick Presets:</span>
                  {[
                    { label: 'Free (₹0)', value: 0 },
                    { label: 'Standard (₹500)', value: 500 },
                    { label: 'Premium (₹1,000)', value: 1000 },
                    { label: 'Elite (₹1,500)', value: 1500 },
                  ].map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setDefaultAdmissionFee(preset.value)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all ${
                        defaultAdmissionFee === preset.value
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/[0.06]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* iOS / Linear Style Toggle Switch */}
              <div className="p-4 rounded-2xl bg-[#111726] border border-white/[0.06] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Enable Admission Fee on Walk-Ins</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    When enabled, the new admission form automatically adds this fee.
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={enableAdmissionFee}
                  onClick={() => setEnableAdmissionFee(!enableAdmissionFee)}
                  className={`w-12 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                    enableAdmissionFee ? 'bg-amber-500' : 'bg-white/10'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                      enableAdmissionFee ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Right: Live Calculation Preview Box */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-amber-400" />
                  <span>Live Bill Calculation Preview</span>
                </div>

                <div className="space-y-2 text-xs">
                  {/* Case 1: Brand New Member */}
                  <div className="p-3 rounded-xl bg-[#111726]/80 border border-white/[0.06] space-y-1">
                    <div className="flex justify-between font-bold text-white">
                      <span>1st Time Walk-in Member:</span>
                      <span className="font-mono text-amber-400">
                        ₹{(1200 + (enableAdmissionFee ? defaultAdmissionFee : 0)).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Plan (₹1,200) + Admission ({enableAdmissionFee ? `₹${defaultAdmissionFee}` : '₹0'})
                    </div>
                  </div>

                  {/* Case 2: Renewing Lifetime Member */}
                  <div className="p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20 space-y-1">
                    <div className="flex justify-between font-bold text-white">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <ShieldCheck className="w-3.5 h-3.5" /> Renewing Lifetime Member:
                      </span>
                      <span className="font-mono text-emerald-400">₹1,200</span>
                    </div>
                    <div className="text-[11px] text-emerald-300/80 font-mono">
                      Plan (₹1,200) + Admission (₹0.00 Locked Forever!)
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Tip */}
              <div className="text-[11px] text-slate-400 bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.04] flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>
                  Tip: Remember to click <strong>"Save Admission Pricing"</strong> to apply this default to all future walk-ins.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MEMBERSHIP PACKAGES */}
      {activeTab === 'plans' && (
        <div className="surface-panel rounded-3xl p-6 sm:p-8 space-y-6 border border-white/[0.08] animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-amber-400 stroke-[2.5]" />
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Membership Packages & Durations
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Configure your gym's workout packages, duration in days, and fees.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSavePlans}
              disabled={savingPlans}
              className="btn-cyber flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold shadow-[0_0_20px_-3px_rgba(16,185,129,0.4)] disabled:opacity-50 self-start sm:self-auto cursor-pointer"
            >
              <Save className="w-4 h-4 stroke-[2.75]" />
              <span>{savingPlans ? 'Saving...' : '💾 Save Packages'}</span>
            </button>
          </div>

          {/* Current Plans Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="p-4 rounded-2xl bg-[#111726] border border-white/[0.06] flex flex-col justify-between space-y-3 hover:border-white/[0.14] transition-all"
              >
                <div>
                  <div className="font-extrabold text-white text-base">{plan.name}</div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    {plan.durationDays} Days Access
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                  <span className="font-mono font-extrabold text-amber-400 text-base">
                    ₹{plan.price.toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeletePlan(plan.id)}
                    className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors"
                    title="Delete package"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Package Bar */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Add New Package
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <input
                type="text"
                placeholder="Plan Name (e.g. 2 Months Cardio)"
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                className="sm:col-span-2 bg-[#111726] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <input
                type="number"
                placeholder="Duration (Days)"
                value={newPlanDays}
                onChange={(e) => setNewPlanDays(Number(e.target.value))}
                className="bg-[#111726] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Price (₹)"
                  value={newPlanPrice}
                  onChange={(e) => setNewPlanPrice(Number(e.target.value))}
                  className="w-full bg-[#111726] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={handleAddPlan}
                  className="btn-tactile px-3.5 py-2 rounded-xl bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold text-xs shadow-md"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GYM PROFILE & UPI QR */}
      {activeTab === 'profile' && (
        <div className="surface-panel rounded-3xl p-6 sm:p-8 space-y-6 border border-white/[0.08] animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-amber-400 stroke-[2.5]" />
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Gym Profile & Direct Payment UPI
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Your UPI ID is used to generate live dynamic QR codes on all invoices and billing screens.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="btn-cyber flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold shadow-[0_0_20px_-3px_rgba(16,185,129,0.4)] disabled:opacity-50 self-start sm:self-auto cursor-pointer"
            >
              <Save className="w-4 h-4 stroke-[2.75]" />
              <span>{savingProfile ? 'Saving...' : '💾 Save Profile & UPI'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Form */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Gym Name</label>
                <input
                  type="text"
                  value={gymName}
                  onChange={(e) => setGymName(e.target.value)}
                  className="w-full bg-[#111726] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Owner's UPI ID (For Direct Payments)
                </label>
                <input
                  type="text"
                  placeholder="e.g. gymname@upi or 9876543210@paytm"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full bg-[#111726] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#111726] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Official Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#111726] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-semibold mb-1">Gym Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-[#111726] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Right: Live Generated QR Preview */}
            <div className="p-5 rounded-2xl bg-[#111726] border border-white/[0.08] flex flex-col items-center justify-center text-center space-y-3">
              <div className="p-3 bg-white rounded-2xl shadow-xl">
                <img src={upiQrPreview} alt="Live UPI QR" className="w-32 h-32 object-contain" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Live UPI QR Code Preview</div>
                <div className="text-[11px] text-amber-400 font-mono mt-0.5">{upiId || 'irongym@upi'}</div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Customers scan this via PhonePe, GPay, or Paytm with 0% transaction fee.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUTOMATED 7, 3, 1-DAY ALERTS */}
      {activeTab === 'alerts' && (
        <div className="surface-panel rounded-3xl p-6 sm:p-8 space-y-6 border border-white/[0.08] animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-cyan-400 stroke-[2.5]" />
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Automated Expiry Alert Engine (8:00 AM Cron)
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Configure which alerts are triggered daily to members' WhatsApp and Email.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={handleTriggerCronNow}
                disabled={triggeringCron}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold text-xs shadow-[0_0_15px_-3px_rgba(245,158,11,0.4)] disabled:opacity-50 cursor-pointer transition-all"
                title="Immediately run daily 8:00 AM scan and send alerts to members whose plans are expiring in 7, 3, or 1 days"
              >
                <span>{triggeringCron ? 'Scanning & Sending...' : '⚡ Run 8:00 AM Cron Now'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAlerts}
                disabled={savingAlerts}
                className="btn-cyber flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold shadow-[0_0_20px_-3px_rgba(16,185,129,0.4)] disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4 stroke-[2.75]" />
                <span>{savingAlerts ? 'Saving...' : '💾 Save Alerts'}</span>
              </button>
            </div>
          </div>

          {cronResult && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between ${
                cronResult.startsWith('🚀')
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
              }`}
            >
              <span>{cronResult}</span>
              <button onClick={() => setCronResult(null)} className="text-[10px] underline ml-2 cursor-pointer">
                Dismiss
              </button>
            </div>
          )}

          {/* Hands-Free WhatsApp Bot Status & QR Link Card */}
          <div className="surface-card p-5 sm:p-6 rounded-2xl border border-emerald-500/25 bg-gradient-to-r from-emerald-950/25 via-[#0b1324] to-[#070d1a] space-y-4 shadow-[0_0_20px_-5px_rgba(16,185,129,0.15)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xl flex-shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  🤖
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-extrabold text-white text-sm sm:text-base tracking-tight">
                      Hands-Free WhatsApp Bot (Baileys Engine)
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1.5 ${
                        botStatus === 'CONNECTED'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                          : botStatus === 'WAITING_SCAN'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse'
                          : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${botStatus === 'CONNECTED' ? 'bg-emerald-400 animate-ping' : botStatus === 'WAITING_SCAN' ? 'bg-amber-400' : 'bg-rose-400'}`}></span>
                      {botStatus === 'CONNECTED'
                        ? '🟢 WhatsApp Connected & Active'
                        : botStatus === 'WAITING_SCAN'
                        ? '🟡 Scan QR Code to Connect'
                        : '⚪ Bot Offline (Starting...)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {botStatus === 'CONNECTED'
                      ? 'Aapka WhatsApp successfully authenticated hai! Har subah 8:00 AM par automated expiry reminders apne aap send honge.'
                      : 'Gym phone se ek baar WhatsApp QR scan karein — connect hone ke baad bina kisi click ke messages automatically send honge.'}
                  </p>
                </div>
              </div>

              {/* Action Buttons: Logout / Switch / QR / Refresh */}
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                {botStatus === 'CONNECTED' ? (
                  <>
                    <button
                      type="button"
                      onClick={handleDisconnectWhatsApp}
                      disabled={unlinking}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all shadow-[0_0_12px_rgba(244,63,94,0.15)] cursor-pointer disabled:opacity-50"
                      title="Disconnect current WhatsApp to connect another number"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{unlinking ? 'Unlinking...' : 'Logout / Change Number'}</span>
                    </button>
                    <a
                      href="http://localhost:4000/qr"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/[0.08] text-xs font-semibold transition-colors"
                      title="View Bot Dashboard Screen"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Bot Screen</span>
                    </a>
                  </>
                ) : (
                  <>
                    <a
                      href="http://localhost:4000/qr"
                      target="_blank"
                      rel="noreferrer"
                      className="btn-cyber flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black shadow-[0_0_15px_-3px_rgba(16,185,129,0.35)] cursor-pointer"
                    >
                      <Smartphone className="w-4 h-4 stroke-[2.75]" />
                      <span>📲 Scan WhatsApp QR</span>
                    </a>
                    <button
                      type="button"
                      onClick={handleDisconnectWhatsApp}
                      disabled={unlinking}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold cursor-pointer"
                      title="Force Clear Old Session"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={checkBotStatus}
                  disabled={botChecking}
                  className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/[0.08] text-xs font-semibold cursor-pointer transition-colors"
                  title="Refresh bot status"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${botChecking ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* In-page live QR Code preview when waiting for scan */}
            {botStatus === 'WAITING_SCAN' && botQrCode && (
              <div className="pt-3 border-t border-white/[0.08] flex flex-col items-center justify-center p-4 bg-[#050811]/70 rounded-2xl border border-emerald-500/20">
                <div className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  <span>Scan this QR with your Gym WhatsApp:</span>
                </div>
                <div className="bg-white p-3 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.25)]">
                  <img src={botQrCode} alt="WhatsApp Login QR" className="w-48 h-48 block rounded-lg" />
                </div>
                <p className="text-[11px] text-slate-400 mt-2 text-center">
                  WhatsApp &gt; Linked Devices &gt; Link a Device. Connect hone par yeh screen apne aap green ho jayegi.
                </p>
              </div>
            )}

            <div className="pt-3 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-slate-400">
              <div className="flex items-start gap-2">
                <span className="font-bold text-emerald-400 font-mono">1.</span>
                <span>Phone mein WhatsApp open karein aur <strong>Linked Devices</strong> kholein.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-emerald-400 font-mono">2.</span>
                <span><strong>Link a Device</strong> dabakar QR scan karein. Kisi aur number se connect karne ke liye <strong>"Logout / Change Number"</strong> dabayein.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-emerald-400 font-mono">3.</span>
                <span>Scan hote hi bot permanently connect ho jayega aur bina click kare messages bhejega.</span>
              </div>
            </div>

            {/* Live Test WhatsApp Delivery Box */}
            <div className="pt-3 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/[0.02] p-3.5 rounded-xl border border-white/[0.05]">
              <div className="w-full sm:w-auto">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>🧪 Test Live WhatsApp Delivery</span>
                  <span className="text-[10px] text-emerald-400 font-normal">(Instant test message to your phone)</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Apna mobile number daal kar button dabayein aur dekhein live message aata hai ya nahi.
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="e.g. 9811122334"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="bg-[#050811] border border-white/[0.12] rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500 w-full sm:w-44"
                />
                <button
                  type="button"
                  onClick={handleSendTestWhatsApp}
                  disabled={testSending || !testPhone}
                  className="btn-cyber flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)] disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{testSending ? 'Sending...' : 'Send Test'}</span>
                </button>
              </div>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-center justify-between ${
                  testResult.startsWith('✅')
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                }`}
              >
                <span>{testResult}</span>
                <button onClick={() => setTestResult(null)} className="text-[10px] underline ml-2 cursor-pointer">
                  Dismiss
                </button>
              </div>
            )}
          </div>

          {/* Automated Email Alert Engine Card */}
          <div className="surface-card p-5 sm:p-6 rounded-2xl border border-cyan-500/25 bg-gradient-to-r from-cyan-950/25 via-[#0b1324] to-[#070d1a] space-y-4 shadow-[0_0_20px_-5px_rgba(6,182,212,0.15)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-xl flex-shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                  <Mail className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-extrabold text-white text-sm sm:text-base tracking-tight">
                      Automated Email Alert Engine (Gmail / Resend)
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1.5 ${
                        emailStatus === 'CONNECTED'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${emailStatus === 'CONNECTED' ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></span>
                      {emailStatus === 'CONNECTED'
                        ? `🟢 Email Engine Connected (${emailProvider})`
                        : '⚪ Not Connected (Setup to Activate)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {emailStatus === 'CONNECTED'
                      ? `Active sender: ${emailSenderLabel || emailUser || 'Gym Official Email'}. Members ko automated receipts & expiry emails send ho rahe hain.`
                      : 'Gym Gmail ya Free Resend account link karein — connect hote hi live active ho jayega!'}
                  </p>
                </div>
              </div>

              {/* Action Buttons: Logout / Unlink / Refresh */}
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                {emailStatus === 'CONNECTED' ? (
                  <button
                    type="button"
                    onClick={handleDisconnectEmail}
                    disabled={unlinkingEmail}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all shadow-[0_0_12px_rgba(244,63,94,0.15)] cursor-pointer disabled:opacity-50"
                    title="Disconnect current email to link a different one"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{unlinkingEmail ? 'Unlinking...' : 'Logout / Change Email'}</span>
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={checkEmailStatus}
                  disabled={emailChecking}
                  className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/[0.08] text-xs font-semibold cursor-pointer transition-colors"
                  title="Refresh Email engine status"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${emailChecking ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* If NOT CONNECTED: Show Setup Form */}
            {emailStatus === 'DISCONNECTED' && (
              <div className="pt-3 border-t border-white/[0.08] p-4 bg-[#050811]/70 rounded-2xl border border-cyan-500/20 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Key className="w-4 h-4 text-cyan-400" />
                      <span>Email Provider Connect Karein (1-Click Setup):</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Neeche diye dono options mein se koi ek select karein aur credentials enter karein.
                    </div>
                  </div>

                  {/* Provider Tabs */}
                  <div className="flex items-center p-1 bg-[#111726] rounded-xl border border-white/[0.08] self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setEmailSetupTab('GMAIL')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        emailSetupTab === 'GMAIL'
                          ? 'bg-cyan-500 text-slate-950 shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      ⚡ Gmail (Recommended)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmailSetupTab('RESEND')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        emailSetupTab === 'RESEND'
                          ? 'bg-cyan-500 text-slate-950 shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🚀 Resend API
                    </button>
                  </div>
                </div>

                {/* Option 1: Gmail Form */}
                {emailSetupTab === 'GMAIL' ? (
                  <form onSubmit={handleConnectEmail} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Gym Gmail Address
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. kjpfitness@gmail.com"
                          value={setupGmailUser}
                          onChange={(e) => setSetupGmailUser(e.target.value)}
                          className="w-full bg-[#111726] border border-white/[0.12] rounded-xl px-3.5 py-2 text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                          <span>Google App Password (16 characters)</span>
                          <a
                            href="https://myaccount.google.com/apppasswords"
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-cyan-400 underline hover:text-cyan-300"
                          >
                            Generate App Password ↗
                          </a>
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="xxxx xxxx xxxx xxxx"
                          value={setupGmailPassword}
                          onChange={(e) => setSetupGmailPassword(e.target.value)}
                          className="w-full bg-[#111726] border border-white/[0.12] rounded-xl px-3.5 py-2 text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                      <p className="text-[11px] text-slate-400">
                        💡 <strong>Guide:</strong> Google Account ➔ Security ➔ 2-Step Verification ➔ <strong>App Passwords</strong> mein jaakar "Gym" naam daalein aur 16 letters ka password copy karein.
                      </p>
                      <button
                        type="submit"
                        disabled={connectingEmail || !setupGmailUser || !setupGmailPassword}
                        className="btn-tactile px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-slate-950 font-extrabold text-xs whitespace-nowrap shadow-[0_0_20px_-3px_rgba(6,182,212,0.4)] disabled:opacity-50 cursor-pointer self-end sm:self-auto"
                      >
                        {connectingEmail ? 'Verifying & Connecting...' : '🔗 Connect & Activate Gmail Engine'}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Option 2: Resend API Form */
                  <form onSubmit={handleConnectEmail} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                          <span>Resend API Key</span>
                          <a
                            href="https://resend.com/api-keys"
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-cyan-400 underline hover:text-cyan-300"
                          >
                            Get Free Key ↗
                          </a>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="re_xxxxxxxxxxxxxx"
                          value={setupResendKey}
                          onChange={(e) => setSetupResendKey(e.target.value)}
                          className="w-full bg-[#111726] border border-white/[0.12] rounded-xl px-3.5 py-2 text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Sender Address (From)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Gym Alerts <onboarding@resend.dev>"
                          value={setupResendFrom}
                          onChange={(e) => setSetupResendFrom(e.target.value)}
                          className="w-full bg-[#111726] border border-white/[0.12] rounded-xl px-3.5 py-2 text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                      <p className="text-[11px] text-slate-400">
                        💡 Resend par bina credit card 3,000 emails/month bilkul free milti hain.
                      </p>
                      <button
                        type="submit"
                        disabled={connectingEmail || !setupResendKey}
                        className="btn-tactile px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-slate-950 font-extrabold text-xs whitespace-nowrap shadow-[0_0_20px_-3px_rgba(6,182,212,0.4)] disabled:opacity-50 cursor-pointer self-end sm:self-auto"
                      >
                        {connectingEmail ? 'Connecting...' : '🔗 Connect & Activate Resend Engine'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Quick Change Gym Official Email Row */}
            <div className="pt-3 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/[0.02] p-3.5 rounded-xl border border-white/[0.05]">
              <div className="w-full sm:w-auto">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>🏢 Gym Official Email (Receipt Header)</span>
                  <span className="text-[10px] text-cyan-400 font-normal">(Receipts & notices par display hone wala email)</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Apne gym ka customer support email yahan se kabhi bhi update karein.
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="email"
                  placeholder="e.g. billing@yourgym.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#050811] border border-white/[0.12] rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500 w-full sm:w-56"
                />
                <button
                  type="button"
                  onClick={handleSaveGymEmail}
                  disabled={savingEmailOnly || !email}
                  className="btn-tactile px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs whitespace-nowrap shadow-[0_0_15px_-3px_rgba(6,182,212,0.35)] disabled:opacity-50 cursor-pointer"
                >
                  <span>{savingEmailOnly ? 'Saving...' : '💾 Save Email'}</span>
                </button>
              </div>
            </div>

            {/* Live Test Email Delivery Box */}
            <div className="pt-3 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/[0.02] p-3.5 rounded-xl border border-white/[0.05]">
              <div className="w-full sm:w-auto">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>🧪 Test Live Email Delivery</span>
                  <span className="text-[10px] text-cyan-400 font-normal">(Instant test alert email to any inbox)</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Apna email daal kar check karein automated HTML notice kaise dikhta hai.
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="email"
                  placeholder="e.g. yourname@gmail.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="bg-[#050811] border border-white/[0.12] rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500 w-full sm:w-56"
                />
                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={testEmailSending || !testEmail}
                  className="btn-tactile flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs whitespace-nowrap shadow-[0_0_15px_-3px_rgba(6,182,212,0.35)] disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{testEmailSending ? 'Sending...' : 'Send Test Email'}</span>
                </button>
              </div>
            </div>

            {testEmailResult && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-center justify-between ${
                  testEmailResult.startsWith('✅')
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                }`}
              >
                <span>{testEmailResult}</span>
                <button onClick={() => setTestEmailResult(null)} className="text-[10px] underline ml-2 cursor-pointer">
                  Dismiss
                </button>
              </div>
            )}

            <div className="pt-3 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-slate-400">
              <div className="flex items-start gap-2">
                <span className="font-bold text-cyan-400 font-mono">1.</span>
                <span>Member admission/edit ke waqt member ka <strong>Email Address</strong> zaroor record karein.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-cyan-400 font-mono">2.</span>
                <span>Daily 8:00 AM Cron WhatsApp ke sath-sath Member ke email par bhi branded notice send karega.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-cyan-400 font-mono">3.</span>
                <span>Kisi aur email se bhejane ke liye upar diye <strong>"Logout / Change Email"</strong> par click karke naya email link karein.</span>
              </div>
            </div>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Stage 1 */}
            <div className="p-4 rounded-2xl bg-[#111726] border border-white/[0.06] flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  <span>Stage 1: 7-Day Advance Alert</span>
                </div>
                <div className="text-slate-400 text-xs mt-0.5">
                  Sends friendly heads-up on WhatsApp & Email 7 days before expiry to plan renewal.
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={alertDay7}
                onClick={() => setAlertDay7(!alertDay7)}
                className={`w-12 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                  alertDay7 ? 'bg-cyan-500' : 'bg-white/10'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                    alertDay7 ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Stage 2 */}
            <div className="p-4 rounded-2xl bg-[#111726] border border-white/[0.06] flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>Stage 2: 3-Day Warning Alert</span>
                </div>
                <div className="text-slate-400 text-xs mt-0.5">
                  Sends action reminder with direct UPI payment details sent 3 days before expiry.
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={alertDay3}
                onClick={() => setAlertDay3(!alertDay3)}
                className={`w-12 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                  alertDay3 ? 'bg-amber-500' : 'bg-white/10'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                    alertDay3 ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Stage 3 */}
            <div className="p-4 rounded-2xl bg-[#111726] border border-white/[0.06] flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span>Stage 3: 1-Day Final Notice</span>
                </div>
                <div className="text-slate-400 text-xs mt-0.5">
                  Urgent notice sent 1 day before gym workout access terminates.
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={alertDay1}
                onClick={() => setAlertDay1(!alertDay1)}
                className={`w-12 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                  alertDay1 ? 'bg-rose-500' : 'bg-white/10'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                    alertDay1 ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Stage 4: Post-Expiry Overdue Alerts (Every 2 Days) */}
            <div className="p-4 rounded-2xl bg-[#111726] border border-red-500/20 bg-gradient-to-r from-red-950/15 via-[#111726] to-[#111726] flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <span>Stage 4: Post-Expiry Overdue Alerts (Har 2 Din Mein)</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/25">
                    Day +2, +4, +6, +8, +10
                  </span>
                </div>
                <div className="text-slate-400 text-xs mt-0.5">
                  Expiry ke baad jab tak payment nahi aati, har 2 din mein automated reminder bhejta hai. (Agar kisi ne gym chhod diya/off kiya ho, toh member ko <strong>PAUSED</strong> kar dein — messages turant stop ho jayenge).
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={alertOverdue2Days}
                onClick={() => setAlertOverdue2Days(!alertOverdue2Days)}
                className={`w-12 h-6 rounded-full transition-colors p-0.5 flex items-center ml-3 ${
                  alertOverdue2Days ? 'bg-red-500' : 'bg-white/10'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                    alertOverdue2Days ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
