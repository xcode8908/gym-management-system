/**
 * KJP FITNESS CLUB, KUSUPUR - GYM MANAGEMENT SYSTEM (CLIENT LOGIC)
 * Lifetime Free Architecture: Supabase DB Ready + LocalStorage Cache + n8n Webhook
 */

// ==========================================
// 1. Initial State & Configuration
// ==========================================
const CONFIG_KEY = 'kjp_gym_config';
const MEMBERS_KEY = 'kjp_gym_members';
const PAYMENTS_KEY = 'kjp_gym_payments';

const defaultConfig = {
    gymName: "KJP Fitness Club",
    location: "Kusupur, Odisha",
    admissionFee: 1000,
    monthlyFee: 400,
    upiId: "kjpfitness@upi",
    timings: "Morning: 5:30 AM - 10:00 AM | Evening: 4:30 PM - 9:30 PM",
    n8nWebhookUrl: "https://kjp-fitness-n8n.onrender.com/webhook/kjp-events",
    telegramOwnerChatId: "1945876839",
    geminiApiKey: ""
};

const SUPABASE_CONFIG = {
    url: "https://kgbglbdrvadpitrvvgpc.supabase.co",
    key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnYmdsYmRydmFkcGl0cnZ2Z3BjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5OTU4ODAsImV4cCI6MjEwODU3MTg4MH0.BIGYowYYujxSKj-Wx08irBWCya14Q1Z9skwcZyzyweo"
};

// Seed sample members for demo / first launch if empty
const sampleMembers = [
    {
        id: "m_1",
        member_id: "KJP-101",
        name: "Bikram Sahoo",
        phone: "9876543210",
        emergency_contact: "9123456780",
        blood_group: "O+",
        admission_date: "2026-09-01",
        admission_fee: 1000,
        monthly_fee: 400,
        due_date: formatDateOffset(4), // 4 days remaining (Due Soon)
        status: "ACTIVE",
        pause_days_left: 0,
        pause_date: null,
        photo_url: "",
        notes: "Chest & Triceps focus"
    },
    {
        id: "m_2",
        member_id: "KJP-102",
        name: "Rahul Mohanty",
        phone: "9812345678",
        emergency_contact: "",
        blood_group: "B+",
        admission_date: "2026-10-15",
        admission_fee: 1000,
        monthly_fee: 400,
        due_date: formatDateOffset(20), // 20 days remaining (Safe)
        status: "ACTIVE",
        pause_days_left: 0,
        pause_date: null,
        photo_url: "",
        notes: "Morning batch"
    },
    {
        id: "m_3",
        member_id: "KJP-103",
        name: "Rajesh Jena",
        phone: "9778899001",
        emergency_contact: "",
        blood_group: "A+",
        admission_date: "2026-08-10",
        admission_fee: 1000,
        monthly_fee: 400,
        due_date: formatDateOffset(-2), // 2 days overdue!
        status: "DUE",
        pause_days_left: 0,
        pause_date: null,
        photo_url: "",
        notes: "Fee reminder pending"
    },
    {
        id: "m_4",
        member_id: "KJP-104",
        name: "Deepak Patra",
        phone: "9937123456",
        emergency_contact: "",
        blood_group: "AB+",
        admission_date: "2026-07-20",
        admission_fee: 1000,
        monthly_fee: 400,
        due_date: formatDateOffset(15),
        status: "PAUSED",
        pause_days_left: 12, // 12 days preserved during break
        pause_date: "2026-10-20",
        photo_url: "",
        notes: "Paused for college exam (15 days)"
    }
];

let appConfig = JSON.parse(localStorage.getItem(CONFIG_KEY)) || defaultConfig;
if (!appConfig.n8nWebhookUrl) appConfig.n8nWebhookUrl = defaultConfig.n8nWebhookUrl;
if (!appConfig.geminiApiKey) appConfig.geminiApiKey = defaultConfig.geminiApiKey;
localStorage.setItem(CONFIG_KEY, JSON.stringify(appConfig));
let members = JSON.parse(localStorage.getItem(MEMBERS_KEY)) || sampleMembers;
let payments = JSON.parse(localStorage.getItem(PAYMENTS_KEY)) || [
    {
        id: "pay_1",
        receipt_no: "REC-2026-0001",
        member_id: "KJP-101",
        member_name: "Bikram Sahoo",
        amount: 400,
        payment_type: "MONTHLY_RENEWAL",
        payment_mode: "CASH",
        date: getTodayString()
    },
    {
        id: "pay_2",
        receipt_no: "REC-2026-0002",
        member_id: "KJP-102",
        member_name: "Rahul Mohanty",
        amount: 1400,
        payment_type: "ADMISSION_WITH_MONTHLY",
        payment_mode: "UPI",
        date: getTodayString()
    }
];

let currentFilter = 'ALL';
let currentSearchQuery = '';

// ==========================================
// 2. DOM Elements Selection
// ==========================================
const membersGrid = document.getElementById('membersGrid');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const filterButtons = document.querySelectorAll('.tab-btn');

// Header & Stats Elements
const headerTodayCash = document.getElementById('headerTodayCash');
const headerTodayUpi = document.getElementById('headerTodayUpi');
const statTotalMembers = document.getElementById('statTotalMembers');
const statActiveMembers = document.getElementById('statActiveMembers');
const statDueMembers = document.getElementById('statDueMembers');
const statPausedMembers = document.getElementById('statPausedMembers');

const countAll = document.getElementById('countAll');
const countActive = document.getElementById('countActive');
const countDue = document.getElementById('countDue');
const countPaused = document.getElementById('countPaused');
const countInactive = document.getElementById('countInactive');

// Modals
const admissionModal = document.getElementById('admissionModal');
const collectFeeModal = document.getElementById('collectFeeModal');
const pauseModal = document.getElementById('pauseModal');
const editMemberModal = document.getElementById('editMemberModal');
const settingsModal = document.getElementById('settingsModal');

// Forms
const admissionForm = document.getElementById('admissionForm');
const collectFeeForm = document.getElementById('collectFeeForm');
const pauseForm = document.getElementById('pauseForm');
const editMemberForm = document.getElementById('editMemberForm');

// ==========================================
// 3. Helper Date Functions
// ==========================================
function getTodayString() {
    const d = new Date();
    return d.toISOString().split('T')[0];
}

function formatDateOffset(daysOffset) {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
}

function addDaysToDate(dateString, days) {
    const d = new Date(dateString);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
}

