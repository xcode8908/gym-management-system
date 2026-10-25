# 🤖 Gym WhatsApp Bot Worker (Render Free Tier)

This is a lightweight Node.js worker powered by **Baileys** for 100% free automated WhatsApp messaging.

## How to Deploy to Render (100% Free):
1. Create a free account at [render.com](https://render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository and select the `worker` folder as root directory (or deploy as standalone).
4. Build Command: `npm install`
5. Start Command: `node index.js`
6. Environment Variables:
   - `WHATSAPP_API_SECRET`: Set any secure string (e.g. `my_gym_secret_12345`)
   - `PORT`: `4000`
7. Once deployed, open your Render URL in your browser: `https://your-service.onrender.com/qr`
8. Scan the QR code using your Gym's official WhatsApp phone (**WhatsApp -> Linked Devices -> Link a Device**).
9. Copy your Render URL and add it to your Next.js `.env.local` / Vercel Environment Variables:
   ```
   WHATSAPP_WORKER_URL="https://your-service.onrender.com"
   WHATSAPP_API_SECRET="my_gym_secret_12345"
   ```
