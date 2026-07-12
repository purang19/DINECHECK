import { createClient } from '@supabase/supabase-js';
import type { SurveyData, StoredSurvey } from './types';

// Supabase config is read from Vite env vars (VITE_*) when provided, and falls
// back to the shared DINECHECK project so the app works out of the box. The
// publishable/anon key is safe to ship in the client — access is governed by
// row-level security policies (see supabase/migrations).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? 'https://kjcqkgaevjkrdrwzplov.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'sb_publishable_AMWZahiN38UJLGL9ae4ADw_CedTwzM-';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// The DB stores snake_case columns and numeric ratings; the app uses camelCase
// and string ratings. These helpers translate between the two shapes.
const toNumber = (v: string) => (v === '' || v == null ? null : Number(v));

function toRow(data: SurveyData) {
  return {
    date: data.date,
    name: data.name,
    employee_id: data.employeeId,
    restaurant: data.restaurant,
    time_of_service: data.timeOfService,
    type_of_service: data.typeOfService,
    tasted_items: data.tastedItems,
    promptness_of_service: toNumber(data.promptnessOfService),
    attentiveness_and_care: toNumber(data.attentivenessAndCare),
    cleanliness: toNumber(data.cleanliness),
    value: toNumber(data.value),
    comments: data.comments,
  };
}

function fromRow(row: Record<string, any>): StoredSurvey {
  return {
    id: row.id,
    date: row.date,
    name: row.name,
    employeeId: row.employee_id,
    restaurant: row.restaurant,
    timeOfService: row.time_of_service,
    typeOfService: row.type_of_service,
    tastedItems: row.tasted_items ?? [],
    promptnessOfService: String(row.promptness_of_service ?? ''),
    attentivenessAndCare: String(row.attentiveness_and_care ?? ''),
    cleanliness: String(row.cleanliness ?? ''),
    value: String(row.value ?? ''),
    comments: row.comments ?? '',
    createdAt: row.created_at,
  };
}

export async function submitSurvey(data: SurveyData) {
  const { error } = await supabase.from('surveys').insert(toRow(data));
  if (error) throw error;
}

export async function getSurveysByDate(startDate: string, endDate: string): Promise<StoredSurvey[]> {
  const { data, error } = await supabase
    .from('surveys')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

// Downscale + JPEG-compress a photo in the browser before upload, to save
// Storage space and speed up loads. A ~12MP phone photo (3–8MB) becomes a
// ~1600px JPEG of a few hundred KB. Animated GIFs are left untouched; if the
// re-encoded result would be larger, the original is kept.
const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.82;

async function compressImage(file: File): Promise<Blob> {
  if (file.type === 'image/gif' || typeof createImageBitmap !== 'function') return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return file; // decode failed — upload the original
  }
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
  );
  return blob && blob.size < file.size ? blob : file;
}

// Uploads a dish photo (compressed) to the public menu-photos bucket, returns its URL.
export async function uploadMenuPhoto(file: File): Promise<string> {
  const optimized = await compressImage(file);
  const type = optimized.type || 'image/jpeg';
  const ext = type.includes('png')
    ? 'png'
    : type.includes('webp')
      ? 'webp'
      : type.includes('gif')
        ? 'gif'
        : 'jpg';
  const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('menu-photos').upload(path, optimized, {
    contentType: type,
    upsert: false,
  });
  if (error) throw error;
  return supabase.storage.from('menu-photos').getPublicUrl(path).data.publicUrl;
}

// Surveys on or after startDate, newest first — used by the dashboard.
export async function getSurveysSince(startDate: string): Promise<StoredSurvey[]> {
  const { data, error } = await supabase
    .from('surveys')
    .select('*')
    .gte('date', startDate)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromRow);
}