function calculateDaysDifference(targetDateString) {
    const today = new Date(getTodayString());
    const target = new Date(targetDateString);
    const diffTime = target - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function formatDisplayDate(dateString) {
    if (!dateString) return '-';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${parts[2]} ${months[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
}

// ==========================================
// 4. Persistence & Sync
// ==========================================
// Client-side image compression for ultra-fast mobile upload & low storage
function compressImageFile(file, maxWidth = 1000, quality = 0.75) {
    return new Promise((resolve) => {
        if (!file || !file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function saveLocalData() {
    try {
        localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
        localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
        localStorage.setItem(CONFIG_KEY, JSON.stringify(appConfig));
    } catch (e) {
        console.warn('LocalStorage quota limit reached, relying on Supabase Cloud:', e);
    }
    updateStatsAndCounters();
}

async function syncMemberToSupabase(member) {
    try {
        await fetch(`${SUPABASE_CONFIG.url}/rest/v1/members?on_conflict=member_id`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_CONFIG.key,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify({
                member_id: member.member_id,
                name: member.name,
                phone: member.phone,
                admission_date: member.admission_date,
                admission_fee: member.admission_fee,
                monthly_fee: member.monthly_fee,
                due_date: member.due_date,
                status: member.status,
                emergency_contact: member.emergency_contact || null,
                blood_group: member.blood_group || null,
                photo_url: member.photo_url || null,
                id_proof_url: member.id_proof_url || null,
                notes: member.notes || null
            })
        });
    } catch (e) {
        console.warn('Supabase member sync notice:', e);
    }
}

async function syncPaymentToSupabase(payment) {
    try {
        await fetch(`${SUPABASE_CONFIG.url}/rest/v1/payments`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_CONFIG.key,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                receipt_no: payment.receipt_no,
                member_id: payment.member_id,
                member_name: payment.member_name,
                amount: payment.amount,
                payment_type: payment.payment_type,
                payment_mode: payment.payment_mode,
                transaction_id: payment.transaction_id || null,
                period_start: payment.period_start || null,
                period_end: payment.period_end || null,
                date: payment.date || getTodayString()
            })
        });
    } catch (e) {
        console.warn('Supabase payment sync notice:', e);
    }
}

async function loadFromSupabase() {
    try {
        // 1. Load Members
        const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/members?select=*&order=created_at.desc`, {
            headers: { 'apikey': SUPABASE_CONFIG.key }
        });
        if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) {
                members = data.map(m => ({
                    id: m.id,
                    member_id: m.member_id,
                    name: m.name,
                    phone: m.phone,
                    emergency_contact: m.emergency_contact || '',
                    blood_group: m.blood_group || 'O+',
                    admission_date: m.admission_date,
                    admission_fee: m.admission_fee,
                    monthly_fee: m.monthly_fee,
                    due_date: m.due_date,
                    status: m.status,
                    pause_days_left: m.pause_days_left || 0,
                    pause_date: m.pause_date,
                    photo_url: m.photo_url || '',
                    id_proof_url: m.id_proof_url || '',
                    notes: m.notes || ''
                }));
                saveLocalData();
                renderMembers();
            }
        }

        // 2. Load Payments
        const payRes = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/payments?select=*&order=created_at.desc`, {
            headers: { 'apikey': SUPABASE_CONFIG.key }
        });
        if (payRes.ok) {
            const payData = await payRes.json();
            if (payData && payData.length > 0) {
                payments = payData.map(p => ({
                    id: p.id,
                    receipt_no: p.receipt_no,
                    member_id: p.member_id,
                    member_name: p.member_name,
                    amount: Number(p.amount),
                    payment_type: p.payment_type,
                    payment_mode: p.payment_mode,
                    transaction_id: p.transaction_id || '',
                    date: p.date || (p.created_at ? p.created_at.split('T')[0] : getTodayString())
                }));
                saveLocalData();
                renderMembers();
            }
        }
    } catch (e) {
        console.warn('Could not load from Supabase:', e);
    }
}

// Export all members to CSV / Excel Backup
function exportMembersToCSV() {
    if (!members || members.length === 0) {
        showToast('No member data available to export', 'error');
        return;
    }

    const headers = ['Member ID', 'Full Name', 'Phone', 'Blood Group', 'Admission Date', 'Monthly Fee', 'Due Date', 'Status', 'Emergency Contact', 'Notes'];
    const rows = members.map(m => [
        `"${m.member_id}"`,
        `"${m.name}"`,
        `"${m.phone}"`,
        `"${m.blood_group || ''}"`,
        `"${m.admission_date}"`,
        `"${m.monthly_fee}"`,
        `"${m.due_date}"`,
        `"${m.status}"`,
        `"${m.emergency_contact || ''}"`,
        `"${(m.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `KJP_Fitness_Club_Members_${getTodayString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported members backup to Excel/CSV!');
}

// ==========================================
// 5. App Initialization
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    updateStatsAndCounters();
    renderMembers();
    loadFromSupabase();
});

// ==========================================
// 6. Event Listeners Setup
// ==========================================
function initEventListeners() {
    // Search input
    searchInput.addEventListener('input', (e) => {
        currentSearchQuery = e.target.value.trim().toLowerCase();
        clearSearchBtn.style.display = currentSearchQuery ? 'block' : 'none';
        renderMembers();
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        currentSearchQuery = '';
        clearSearchBtn.style.display = 'none';
        renderMembers();
    });

    // Filter tabs
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            renderMembers();
        });
    });

    // Modal Close Buttons
    document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-close');
            closeModal(modalId);
        });
    });

    // Close on background click
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Open Modals
    document.getElementById('btnOpenNewAdmission').addEventListener('click', () => {
        openAdmissionModal();
    });

    document.getElementById('btnOpenSettings').addEventListener('click', () => {
        openSettingsModal();
    });

    document.getElementById('btnDailyTelegram').addEventListener('click', () => {
        generateDailyTelegramReport();
    });

    // Admission photo & document upload tracking
    let admissionPhotoBase64 = '';
    let admissionIdProofBase64 = '';
    let admissionIdProofName = '';

    const photoInput = document.getElementById('memberPhotoInput');
    if (photoInput) {
        photoInput.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (file) {
                const dataUrl = await compressImageFile(file, 800, 0.75);
                admissionPhotoBase64 = dataUrl;
                const preview = document.getElementById('photoPreview');
                preview.src = dataUrl;
                preview.style.display = 'block';
                document.querySelector('#photoUploadBox span').style.display = 'none';
                document.querySelector('#photoUploadBox i').style.display = 'none';
            }
        });
    }

    const idProofInput = document.getElementById('memberIdProofInput');
    if (idProofInput) {
        idProofInput.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (file) {
                admissionIdProofName = file.name;
                const dataUrl = await compressImageFile(file, 1200, 0.8);
                admissionIdProofBase64 = dataUrl;
                const fileNameEl = document.getElementById('idProofFileName');
                if (fileNameEl) {
                    fileNameEl.textContent = `✓ ${file.name}`;
                    fileNameEl.style.display = 'block';
                }
                const span = document.querySelector('#idProofUploadBox span');
                if (span) span.textContent = file.name;
            }
        });
    }

    // Document Modal Tabs
    document.querySelectorAll('.doc-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-doctab');
            switchDocTab(tabId);
        });
    });

    // Forms Submissions
    admissionForm.addEventListener('submit', (e) => handleAdmissionSubmit(e, admissionPhotoBase64, admissionIdProofBase64, admissionIdProofName));
    collectFeeForm.addEventListener('submit', handleCollectFeeSubmit);
    pauseForm.addEventListener('submit', handlePauseSubmit);
    editMemberForm.addEventListener('submit', handleEditMemberSubmit);
    document.getElementById('btnSaveSettings').addEventListener('click', handleSaveSettings);

    // Dynamic fee billing calculations
    document.getElementById('billMonthsSelect').addEventListener('change', updateCollectFeeCalculation);
    document.getElementById('billAmountInput').addEventListener('input', updateCollectFeeCalculation);

    // Payment mode toggle for UPI txn id in collect fee
    document.querySelectorAll('input[name="billPaymentMode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            document.querySelectorAll('input[name="billPaymentMode"]').forEach(r => {
                r.closest('.radio-card').classList.toggle('selected', r.checked);
            });
            document.getElementById('upiTxnGroup').style.display = (e.target.value === 'UPI') ? 'block' : 'none';
        });
    });

    // Payment mode toggle for admission
    document.querySelectorAll('input[name="admissionPaymentMode"]').forEach(radio => {
        radio.addEventListener('change', () => {
            document.querySelectorAll('input[name="admissionPaymentMode"]').forEach(r => {
                r.closest('.radio-card').classList.toggle('selected', r.checked);
            });
        });
    });
}

