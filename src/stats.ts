import type { StoredSurvey, TastedItem } from './types';

// Rating fields shared by the dashboard and the sidebar insight card.
export const FOOD_FIELDS: [keyof TastedItem, string][] = [
  ['foodTaste', 'Food Taste'],
  ['qualityOfIngredients', 'Quality of Ingredients'],
  ['freshnessOfFood', 'Freshness of Food'],
  ['foodTemperature', 'Food Temperature'],
  ['foodPresentation', 'Food Presentation'],
];

export const SERVICE_FIELDS: [keyof StoredSurvey, string][] = [
  ['promptnessOfService', 'Promptness of Service'],
  ['attentivenessAndCare', 'Attentiveness & Care'],
  ['cleanliness', 'Cleanliness'],
  ['value', 'Value for Money'],
];

export const toNum = (s: string): number | null => {
  const n = Number(s);
  return s !== '' && s != null && !Number.isNaN(n) ? n : null;
};

export const mean = (xs: number[]): number | null =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;

// Every food-quality rating (all metrics, all tasted items) across the surveys.
export function foodRatings(surveys: StoredSurvey[]): number[] {
  const out: number[] = [];
  for (const s of surveys) {
    for (const item of s.tastedItems ?? []) {
      for (const [f] of FOOD_FIELDS) {
        const n = toNum(item[f]);
        if (n != null) out.push(n);
      }
    }
  }
  return out;
}

export const avgFoodQuality = (surveys: StoredSurvey[]): number | null => mean(foodRatings(surveys));

// All food + service ratings for a single survey, as numbers.
export function surveyRatings(s: StoredSurvey): number[] {
  const out: number[] = [];
  for (const item of s.tastedItems ?? []) {
    for (const [f] of FOOD_FIELDS) {
      const n = toNum(item[f]);
      if (n != null) out.push(n);
    }
  }
  for (const [f] of SERVICE_FIELDS) {
    const n = toNum(s[f] as string);
    if (n != null) out.push(n);
  }
  return out;
}

// YYYY-MM-DD for `days` ago (or the epoch for "all time").
export const startDateFor = (days: number | null): string => {
  if (days == null) return '1970-01-01';
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
};
