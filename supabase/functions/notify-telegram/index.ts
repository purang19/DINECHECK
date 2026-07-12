// Sends a Telegram message to a channel whenever a survey is inserted.
// Invoked by a Postgres AFTER INSERT trigger (pg_net) on public.surveys — see
// supabase/migrations/0002_notify_telegram.sql. The bot token is a secret and
// lives only in this function's env, never in the client bundle or the repo.

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? '';
const CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID') ?? '';
const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET') ?? '';

type Item = Record<string, string>;
interface Survey {
  date?: string;
  name?: string;
  employee_id?: string;
  restaurant?: string;
  time_of_service?: string;
  type_of_service?: string;
  tasted_items?: Item[];
  promptness_of_service?: number | null;
  attentiveness_and_care?: number | null;
  cleanliness?: number | null;
  value?: number | null;
  comments?: string | null;
}

const FOOD_FIELDS = [
  'foodTaste',
  'qualityOfIngredients',
  'freshnessOfFood',
  'foodTemperature',
  'foodPresentation',
];

const num = (v: unknown): number | null => {
  const n = Number(v);
  return v !== '' && v != null && !Number.isNaN(n) ? n : null;
};
const mean = (xs: number[]): number | null => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const fmt = (n: number | null): string => (n == null ? '—' : n.toFixed(1));

function buildMessage(s: Survey): string {
  const food: number[] = [];
  for (const it of s.tasted_items ?? []) {
    for (const f of FOOD_FIELDS) {
      const n = num(it[f]);
      if (n != null) food.push(n);
    }
  }
  const service: number[] = [];
  for (const v of [s.promptness_of_service, s.attentiveness_and_care, s.cleanliness, s.value]) {
    const n = num(v);
    if (n != null) service.push(n);
  }
  const foodAvg = mean(food);
  const serviceAvg = mean(service);
  const overall = mean([...food, ...service]);
  const items = (s.tasted_items ?? []).map((i) => i.itemName).filter(Boolean).join(', ') || '—';
  const meta = [s.time_of_service, s.type_of_service].filter(Boolean).join(' · ');
  const comment = (s.comments ?? '').trim();

  return [
    '🍽️ New Dine Check evaluation',
    `Restaurant: ${s.restaurant || '—'}${meta ? ' · ' + meta : ''}`,
    `Evaluator: ${s.name || 'Anonymous'}${s.employee_id ? ` (${s.employee_id})` : ''} — ${s.date || ''}`,
    `⭐ Food ${fmt(foodAvg)}/5 · Service ${fmt(serviceAvg)}/5 · Overall ${fmt(overall)}/5`,
    `Items: ${items}`,
    `💬 ${comment ? `"${comment}"` : '—'}`,
  ].join('\n');
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    // Shared-secret guard for the public function URL (skipped only if unset).
    if (WEBHOOK_SECRET && req.headers.get('x-webhook-secret') !== WEBHOOK_SECRET) {
      return new Response('Unauthorized', { status: 401 });
    }

    if (!BOT_TOKEN || !CHAT_ID) {
      console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID');
      return new Response('Not configured', { status: 200 });
    }

    const payload = await req.json().catch(() => ({}));
    const record: Survey = payload.record ?? payload;
    const text = buildMessage(record);
    const photo = (record.tasted_items ?? []).map((i) => i.imageUrl).find((u) => !!u);

    // Send the first dish photo with the summary as its caption; else text-only.
    const tg = photo
      ? await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: CHAT_ID, photo, caption: text }),
        })
      : await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: CHAT_ID, text, disable_web_page_preview: true }),
        });
    const body = await tg.text();
    if (!tg.ok) console.error('Telegram error', tg.status, body);
    else console.log('Telegram sent', body);

    return new Response(JSON.stringify({ ok: tg.ok }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('notify-telegram error', e);
    return new Response('error', { status: 200 });
  }
});