// ==========================================
// 7. Render Members List
// ==========================================
function renderMembers() {
    membersGrid.innerHTML = '';

    // Filter members
    const filtered = members.filter(m => {
        // Auto update status based on due date if not paused
        const daysLeft = calculateDaysDifference(m.due_date);
        let actualStatus = m.status;
        if (m.status !== 'PAUSED') {
            if (daysLeft < 0) {
                actualStatus = daysLeft < -5 ? 'INACTIVE' : 'DUE';
            } else if (daysLeft <= 3) {
                actualStatus = 'DUE';
            } else {
                actualStatus = 'ACTIVE';
            }
        }
        m.status = actualStatus;

        // Apply Tab Filter
        if (currentFilter !== 'ALL' && m.status !== currentFilter) {
            return false;
        }

        // Apply Search Query
        if (currentSearchQuery) {
            const nameMatch = m.name.toLowerCase().includes(currentSearchQuery);
            const phoneMatch = m.phone.includes(currentSearchQuery);
            const idMatch = m.member_id.toLowerCase().includes(currentSearchQuery);
            return nameMatch || phoneMatch || idMatch;
        }

        return true;
    });

    if (filtered.length === 0) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        filtered.forEach(member => {
            const card = createMemberCardElement(member);
            membersGrid.appendChild(card);
        });
    }

    updateStatsAndCounters();
}

function createMemberCardElement(m) {
    const card = document.createElement('div');
    card.className = `member-card status-${m.status.toLowerCase()}`;

    const daysLeft = calculateDaysDifference(m.due_date);
    let countdownBadge = '';

    if (m.status === 'PAUSED') {
        countdownBadge = `<span class="countdown-tag countdown-orange">Paused (${m.pause_days_left}d left)</span>`;
    } else if (daysLeft > 7) {
        countdownBadge = `<span class="countdown-tag countdown-green">${daysLeft} days left</span>`;
    } else if (daysLeft >= 0) {
        countdownBadge = `<span class="countdown-tag countdown-orange">${daysLeft === 0 ? 'Due Today' : daysLeft + ' days left'}</span>`;
    } else {
        countdownBadge = `<span class="countdown-tag countdown-red">${Math.abs(daysLeft)} days overdue</span>`;
    }

    const avatarHtml = m.photo_url 
        ? `<img src="${m.photo_url}" class="member-avatar" alt="${m.name}" onclick="openMemberDocsModal('${m.id}')" title="Click to View Documents & ID Pass" style="cursor: pointer;">` 
        : `<div class="member-avatar" onclick="openMemberDocsModal('${m.id}')" title="Click to View Documents & ID Pass" style="cursor: pointer;"><i class="fa-solid fa-user"></i></div>`;

    const validityPercent = Math.max(0, Math.min(100, Math.round((Math.max(0, daysLeft) / 30) * 100)));
    let progressColor = 'var(--success-green)';
    if (daysLeft < 0) progressColor = 'var(--danger-red)';
    else if (daysLeft <= 3) progressColor = 'var(--warning-orange)';
    else if (daysLeft <= 7) progressColor = 'var(--gold-light)';

    card.innerHTML = `
        <div class="card-top">
            ${avatarHtml}
            <div class="member-meta">
                <div class="id-and-group">
                    <span class="member-id-badge"><i class="fa-solid fa-shield-halved"></i> ${m.member_id}</span>
                    <span class="blood-badge">${m.blood_group || 'O+'}</span>
                </div>
                <h4 class="member-name" title="${m.name}">${m.name}</h4>
                <div class="member-phone">
                    <i class="fa-solid fa-phone"></i> +91 ${m.phone}
                </div>
            </div>
            <span class="status-badge badge-${m.status.toLowerCase()}">${m.status}</span>
        </div>

        <div class="card-validity-meter">
            <div class="meter-track">
                <div class="meter-fill" style="width: ${validityPercent}%; background: ${progressColor};"></div>
            </div>
        </div>

        <div class="card-dates-box">
            <div class="date-item">
                <span class="date-label">Renewal Date</span>
                <strong>${formatDisplayDate(m.due_date)}</strong>
            </div>
            <div class="date-item due-countdown">
                <span class="date-label">Validity</span>
                ${countdownBadge}
            </div>
        </div>

        <div class="card-actions">
            <button class="btn-collect" onclick="openCollectFeeModal('${m.id}')">
                <i class="fa-solid fa-bolt"></i> Collect ₹${m.monthly_fee}
            </button>
            <button class="btn-icon-action docs-btn" title="View & Download Documents (Aadhar / ID Card / Receipts)" onclick="openMemberDocsModal('${m.id}')">
                <i class="fa-solid fa-id-card text-gold"></i>
            </button>
            <button class="btn-icon-action" title="${m.status === 'PAUSED' ? 'Resume Membership' : 'Pause Membership'}" onclick="openPauseModal('${m.id}')">
                <i class="fa-solid ${m.status === 'PAUSED' ? 'fa-play text-green' : 'fa-pause text-blue'}"></i>
            </button>
            <button class="btn-icon-action" title="Edit Member Details" onclick="openEditMemberModal('${m.id}')">
                <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn-icon-action gemini-btn" title="✨ Gemini AI Friendly Message" onclick="sendGeminiWhatsApp('${m.id}')">
                <i class="fa-solid fa-wand-magic-sparkles text-gold"></i>
            </button>
            <button class="btn-icon-action whatsapp" title="Send WhatsApp Message" onclick="sendDirectWhatsApp('${m.id}')">
                <i class="fa-brands fa-whatsapp"></i>
            </button>
        </div>
    `;

    return card;
}

// ==========================================
// 8. Stats & Counters Update
// ==========================================
function updateStatsAndCounters() {
    let active = 0, due = 0, paused = 0, inactive = 0;

    members.forEach(m => {
        if (m.status === 'ACTIVE') active++;
        else if (m.status === 'DUE') due++;
        else if (m.status === 'PAUSED') paused++;
        else if (m.status === 'INACTIVE') inactive++;
    });

    statTotalMembers.textContent = members.length;
    statActiveMembers.textContent = active;
    statDueMembers.textContent = due;
    statPausedMembers.textContent = paused;

    countAll.textContent = members.length;
    countActive.textContent = active;
    countDue.textContent = due;
    countPaused.textContent = paused;
    countInactive.textContent = inactive;

    // Calculate Today's Cash & UPI Collections
    const today = getTodayString();
    let todayCash = 0;
    let todayUpi = 0;

    payments.forEach(p => {
        if (p.date === today) {
            if (p.payment_mode === 'CASH') todayCash += p.amount;
            else if (p.payment_mode === 'UPI') todayUpi += p.amount;
        }
    });

    headerTodayCash.textContent = `₹${todayCash.toLocaleString('en-IN')}`;
    headerTodayUpi.textContent = `₹${todayUpi.toLocaleString('en-IN')}`;

    const dueBadge = document.getElementById('dueBadgeCount');
    if (dueBadge) dueBadge.textContent = due;
}

