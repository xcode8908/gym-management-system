# 🏋️‍♂️ KJP FITNESS CLUB, KUSUPUR — COMPLETE SYSTEM SETUP GUIDE

Yeh guide aapko step-by-step batayegi ki aap apne **KJP Fitness Club** ke system ko **100% Lifetime Free** kaise setup aur live kar sakte hain.

---

## 📁 Files Overview (Aapke Workspace me kya-kya hai):

1. **`index.html`** — KJP Fitness Club ka Modern Web Dashboard.
2. **`style.css`** — High-end Dark & Gold Gym Theme (Mobile & Desktop).
3. **`app.js`** — Complete Logic (Admission ₹1000, Monthly ₹400, Advance rollover, Freeze, Cash/UPI, WhatsApp & Telegram).
4. **`supabase_schema.sql`** — 100% Lifetime Free Database tables.
5. **`n8n_workflows/kjp_gym_n8n_workflows.json`** — 1-Click n8n Automation Workflows.

---

## 🚀 STEP 1: Supabase Database Setup (Lifetime Free)

> **Kyun?** Supabase ka database **kabhi expire nahi hota** aur 1 GB photo storage free milti hai.

1. [Supabase.com](https://supabase.com) par free account banayein.
2. **"New Project"** par click karein:
   * **Project Name:** `KJP-Fitness-Club`
   * **Database Password:** Ek strong password set karein aur likh lein.
   * **Region:** India (Mumbai) / Singapore select karein.
3. Left menu me **"SQL Editor"** par click karein.
4. **`supabase_schema.sql`** file ka pura code copy karke wahan paste karein aur **"Run"** click karein.
   * ✅ Members, Payments, Pause Logs aur Documents storage bucket create ho jayenge!
5. **Project Settings** -> **Database** me jaakar **Connection String (URI / Host details)** note kar lein:
   * Host: `db.xxxxxxxxxx.supabase.co`
   * Port: `5432` / `6543`
   * User: `postgres`
   * Password: (Aapka password)

---

## ⚡ STEP 2: Deploy n8n on Render (Bina 30-Day Reset ke)

> **Trick:** Render par n8n chalega, lekin uska database Supabase me connect hoga. Isse Render restart hone par bhi **data kabhi delete nahi hoga**!

1. [Render.com](https://render.com) par free login karein.
2. **New +** ➡️ **Web Service** select karein.
3. **"Existing Image"** choose karein aur Docker image name dalein:
   ```text
   n8nio/n8n:latest
   ```
4. Name rakhein: `kjp-fitness-n8n`
5. Plan: **Free**
6. **Environment Variables** add karein:

| Key | Value |
|---|---|
| `DB_TYPE` | `postgresdb` |
| `DB_POSTGRESDB_HOST` | `db.xxxxxxxx.supabase.co` (Aapka Supabase Host) |
| `DB_POSTGRESDB_PORT` | `5432` |
| `DB_POSTGRESDB_DATABASE` | `postgres` |
| `DB_POSTGRESDB_USER` | `postgres` |
| `DB_POSTGRESDB_PASSWORD` | `Aapka_Supabase_Password` |
| `DB_POSTGRESDB_SSL_REJECT_UNAUTHORIZED` | `false` |
| `N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS` | `true` |
| `WEBHOOK_URL` | `https://kjp-fitness-n8n.onrender.com/` |

7. **"Create Web Service"** par click karein.
   * 3-4 minute me aapka n8n live ho jayega aur ek link mil jayega: `https://kjp-fitness-n8n.onrender.com`

---

## ⏰ STEP 3: Render ko 24/7 Jagaye Rakhna (Free Cron-Job)

> **Kyun?** Render free service 15 minute me so jaati hai. Is tool se wo kabhi nahi soyegi!

1. [cron-job.org](https://cron-job.org) par free account banayein.
2. **"Create Cronjob"** par click karein.
3. **URL:** `https://kjp-fitness-n8n.onrender.com/healthz`
4. **Execution Schedule:** Har **10 Minutes** set karein.
5. Save karein. ✅ Ab Render 24/7 bina ruke chalega!

---

## 🤖 STEP 4: Free Telegram Bot Setup (1 Minute)

Aapke phone par **Raat 10 Baje Daily Hisaab** aane ke liye:

1. Telegram app me search karein: `@BotFather`
2. Message bhejein: `/newbot`
3. Bot ka naam rakhein: `KJP Fitness Bot`
4. Username rakhein: `kjp_fitness_club_bot`
5. `@BotFather` aapko ek **API Token** dega (e.g., `71829102:ABC-xyz...`). Isko copy kar lein.
6. Apni **Personal Chat ID** nikaalne ke liye Telegram me search karein: `@userinfobot` aur Start karein. Wahan se apni `Id` number note karein.

---

## 📥 STEP 5: n8n Workflow Import Karna

1. Apna Render n8n link open karein (`https://kjp-fitness-n8n.onrender.com`).
2. Login karke **Workflows** ➡️ **Import from File** par click karein.
3. **`n8n_workflows/kjp_gym_n8n_workflows.json`** file select karein.
4. Telegram Node me apna **Bot Token** aur **Chat ID** select karein.
5. Top-right par **Active toggle** ko **ON** kar dein!

---

## 💻 STEP 6: Gym Dashboard Run Karna

Aap apne computer ya mobile par:
* Simply **`index.html`** file ko double click karke kisi bhi browser (Chrome, Edge, Safari) me open karein!
* Dashboard open ho jayega aur aap:
  * 🆕 **New Admission** kar sakte hain (Photo + Aadhar upload ke sath).
  * 💵 **₹400 Fee Collect** kar sakte hain (Cash ya UPI).
  * ⏸️ **Membership Pause & Resume** kar sakte hain.
  * 📲 **WhatsApp Receipt** 1-click me deliver kar sakte hain.
  * 📊 **Settings** me jaakar apna n8n webhook URL daal sakte hain.

> 🌐 **Mobile par chalane ke liye:**  
> Aap is folder ko GitHub par upload karke **GitHub Pages** ya **Vercel** par 1-click me deploy kar sakte hain (100% Lifetime Free). Fir aap apne mobile me ek App ki tarah link open karke use kar sakte hain!
