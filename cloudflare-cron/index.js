/**
 * Cloudflare Worker - 8:00 AM IST Automated Gym Reminder Cron
 * Triggers every day at 08:00 AM Indian Standard Time (02:30 AM UTC)
 * 100% Free Lifetime Tier (100,000 requests/day, free scheduled crons)
 */

export default {
  // 1. Automated Cron Trigger (Scheduled Event)
  async scheduled(event, env, ctx) {
    console.log(`[Gym Cron] 8:00 AM Scheduled event triggered at: ${new Date().toISOString()}`);
    ctx.waitUntil(triggerGymReminders(env));
  },

  // 2. HTTP Endpoint (Test manually by visiting /run in browser)
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/run') {
      const result = await triggerGymReminders(env);
      return new Response(JSON.stringify(result, null, 2), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      `Gym 8:00 AM Cloudflare Cron Trigger is ACTIVE!\n\n` +
      `- Scheduled: Every morning at 08:00 AM IST (02:30 UTC)\n` +
      `- Target App: ${env.GYM_APP_URL || 'Not configured'}\n` +
      `- Manual Test: Open ${url.origin}/run in browser to trigger reminders immediately.\n`,
      {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      }
    );
  },
};

async function triggerGymReminders(env) {
  const targetUrl = env.GYM_APP_URL || 'http://localhost:3000';
  const cronSecret = env.CRON_SECRET || 'dev_cron_secret';

  try {
    const res = await fetch(`${targetUrl}/api/cron/reminders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cronSecret}`,
        'User-Agent': 'Cloudflare-Worker-GymCron',
      },
    });

    const data = await res.json();
    console.log(`[Gym Cron Success] Result:`, data);
    return {
      success: true,
      timestamp: new Date().toISOString(),
      statusCode: res.status,
      response: data,
    };
  } catch (err) {
    console.error(`[Gym Cron Error] Failed to reach gym app:`, err);
    return {
      success: false,
      timestamp: new Date().toISOString(),
      error: err.message,
    };
  }
}