// ==========================================
// 8.1 Due Reminders Quick Action Modal
// ==========================================
function openDueRemindersModal() {
    const listEl = document.getElementById('dueRemindersList');
    if (!listEl) return;

    const dueList = members.filter(m => {
        if (m.status === 'PAUSED') return false;
        const diff = calculateDaysDifference(m.due_date);
        return diff <= 7;
    }).sort((a, b) => calculateDaysDifference(a.due_date) - calculateDaysDifference(b.due_date));

    if (dueList.length === 0) {
        listEl.innerHTML = `
            <div style="text-align: center; padding: 30px; color: var(--text-muted);">
                <i class="fa-solid fa-circle-check" style="font-size: 3rem; color: #25D366; margin-bottom: 12px; display: block;"></i>
                <h4 style="color: var(--text-light); margin-bottom: 6px;">All Clear!</h4>
                <p>No members due in the next 7 days or overdue. Keep up the great work!</p>
            </div>
        `;
    } else {
        listEl.innerHTML = dueList.map(m => {
            const diff = calculateDaysDifference(m.due_date);
            let badgeClass = 'countdown-green';
            let label = `${diff} days left`;
            if (diff < 0) {
                badgeClass = 'countdown-red';
                label = `${Math.abs(diff)}d Overdue`;
            } else if (diff <= 3) {
                badgeClass = 'countdown-orange';
                label = diff === 0 ? 'Due Today' : `${diff}d left`;
            }

            return `
                <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 14px 18px; border-radius: 12px; gap: 12px; flex-wrap: wrap;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                            <strong style="color: var(--text-light); font-size: 1.05rem;">${m.name}</strong>
                            <span class="member-id-badge" style="font-size: 0.75rem;">${m.member_id}</span>
                            <span class="countdown-tag ${badgeClass}" style="font-size: 0.75rem; padding: 2px 8px;">${label}</span>
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text-muted);">
                            <i class="fa-solid fa-phone"></i> +91 ${m.phone} &bull; Next Due: ${formatDisplayDate(m.due_date)} &bull; Monthly: ₹${m.monthly_fee}
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-outline gemini-btn" style="padding: 8px 12px; font-size: 0.85rem;" onclick="sendGeminiWhatsApp('${m.id}')" title="Gemini AI Hinglish Message">
                            <i class="fa-solid fa-wand-magic-sparkles text-gold"></i> AI Message
                        </button>
                        <button class="btn btn-outline" style="border-color: #25D366; color: #25D366; padding: 8px 12px; font-size: 0.85rem;" onclick="sendDirectWhatsApp('${m.id}')" title="Quick WhatsApp Reminder">
                            <i class="fa-brands fa-whatsapp"></i> Quick Send
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    openModal('dueRemindersModal');
}

// ==========================================
// 9. Modals Open / Close Helpers
// ==========================================
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// ==========================================
// 10. NEW ADMISSION (1-Time Lifetime Setup)
// ==========================================
function openAdmissionModal() {
    admissionForm.reset();
    document.getElementById('photoPreview').style.display = 'none';
    const photoBoxSpan = document.querySelector('#photoUploadBox span');
    if (photoBoxSpan) {
        photoBoxSpan.style.display = 'block';
        photoBoxSpan.textContent = 'Member Photo';
    }
    const photoBoxIcon = document.querySelector('#photoUploadBox i');
    if (photoBoxIcon) photoBoxIcon.style.display = 'block';

    const idProofSpan = document.querySelector('#idProofUploadBox span');
    if (idProofSpan) idProofSpan.textContent = 'Aadhar / ID Proof';
    const idProofFileName = document.getElementById('idProofFileName');
    if (idProofFileName) {
        idProofFileName.style.display = 'none';
        idProofFileName.textContent = '';
    }

    document.getElementById('displayAdmissionFee').textContent = appConfig.admissionFee;
    document.getElementById('displayMonthlyFee').textContent = appConfig.monthlyFee;
    document.getElementById('displayTotalFee').textContent = appConfig.admissionFee;

    openModal('admissionModal');
}

async function handleAdmissionSubmit(e, photoBase64 = '', idProofBase64 = '', idProofName = '') {
    e.preventDefault();

    const name = document.getElementById('newMemberName').value.trim();
    const phone = document.getElementById('newMemberPhone').value.trim();
    const emergency = document.getElementById('newMemberEmergency').value.trim();
    const bloodGroup = document.getElementById('newMemberBloodGroup').value;
    const notes = document.getElementById('newMemberNotes').value.trim();
    const paymentMode = document.querySelector('input[name="admissionPaymentMode"]:checked').value;

    // Check duplicate phone
    if (members.some(m => m.phone === phone)) {
        showToast('Member with this phone number already exists!', 'error');
        return;
    }

    // Generate Member ID (e.g. KJP-105)
    const nextNum = 101 + members.length;
    const memberId = `KJP-${nextNum}`;

    const admissionFee = Number(appConfig.admissionFee);
    const monthlyFee = Number(appConfig.monthlyFee);
    const totalAmount = admissionFee; // Payable today: Only Admission Fee ₹1000
    const today = getTodayString();
    const dueDate = addDaysToDate(today, 30); // 1st Month due at Month End (30 Days)

    // Photo preview URL if available
    const photoPreviewSrc = document.getElementById('photoPreview').src || '';
    const finalPhoto = photoBase64 || (photoPreviewSrc.startsWith('data:') ? photoPreviewSrc : '');

    const newMember = {
        id: 'm_' + Date.now(),
        member_id: memberId,
        name: name,
        phone: phone,
        emergency_contact: emergency,
        blood_group: bloodGroup,
        admission_date: today,
        admission_fee: admissionFee,
        monthly_fee: monthlyFee,
        due_date: dueDate,
        status: 'ACTIVE',
        pause_days_left: 0,
        pause_date: null,
        photo_url: finalPhoto,
        id_proof_url: idProofBase64 || '',
        id_proof_name: idProofName || '',
        notes: notes
    };

    // Add to payments log
    const receiptNo = `REC-${new Date().getFullYear()}-${String(payments.length + 1).padStart(4, '0')}`;
    const newPayment = {
        id: 'pay_' + Date.now(),
        receipt_no: receiptNo,
        member_id: memberId,
        member_name: name,
        amount: totalAmount,
        payment_type: 'ADMISSION_FEE',
        payment_mode: paymentMode,
        date: today
    };

    members.unshift(newMember);
    payments.unshift(newPayment);
    saveLocalData();
    syncMemberToSupabase(newMember);
    syncPaymentToSupabase(newPayment);
    renderMembers();
    closeModal('admissionModal');

    showToast(`Admission Complete! Member ID: ${memberId}`);

    // Trigger n8n Webhook / Instant WhatsApp Welcome
    triggerN8nWebhook('NEW_ADMISSION', {
        member: newMember,
        payment: newPayment,
        gym: appConfig
    });

    // Also offer direct WhatsApp Welcome
    setTimeout(() => {
        sendDirectWhatsApp(newMember.id, 'WELCOME');
    }, 500);
}

// ==========================================
// 11. COLLECT MONTHLY FEE (Billing & Rollover)
// ==========================================
let activeBillingMember = null;

function openCollectFeeModal(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    activeBillingMember = member;
    document.getElementById('billMemberId').value = member.id;
    document.getElementById('billMemberSubtitle').textContent = `Member: ${member.name} (${member.member_id})`;
    document.getElementById('billAmountInput').value = member.monthly_fee;
    document.getElementById('billMonthsSelect').value = '1';

    updateCollectFeeCalculation();
    openModal('collectFeeModal');
}

function updateCollectFeeCalculation() {
    if (!activeBillingMember) return;

    const months = parseInt(document.getElementById('billMonthsSelect').value, 10);
    const daysToAdd = months * 30;
    const today = getTodayString();
    const currentExpiry = activeBillingMember.due_date;

    let newExpiryDate;
    let hintText;

    // GOLDEN RULE FOR SMART ADVANCE ROLLOVER:
    // If member pays early (currentExpiry >= today), add days to currentExpiry!
    // If member pays late after gap (currentExpiry < today), add days to today!
    if (currentExpiry >= today) {
        newExpiryDate = addDaysToDate(currentExpiry, daysToAdd);
        hintText = `🛡️ Early payment rollover active: Remaining days from ${formatDisplayDate(currentExpiry)} are preserved!`;
    } else {
        newExpiryDate = addDaysToDate(today, daysToAdd);
        hintText = `🔄 Return after gap: New ${daysToAdd}-day cycle starts fresh from today (${formatDisplayDate(today)})!`;
    }

    document.getElementById('billCurrentExpiry').textContent = formatDisplayDate(currentExpiry);
    document.getElementById('billNewCalculatedExpiry').textContent = formatDisplayDate(newExpiryDate);
    document.getElementById('billCalculationHint').innerHTML = hintText;

    // Update Amount Input automatically if user changed months
    const calculatedFee = activeBillingMember.monthly_fee * months;
    document.getElementById('billAmountInput').value = calculatedFee;
}

function handleCollectFeeSubmit(e) {
    e.preventDefault();
    if (!activeBillingMember) return;

    const amount = Number(document.getElementById('billAmountInput').value);
    const months = parseInt(document.getElementById('billMonthsSelect').value, 10);
    const daysToAdd = months * 30;
    const paymentMode = document.querySelector('input[name="billPaymentMode"]:checked').value;
    const txnId = document.getElementById('billUpiTxnId').value.trim();
    const today = getTodayString();

    const oldExpiry = activeBillingMember.due_date;
    let newExpiry;

    if (oldExpiry >= today) {
        newExpiry = addDaysToDate(oldExpiry, daysToAdd);
    } else {
        newExpiry = addDaysToDate(today, daysToAdd);
    }

    // Update Member Record
    activeBillingMember.due_date = newExpiry;
    activeBillingMember.status = 'ACTIVE';
    activeBillingMember.last_reminder_sent_date = null; // reset reminders

    // Create Payment Record
    const receiptNo = `REC-${new Date().getFullYear()}-${String(payments.length + 1).padStart(4, '0')}`;
    const paymentRecord = {
        id: 'pay_' + Date.now(),
        receipt_no: receiptNo,
        member_id: activeBillingMember.member_id,
        member_name: activeBillingMember.name,
        amount: amount,
        payment_type: 'MONTHLY_RENEWAL',
        payment_mode: paymentMode,
        transaction_id: txnId,
        date: today,
        period_start: oldExpiry,
        period_end: newExpiry
    };

    payments.unshift(paymentRecord);
    saveLocalData();
    syncMemberToSupabase(activeBillingMember);
    syncPaymentToSupabase(paymentRecord);
    renderMembers();
    closeModal('collectFeeModal');

    showToast(`₹${amount} Collected via ${paymentMode}! New Expiry: ${formatDisplayDate(newExpiry)}`);

    // Trigger n8n Webhook / Instant WhatsApp Receipt
    triggerN8nWebhook('FEE_COLLECTED', {
        member: activeBillingMember,
        payment: paymentRecord,
        gym: appConfig
    });

    // Direct WhatsApp Receipt popup
    setTimeout(() => {
        sendDirectWhatsApp(activeBillingMember.id, 'RECEIPT', paymentRecord);
    }, 400);
}

// ==========================================
// 12. PAUSE / RESUME (Membership Freeze)
// ==========================================
let activePauseMember = null;

function openPauseModal(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    activePauseMember = member;
    document.getElementById('pauseMemberId').value = member.id;
    const isPaused = member.status === 'PAUSED';
    const actionType = isPaused ? 'RESUME' : 'PAUSE';
    document.getElementById('pauseActionType').value = actionType;

    const modalTitle = document.getElementById('pauseModalTitle');
    const subtitle = document.getElementById('pauseMemberSubtitle');
    const summaryBox = document.getElementById('pauseExplanationBox');

    subtitle.textContent = `Member: ${member.name} (${member.member_id})`;

    if (isPaused) {
        modalTitle.textContent = "Resume Membership";
        const preservedDays = member.pause_days_left || 0;
        const newExpiry = addDaysToDate(getTodayString(), preservedDays);
        summaryBox.innerHTML = `
            <p><strong>Member is currently PAUSED.</strong></p>
            <p>Preserved Days Saved: <strong class="text-green">${preservedDays} days</strong></p>
            <p>Upon resuming today, new Expiry Date will be: <strong class="text-green">${formatDisplayDate(newExpiry)}</strong></p>
        `;
        document.getElementById('btnConfirmPauseResume').textContent = "Resume Now";
        document.getElementById('btnConfirmPauseResume').className = "btn btn-success";
    } else {
        modalTitle.textContent = "Pause Membership (Freeze)";
        const daysLeft = Math.max(0, calculateDaysDifference(member.due_date));
        summaryBox.innerHTML = `
            <p>Remaining days left in this month: <strong class="text-gold">${daysLeft} days</strong></p>
            <p>These <strong>${daysLeft} days will be safely frozen/saved</strong> in the database.</p>
            <p>No reminders will be sent while paused. When the member returns, they will get full ${daysLeft} days back!</p>
        `;
        document.getElementById('btnConfirmPauseResume').textContent = "Freeze / Pause Now";
        document.getElementById('btnConfirmPauseResume').className = "btn btn-primary";
    }

    openModal('pauseModal');
}

function handlePauseSubmit(e) {
    e.preventDefault();
    if (!activePauseMember) return;

    const action = document.getElementById('pauseActionType').value;
    const reason = document.getElementById('pauseReasonInput').value.trim();
    const today = getTodayString();

    if (action === 'PAUSE') {
        const daysLeft = Math.max(0, calculateDaysDifference(activePauseMember.due_date));
        activePauseMember.status = 'PAUSED';
        activePauseMember.pause_days_left = daysLeft;
        activePauseMember.pause_date = today;
        showToast(`Membership Paused! ${daysLeft} days safely frozen.`);
    } else {
        // RESUME
        const preserved = activePauseMember.pause_days_left || 0;
        activePauseMember.due_date = addDaysToDate(today, preserved);
        activePauseMember.status = 'ACTIVE';
        activePauseMember.pause_days_left = 0;
        activePauseMember.pause_date = null;
        showToast(`Membership Resumed! New Expiry: ${formatDisplayDate(activePauseMember.due_date)}`);
    }

    saveLocalData();
    renderMembers();
    closeModal('pauseModal');
}

// ==========================================
// 13. EDIT MEMBER DETAILS (Hike Fee, Phone, etc)
// ==========================================
let activeEditMember = null;

function openEditMemberModal(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    activeEditMember = member;
    document.getElementById('editMemberId').value = member.id;
    document.getElementById('editMemberSubtitle').textContent = `${member.name} (${member.member_id})`;

    document.getElementById('editMemberName').value = member.name;
    document.getElementById('editMemberPhone').value = member.phone;
    document.getElementById('editMemberMonthlyFee').value = member.monthly_fee;
    document.getElementById('editMemberStatus').value = member.status;
    document.getElementById('editMemberDueDate').value = member.due_date;
    document.getElementById('editMemberEmergency').value = member.emergency_contact || '';

    openModal('editMemberModal');
}

function handleEditMemberSubmit(e) {
    e.preventDefault();
    if (!activeEditMember) return;

    activeEditMember.name = document.getElementById('editMemberName').value.trim();
    activeEditMember.phone = document.getElementById('editMemberPhone').value.trim();
    activeEditMember.monthly_fee = Number(document.getElementById('editMemberMonthlyFee').value);
    activeEditMember.status = document.getElementById('editMemberStatus').value;
    activeEditMember.due_date = document.getElementById('editMemberDueDate').value;
    activeEditMember.emergency_contact = document.getElementById('editMemberEmergency').value.trim();

    saveLocalData();
    renderMembers();
    closeModal('editMemberModal');
    showToast(`Updated details for ${activeEditMember.name}!`);
}

// ==========================================
// 14. SETTINGS MODAL
// ==========================================
function openSettingsModal() {
    document.getElementById('cfgDefaultAdmission').value = appConfig.admissionFee;
    document.getElementById('cfgDefaultMonthly').value = appConfig.monthlyFee;
    document.getElementById('cfgUpiId').value = appConfig.upiId;
    document.getElementById('cfgTimings').value = appConfig.timings;
    document.getElementById('cfgN8nWebhookUrl').value = appConfig.n8nWebhookUrl || '';
    document.getElementById('cfgTelegramChatId').value = appConfig.telegramOwnerChatId || '';
    document.getElementById('cfgGeminiApiKey').value = appConfig.geminiApiKey || '';

    openModal('settingsModal');
}

function handleSaveSettings() {
    appConfig.admissionFee = Number(document.getElementById('cfgDefaultAdmission').value);
    appConfig.monthlyFee = Number(document.getElementById('cfgDefaultMonthly').value);
    appConfig.upiId = document.getElementById('cfgUpiId').value.trim();
    appConfig.timings = document.getElementById('cfgTimings').value.trim();
    appConfig.n8nWebhookUrl = document.getElementById('cfgN8nWebhookUrl').value.trim();
    appConfig.telegramOwnerChatId = document.getElementById('cfgTelegramChatId').value.trim();
    appConfig.geminiApiKey = document.getElementById('cfgGeminiApiKey').value.trim();

    saveLocalData();
    closeModal('settingsModal');
    showToast('Settings saved successfully!');
}

// ==========================================
// 15. GEMINI AI SMART MESSAGE GENERATOR
// ==========================================
async function sendGeminiWhatsApp(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    showToast("✨ Gemini AI drafting personalized message...", "success");

    let message = "";
    const daysLeft = calculateDaysDifference(member.due_date);

    if (appConfig.geminiApiKey) {
        try {
            const prompt = `You are the manager of KJP Fitness Club in Kusupur, Odisha. Write a short, friendly, polite, and motivational WhatsApp reminder in Hinglish for gym member "${member.name}". Their monthly fee of ₹${member.monthly_fee} is due on ${formatDisplayDate(member.due_date)} (${daysLeft} days remaining). UPI ID is ${appConfig.upiId}. Keep it warm, fitness-encouraging, under 45 words, and include gym emojis.`;
            
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${appConfig.geminiApiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            const data = await response.json();
            message = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        } catch (err) {
            console.warn("Gemini API call error, falling back to smart template:", err);
        }
    }

    // High quality AI fallback if API key is not yet set
    if (!message) {
        if (daysLeft > 3) {
            message = `Hi ${member.name} bhai! 💪 Workout consistency top class chal rahi hai aapki! Just ek quick update from KJP Fitness Club, Kusupur: Monthly fee (₹${member.monthly_fee}) ki date ${formatDisplayDate(member.due_date)} ko hai. Time par renew kar lena. See you on the floor! 🔥`;
        } else if (daysLeft >= 0) {
            message = `Namaste ${member.name} ji! 🏋️‍♂️ Kal fitness streak tutni nahi chahiye! Aapki monthly gym fee (₹${member.monthly_fee}) ki due date aa gayi hai (${formatDisplayDate(member.due_date)}). UPI: \`${appConfig.upiId}\`. Milte hain kal gym me! 💪 — KJP Fitness Club`;
        } else {
            message = `Hi ${member.name} bhai! ⏳ Gym me aapki kami mehsus ho rahi hai. Aapki monthly fee overdue chal rahi hai. Aate waqt counter par clear kar lena aur workout continue rakhna! 💪 — KJP Fitness Club, Kusupur`;
        }
    }

    const cleanPhone = member.phone.replace(/[^0-9]/g, '');
    const fullPhone = cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone;
    const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank');
}

// ==========================================
// 15. WHATSAPP DIRECT SENDER (FALLBACK & QUICK)
// ==========================================
function sendDirectWhatsApp(memberId, messageType = 'REMINDER', paymentObj = null) {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    let text = "";

    if (messageType === 'WELCOME') {
        text = `🏋️‍♂️ *WELCOME TO KJP FITNESS CLUB, KUSUPUR* 🏋️‍♂️\n━━━━━━━━━━━━━━━━━━━━━━\nNamaste *${member.name}* ji! 💪\n\nHumare fitness family me aapka swagat hai!\n\n💳 *Membership Card:*\n• *Member ID:* ${member.member_id}\n• *Admission Fee Paid:* ₹${member.admission_fee}\n• *1st Month Fee Due Date:* ${formatDisplayDate(member.due_date)} (₹${member.monthly_fee})\n\n⏰ *Gym Timings:*\n${appConfig.timings}\n\n📍 *Location:* ${appConfig.location}\n━━━━━━━━━━━━━━━━━━━━━━\nConsistency is the key to transformation. See you on the floor! 🔥`;
    } else if (messageType === 'RECEIPT' && paymentObj) {
        text = `🧾 *FEE RECEIPT — KJP FITNESS CLUB* 🧾\n📍 Kusupur\n━━━━━━━━━━━━━━━━━━━━━━\n*Receipt No:* ${paymentObj.receipt_no}\n*Member:* ${member.name} (${member.member_id})\n*Amount Received:* ₹${paymentObj.amount}\n*Payment Mode:* ${paymentObj.payment_mode}\n*Date:* ${formatDisplayDate(paymentObj.date)}\n*Extended Expiry Date:* ${formatDisplayDate(member.due_date)}\n━━━━━━━━━━━━━━━━━━━━━━\nPayment successfully recorded. Thank you! 💪`;
    } else {
        const daysLeft = calculateDaysDifference(member.due_date);
        text = `Namaste *${member.name}* ji! 💪\nJust an update from *KJP Fitness Club, Kusupur*:\nAapki monthly gym fee ₹${member.monthly_fee} ki due date *${formatDisplayDate(member.due_date)}* hai (${daysLeft <= 0 ? 'Due Today' : daysLeft + ' days bache hain'}).\n\n📲 UPI ID: \`${appConfig.upiId}\`\nUninterrupted workout ke liye time par renew karein! Thank you! 🏋️‍♂️`;
    }

    const cleanPhone = member.phone.replace(/[^0-9]/g, '');
    const fullPhone = cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone;
    const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(text)}`;

    window.open(url, '_blank');
}

// ==========================================
// 16. TELEGRAM DAILY CLOSING REPORT
// ==========================================
function generateDailyTelegramReport() {
    const today = getTodayString();
    let todayCash = 0;
    let todayUpi = 0;
    const paidMembersList = [];

    payments.forEach(p => {
        if (p.date === today) {
            if (p.payment_mode === 'CASH') todayCash += p.amount;
            else if (p.payment_mode === 'UPI') todayUpi += p.amount;
            paidMembersList.push(`• ${p.member_name} (${p.member_id}) — ₹${p.amount} [${p.payment_mode}]`);
        }
    });

    const totalCollection = todayCash + todayUpi;

    // Tomorrow's due members
    const tomorrow = formatDateOffset(1);
    const tomorrowDue = members.filter(m => m.due_date === tomorrow && m.status !== 'PAUSED');

    const report = `📊 *KJP FITNESS CLUB — DAILY CLOSING REPORT* 📊\n📅 Date: ${formatDisplayDate(today)}\n📍 Kusupur\n━━━━━━━━━━━━━━━━━━━━━━\n💰 *TODAY'S REVENUE:*\n• 💵 Cash: ₹${todayCash.toLocaleString('en-IN')}\n• 📲 UPI: ₹${todayUpi.toLocaleString('en-IN')}\n• 🏆 *Total: ₹${totalCollection.toLocaleString('en-IN')}*\n\n💳 *COLLECTIONS RECORDED (${paidMembersList.length}):*\n${paidMembersList.length ? paidMembersList.join('\n') : 'No fees collected today'}\n\n⚠️ *TOMORROW'S DUE EXPIRIES (${tomorrowDue.length}):*\n${tomorrowDue.length ? tomorrowDue.map(m => `• ${m.name} (${m.member_id}) — ₹${m.monthly_fee}`).join('\n') : 'None'}\n━━━━━━━━━━━━━━━━━━━━━━\n_Sent from KJP Gym Dashboard_`;

    navigator.clipboard.writeText(report).then(() => {
        showToast("Daily Closing Report copied to clipboard!");
    });

    // If Telegram chat ID or n8n Webhook is configured, fire it
    triggerN8nWebhook('DAILY_TELEGRAM_REPORT', {
        date: today,
        report_text: report,
        today_cash: todayCash,
        today_upi: todayUpi,
        total: totalCollection
    });
}

// ==========================================
// 17. TRIGGER n8n WEBHOOK
// ==========================================
function triggerN8nWebhook(eventType, payload) {
    if (!appConfig.n8nWebhookUrl) return;

    fetch(appConfig.n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            event: eventType,
            timestamp: new Date().toISOString(),
            data: payload
        })
    }).catch(err => {
        console.warn('n8n Webhook ping notice (n8n may be sleeping or URL empty):', err);
    });
}

// ==========================================
// 18. Toast Notification Utility
// ==========================================
function showToast(message, type = 'success') {
    const toast = document.getElementById('appToast');
    const msgEl = document.getElementById('toastMessage');
    const icon = toast.querySelector('.toast-icon');

    msgEl.textContent = message;
    icon.className = type === 'error' 
        ? 'toast-icon fa-solid fa-circle-exclamation text-red' 
        : 'toast-icon fa-solid fa-circle-check text-gold';

    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3500);
}

// ==========================================
// 19. MEMBER DOCUMENTS & DIGITAL PASS MANAGEMENT
// ==========================================
let activeDocMember = null;

function switchDocTab(tabId) {
    document.querySelectorAll('.doc-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-doctab') === tabId);
    });
    document.querySelectorAll('.doc-tab-content').forEach(content => {
        content.style.display = content.id === tabId ? 'block' : 'none';
    });
}

function openMemberDocsModal(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    activeDocMember = member;

    const nameEl = document.getElementById('docModalMemberName');
    const subEl = document.getElementById('docModalMemberSub');
    if (nameEl) nameEl.textContent = `${member.name} (${member.member_id})`;
    if (subEl) subEl.textContent = `Phone: +91 ${member.phone} • Blood: ${member.blood_group || 'O+'} • Valid Upto: ${formatDisplayDate(member.due_date)}`;

    // Reset to Tab 1
    switchDocTab('tabAadhar');

    // Render Tabs
    renderAadharTab(member);
    renderGymPassTab(member);
    renderReceiptsTab(member);

    openModal('memberDocsModal');
}

function renderAadharTab(member) {
    const container = document.getElementById('aadharDocContainer');
    if (!container) return;

    if (member.id_proof_url) {
        const isPdf = member.id_proof_url.startsWith('data:application/pdf') || (member.id_proof_name && member.id_proof_name.toLowerCase().endsWith('.pdf'));

        container.innerHTML = `
            <div class="doc-card">
                <div class="doc-card-header">
                    <div class="doc-meta-info">
                        <i class="fa-solid fa-file-shield text-gold doc-icon-large"></i>
                        <div>
                            <h4>${member.name} — Aadhar / ID Proof</h4>
                            <span class="doc-sub">${isPdf ? 'PDF Document' : 'Official Image Document'} &bull; Uploaded on File</span>
                        </div>
                    </div>
                    <span class="status-indicator"><i class="fa-solid fa-circle-check"></i> Document Verified</span>
                </div>

                <div class="doc-preview-area">
                    ${isPdf 
                        ? `<div class="pdf-placeholder">
                               <i class="fa-solid fa-file-pdf text-red"></i>
                               <span>PDF Document Attached</span>
                               <a href="${member.id_proof_url}" target="_blank" class="btn btn-outline btn-sm">Open in Browser</a>
                           </div>`
                        : `<img src="${member.id_proof_url}" class="doc-full-preview" alt="ID Proof Document">`
                    }
                </div>

                <div class="doc-card-actions">
                    <button class="btn btn-primary" onclick="downloadMemberDocument('${member.id}', 'AADHAR')">
                        <i class="fa-solid fa-download"></i> Download Document
                    </button>
                    <button class="btn btn-outline" onclick="openDocumentInNewWindow('${member.id}')">
                        <i class="fa-solid fa-arrow-up-right-from-square"></i> Open Full View
                    </button>
                    <label class="btn btn-outline" style="cursor: pointer;">
                        <i class="fa-solid fa-arrow-rotate-right"></i> Replace Document
                        <input type="file" accept="image/*,application/pdf" style="display: none;" onchange="handleReplaceIdProof(event, '${member.id}')">
                    </label>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="doc-empty-state">
                <i class="fa-solid fa-file-circle-plus text-gold doc-icon-empty"></i>
                <h4>No Aadhar / ID Proof Uploaded Yet</h4>
                <p>Is member ka ID proof abhi tak record me attach nahi hai. Aap niche button se photo ya PDF upload kar sakte hain:</p>
                <div style="margin-top: 16px;">
                    <label class="btn btn-primary" style="cursor: pointer;">
                        <i class="fa-solid fa-upload"></i> Upload Aadhar / ID Proof Now
                        <input type="file" accept="image/*,application/pdf" style="display: none;" onchange="handleReplaceIdProof(event, '${member.id}')">
                    </label>
                </div>
            </div>
        `;
    }
}

async function handleReplaceIdProof(e, memberId) {
    const file = e.target.files[0];
    if (!file) return;

    const dataUrl = await compressImageFile(file, 1200, 0.8);
    const member = members.find(m => m.id === memberId);
    if (member) {
        member.id_proof_url = dataUrl;
        member.id_proof_name = file.name;
        saveLocalData();
        syncMemberToSupabase(member);
        renderAadharTab(member);
        showToast(`Document uploaded successfully for ${member.name}!`);
    }
}

function downloadMemberDocument(memberId, type = 'AADHAR') {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    const url = type === 'PHOTO' ? member.photo_url : member.id_proof_url;
    if (!url) {
        showToast('Document not available to download', 'error');
        return;
    }

    const isPdf = url.startsWith('data:application/pdf') || (member.id_proof_name && member.id_proof_name.toLowerCase().endsWith('.pdf'));
    const ext = isPdf ? 'pdf' : 'png';
    const cleanName = member.name.replace(/[^a-zA-Z0-9]/g, '_');

    const link = document.createElement('a');
    link.href = url;
    link.download = `${cleanName}_${member.member_id}_${type}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Downloading ${member.name}'s ${type}...`);
}

