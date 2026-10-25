const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const QRCode = require('qrcode');

const app = express();
app.use(express.json());

// Enable CORS for all origins (Localhost 3000 & Cloud deployments)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const PORT = process.env.PORT || 4000;
const API_SECRET = process.env.WHATSAPP_API_SECRET || 'dev_whatsapp_secret';

let sock = null;
let qrCodeData = null;
let isConnected = false;

// Initialize WhatsApp Baileys Client
async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

  sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true,
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrCodeData = await QRCode.toDataURL(qr);
      console.log('New WhatsApp QR Code generated. Scan at http://localhost:' + PORT + '/qr');
    }

    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Connection closed. Reconnecting:', shouldReconnect);
      isConnected = false;
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === 'open') {
      console.log('WhatsApp Bot successfully connected and authenticated!');
      isConnected = true;
      qrCodeData = null;
    }
  });

  sock.ev.on('creds.update', saveCreds);
}

// 1. Status API
app.get('/status', (req, res) => {
  res.json({
    success: true,
    isConnected,
    status: isConnected ? 'CONNECTED' : qrCodeData ? 'WAITING_SCAN' : 'INITIALIZING',
    qrCodeData: isConnected ? null : qrCodeData,
  });
});

// 2. Health check & QR display endpoint
app.get('/qr', (req, res) => {
  if (isConnected) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>WhatsApp Bot - Connected</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body style="font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 40px 20px; background: #050811; color: #f8fafc; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 24px; padding: 32px; max-width: 440px; box-shadow: 0 0 30px rgba(16,185,129,0.15);">
          <div style="font-size: 48px; margin-bottom: 12px;">✅</div>
          <h2 style="color: #10b981; margin: 0 0 8px 0; font-size: 24px;">WhatsApp Connected!</h2>
          <p style="color: #94a3b8; font-size: 14px; line-height: 1.5; margin: 0 0 24px 0;">
            Aapka Gym WhatsApp bot successfully authenticated hai. Har subah 8:00 AM par automated reminders aur billing receipts bina kisi click ke apne aap send honge!
          </p>
          <button onclick="handleLogout()" id="logoutBtn" style="background: rgba(244, 63, 94, 0.15); border: 1px solid rgba(244, 63, 94, 0.4); color: #fda4af; padding: 10px 20px; border-radius: 12px; font-weight: bold; cursor: pointer; font-size: 13px; transition: all 0.2s;">
            🔴 Disconnect / Switch WhatsApp Number
          </button>
        </div>
        <script>
          async function handleLogout() {
            if (!confirm('Kya aap yeh WhatsApp disconnect karke naya number scan karna chahte hain?')) return;
            const btn = document.getElementById('logoutBtn');
            btn.innerText = 'Disconnecting...';
            btn.disabled = true;
            try {
              await fetch('/api/logout', { method: 'POST' });
              location.reload();
            } catch (e) {
              alert('Logout error: ' + e.message);
              location.reload();
            }
          }
        </script>
      </body>
      </html>
    `);
  }

  if (!qrCodeData) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Generating WhatsApp QR...</title>
        <meta http-equiv="refresh" content="3">
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body style="font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 40px 20px; background: #050811; color: #f8fafc; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; padding: 32px; max-width: 440px;">
          <div style="font-size: 32px; margin-bottom: 12px; animation: spin 1s infinite;">⏳</div>
          <h2 style="color: #e2e8f0; margin: 0 0 8px 0;">QR Code Generate Ho Raha Hai...</h2>
          <p style="color: #94a3b8; font-size: 13px;">Page auto-refresh ho raha hai, kripya 3-5 seconds wait karein.</p>
        </div>
      </body>
      </html>
    `);
  }

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Scan Gym WhatsApp QR</title>
      <meta http-equiv="refresh" content="12">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 40px 20px; background: #050811; color: #f8fafc; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; padding: 32px; max-width: 460px; box-shadow: 0 20px 40px rgba(0,0,0,0.8);">
        <h2 style="color: #00f59b; margin: 0 0 6px 0; font-size: 22px;">Scan with Gym WhatsApp</h2>
        <p style="color: #94a3b8; font-size: 13px; margin: 0 0 20px 0;">
          Apne phone mein WhatsApp open karein -> <strong>Linked Devices</strong> -> <strong>Link a Device</strong> -> QR scan karein.
        </p>
        <div style="background: #ffffff; padding: 14px; border-radius: 20px; display: inline-block; box-shadow: 0 0 25px rgba(0,245,155,0.25);">
          <img src="${qrCodeData}" width="240" height="240" style="display: block; border-radius: 8px;" alt="WhatsApp Login QR" />
        </div>
        <p style="color: #64748b; font-size: 11px; margin: 16px 0 0 0;">
          QR code har 12 seconds mein auto-refresh hota hai. Scan hote hi screen green ho jayegi.
        </p>
      </div>
    </body>
    </html>
  `);
});

// 3. Dispatch automated message API
app.post('/api/send', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${API_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized secret token' });
  }

  const { phone, message } = req.body;
  if (!phone || !message) {
    return res.status(400).json({ error: 'Phone and message required' });
  }

  if (!isConnected || !sock) {
    return res.status(503).json({ error: 'WhatsApp bot is not connected. Scan QR code first at /qr.' });
  }

  try {
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    
    // In India, auto prepend country code 91 if only 10 digits
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    }

    const jid = `${cleanPhone}@s.whatsapp.net`;

    // Dynamic human-like anti-ban pacing (3 to 5 seconds per member)
    const delay = Math.floor(Math.random() * 2000) + 3000;
    await new Promise((resolve) => setTimeout(resolve, delay));

    await sock.sendMessage(jid, { text: message });
    console.log(`[Auto WhatsApp] Delivered to ${cleanPhone}`);
    return res.json({ success: true, deliveredTo: cleanPhone });
  } catch (err) {
    console.error('Error sending WhatsApp message:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 4. Logout / Change WhatsApp Number endpoint
app.post('/api/logout', async (req, res) => {
  try {
    if (sock) {
      await sock.logout();
    }
  } catch (e) {}

  isConnected = false;
  sock = null;
  qrCodeData = null;

  try {
    const fs = require('fs');
    const path = require('path');
    const authDir = path.join(__dirname, 'auth_info_baileys');
    if (fs.existsSync(authDir)) {
      fs.rmSync(authDir, { recursive: true, force: true });
    }
  } catch (err) {}

  setTimeout(() => {
    connectToWhatsApp();
  }, 1000);

  console.log('[WhatsApp Bot] Logged out. Ready to connect new number via /qr.');
  return res.json({ success: true, message: 'WhatsApp unlinked successfully. You can now scan a new number at /qr.' });
});

app.listen(PORT, () => {
  console.log(`WhatsApp Worker running on port ${PORT}`);
  connectToWhatsApp();

  // Built-in 8:00 AM IST Automated Cron Runner
  let lastCronRunDate = null;
  setInterval(async () => {
    try {
      const now = new Date();
      // IST is UTC + 5 hours 30 mins
      const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
      const hours = istTime.getUTCHours();
      const minutes = istTime.getUTCMinutes();
      const todayDate = istTime.toISOString().split('T')[0];

      // At 08:00 AM IST, run automatic daily reminders
      if (hours === 8 && minutes === 0 && lastCronRunDate !== todayDate) {
        lastCronRunDate = todayDate;
        console.log(`[Auto Scheduler] 8:00 AM IST reached on ${todayDate}. Automatically triggering daily WhatsApp & Email expiry reminders...`);
        const targetAppUrl = process.env.NEXT_APP_URL || 'http://localhost:3000';
        const res = await fetch(`${targetAppUrl}/api/cron/reminders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer dev_cron_secret',
          },
        });
        const data = await res.json();
        console.log(`[Auto Scheduler] 8:00 AM reminders automated run completed:`, data);
      }
    } catch (e) {
      console.error('[Auto Scheduler Error]', e.message);
    }
  }, 25000); // Check every 25 seconds
});
