# ⏰ 8:00 AM Automated Gym Reminders (Cloudflare Worker Cron)

Yeh Cloudflare Worker har subah **08:00 AM IST (Indian Standard Time)** par apne aap trigger hota hai aur aapke gym members ko expiry alerts dispatch karta hai — **bina laptop ya PC khole, 100% Lifetime Free**!

---

## ⚡ Yeh Kaise Kaam Karta Hai?
1. **Cloudflare Cron Trigger:** Har subah 8:00 AM IST (`30 2 * * *` UTC) par Cloudflare Worker wake up hota hai.
2. **Next.js API Call:** Worker aapke Next.js web app ke `/api/cron/reminders` endpoint ko request bhejta hai.
3. **Automated Reminders:** Next.js check karta hai:
   - Jin members ke **7 din**, **3 din**, ya **1 din** bache hain unhe **WhatsApp & Email** alerts bhejta hai.
4. **Result Log:** Saare notification logs database mein save ho jaate hain.

---

## 🚀 2-Minute Setup Guide (100% Free):

### Option 1: Cloudflare Dashboard Se (Bina Command Line ke)
1. [dash.cloudflare.com](https://dash.cloudflare.com/) par free account banayein (Credit Card nahi chahiye).
2. **Workers & Pages** -> **Create Worker** par click karein.
3. Name rakhein: `gym-reminders-cron`.
4. **Deploy** par click karein, phir **Edit Code** par click karein.
5. `cloudflare-cron/index.js` ka poora code copy karke wahan paste kar dein aur **Save and deploy** karein.
6. Worker ke **Settings** -> **Variables and Secrets** mein jayein:
   - `GYM_APP_URL`: Aapka live Vercel URL (e.g. `https://my-gym.vercel.app`)
   - `CRON_SECRET`: Jo secret aapne `.env` mein rakha hai (e.g. `dev_cron_secret`)
7. **Settings** -> **Triggers** -> **Cron Triggers** -> **Add Trigger**:
   - Cron Expression: `30 2 * * *` (Har subah 08:00 AM IST).
   - Click **Save Trigger**.
8. **Test Karein:** Apne worker ke URL ke aage `/run` lagakar browser mein open karein (e.g. `https://gym-reminders-cron.your-name.workers.dev/run`) — yeh turant live reminders trigger karke result screen par dikha dega!

---

### Option 2: Wrangler CLI Se (Terminal Se)
Agar aap terminal use karte hain:
```bash
cd cloudflare-cron
npx wrangler login
npx wrangler deploy
```

---

## 💰 Cost:
- **Cloudflare Workers Free Tier:** 100,000 requests per day (Gym ke liye sirf 1 request/day chahiye).
- **Cost:** ₹0 Forever (Lifetime Free).