function openDocumentInNewWindow(memberId) {
    const member = members.find(m => m.id === memberId);
    if (!member || !member.id_proof_url) return;

    const win = window.open('', '_blank');
    if (win) {
        win.document.write(`
            <html>
                <head>
                    <title>${member.name} - ID Proof | KJP Fitness Club</title>
                    <style>
                        body { margin: 0; background: #07090e; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: sans-serif; }
                        img { max-width: 95vw; max-height: 95vh; border-radius: 10px; box-shadow: 0 10px 40px rgba(0,0,0,0.9); }
                    </style>
                </head>
                <body>
                    <img src="${member.id_proof_url}" alt="${member.name} ID Proof">
                </body>
            </html>
        `);
    }
}

function renderGymPassTab(member) {
    const wrapper = document.getElementById('idPassWrapper');
    if (!wrapper) return;

    const avatar = member.photo_url 
        ? `<img src="${member.photo_url}" class="gym-card-photo" alt="${member.name}">`
        : `<div class="gym-card-photo placeholder"><i class="fa-solid fa-user"></i></div>`;

    wrapper.innerHTML = `
        <div class="gym-id-card" id="printableGymCard">
            <div class="card-chip-gold"></div>
            <div class="gym-card-header">
                <div class="gym-card-brand">
                    <div class="gym-card-logo"><i class="fa-solid fa-dumbbell"></i></div>
                    <div>
                        <h3>KJP FITNESS CLUB</h3>
                        <span>KUSUPUR, ODISHA &bull; LIFETIME ACCESS</span>
                    </div>
                </div>
                <div class="gym-card-badge">MEMBER PASS</div>
            </div>

            <div class="gym-card-body">
                <div class="photo-container">
                    ${avatar}
                    <span class="blood-pill"><i class="fa-solid fa-droplet text-red"></i> ${member.blood_group || 'O+'}</span>
                </div>
                <div class="info-container">
                    <h2 class="card-member-name">${member.name}</h2>
                    <div class="card-id-row">
                        <span class="card-id-highlight">ID: ${member.member_id}</span>
                        <span class="card-status-pill">${member.status}</span>
                    </div>
                    <div class="card-meta-grid">
                        <div>
                            <span class="meta-label">Joined On</span>
                            <strong class="meta-val">${formatDisplayDate(member.admission_date)}</strong>
                        </div>
                        <div>
                            <span class="meta-label">Valid Upto</span>
                            <strong class="meta-val text-green">${formatDisplayDate(member.due_date)}</strong>
                        </div>
                        <div>
                            <span class="meta-label">Phone</span>
                            <strong class="meta-val">+91 ${member.phone}</strong>
                        </div>
                        <div>
                            <span class="meta-label">Emergency</span>
                            <strong class="meta-val">${member.emergency_contact || 'N/A'}</strong>
                        </div>
                    </div>
                </div>
            </div>

            <div class="gym-card-footer">
                <div class="barcode-graphic">
                    <span class="barcode-line"></span>
                    <span class="barcode-line w2"></span>
                    <span class="barcode-line w3"></span>
                    <span class="barcode-line"></span>
                    <span class="barcode-line w2"></span>
                    <span class="barcode-line w4"></span>
                    <span class="barcode-line"></span>
                    <span class="barcode-line w3"></span>
                    <span class="barcode-line w2"></span>
                    <span class="barcode-line"></span>
                    <span class="barcode-line w3"></span>
                </div>
                <span class="gym-motto">CONSISTENCY &bull; DISCIPLINE &bull; TRANSFORMATION</span>
            </div>
        </div>
    `;
}

function printMembershipCard() {
    const cardEl = document.getElementById('printableGymCard');
    if (!cardEl) return;

    const printWin = window.open('', '', 'width=750,height=550');
    printWin.document.write(`
        <html>
            <head>
                <title>KJP Fitness Club - Membership Card</title>
                <link rel="stylesheet" href="style.css">
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
                <style>
                    body {
                        background: #000;
                        color: #fff;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        margin: 0;
                        padding: 20px;
                        font-family: 'Outfit', sans-serif;
                    }
                    @media print {
                        body { background: #fff !important; color: #000 !important; }
                        .gym-id-card { box-shadow: none !important; border: 2px solid #000 !important; }
                    }
                </style>
            </head>
            <body>
                ${cardEl.outerHTML}
                <script>
                    setTimeout(() => { window.print(); window.close(); }, 400);
                </script>
            </body>
        </html>
    `);
    printWin.document.close();
}

function renderReceiptsTab(member) {
    const listEl = document.getElementById('memberReceiptsList');
    if (!listEl) return;

    const memberPayments = payments.filter(p => p.member_id === member.member_id || p.member_name === member.name);

    if (memberPayments.length === 0) {
        listEl.innerHTML = `
            <div style="text-align: center; padding: 30px; color: var(--text-muted);">
                <i class="fa-solid fa-receipt" style="font-size: 2.5rem; margin-bottom: 10px; display: block;"></i>
                <p>No payment receipts recorded yet for this member.</p>
            </div>
        `;
        return;
    }

    listEl.innerHTML = memberPayments.map(p => `
        <div class="receipt-item-card">
            <div class="receipt-item-left">
                <div class="receipt-badge"><i class="fa-solid fa-file-invoice-dollar"></i></div>
                <div>
                    <strong class="receipt-no">${p.receipt_no}</strong>
                    <div class="receipt-meta">${formatDisplayDate(p.date)} &bull; ${p.payment_type.replace(/_/g, ' ')} &bull; Mode: ${p.payment_mode}</div>
                </div>
            </div>
            <div class="receipt-item-right">
                <span class="receipt-amount">₹${p.amount}</span>
                <button class="btn btn-outline btn-sm" onclick="printSingleReceipt('${p.receipt_no}')">
                    <i class="fa-solid fa-print"></i> Receipt
                </button>
            </div>
        </div>
    `).join('');
}

function printSingleReceipt(receiptNo) {
    const payment = payments.find(p => p.receipt_no === receiptNo);
    if (!payment) return;

    const member = members.find(m => m.member_id === payment.member_id) || { name: payment.member_name, phone: '', due_date: '' };

    const printWin = window.open('', '', 'width=600,height=700');
    printWin.document.write(`
        <html>
            <head>
                <title>Receipt ${payment.receipt_no} - KJP Fitness Club</title>
                <style>
                    body { font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif; padding: 30px; background: #fff; color: #111; }
                    .receipt-box { border: 2px solid #222; border-radius: 12px; padding: 24px; max-width: 500px; margin: 0 auto; }
                    .header { text-align: center; border-bottom: 2px dashed #999; padding-bottom: 16px; margin-bottom: 16px; }
                    .header h1 { margin: 0; font-size: 24px; letter-spacing: 1px; }
                    .header p { margin: 4px 0 0 0; font-size: 13px; color: #666; }
                    .row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
                    .divider { height: 1px; background: #eee; margin: 12px 0; }
                    .total-row { display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; border-top: 2px dashed #999; padding-top: 12px; margin-top: 12px; }
                    .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #777; }
                </style>
            </head>
            <body>
                <div class="receipt-box">
                    <div class="header">
                        <h1>KJP FITNESS CLUB</h1>
                        <p>Kusupur, Odisha &bull; Phone: +91 9348837931</p>
                        <p><strong>OFFICIAL PAYMENT RECEIPT</strong></p>
                    </div>
                    <div class="row"><span>Receipt No:</span><strong>${payment.receipt_no}</strong></div>
                    <div class="row"><span>Date:</span><strong>${formatDisplayDate(payment.date)}</strong></div>
                    <div class="row"><span>Member Name:</span><strong>${payment.member_name}</strong></div>
                    <div class="row"><span>Member ID:</span><strong>${payment.member_id}</strong></div>
                    <div class="divider"></div>
                    <div class="row"><span>Payment Purpose:</span><strong>${payment.payment_type.replace(/_/g, ' ')}</strong></div>
                    <div class="row"><span>Payment Mode:</span><strong>${payment.payment_mode}</strong></div>
                    <div class="row"><span>Valid Upto:</span><strong>${formatDisplayDate(member.due_date)}</strong></div>
                    <div class="total-row"><span>Amount Paid:</span><span>₹${payment.amount}</span></div>
                    <div class="footer">
                        <p>Thank you for choosing KJP Fitness Club!<br>Fitness is an investment, not an expense.</p>
                    </div>
                </div>
                <script>
                    setTimeout(() => { window.print(); window.close(); }, 400);
                </script>
            </body>
        </html>
    `);
    printWin.document.close();
}
