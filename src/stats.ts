import type { StoredSurvey } from './types';

// Rating data fields shared by the dashboard and the sidebar insight card.
// Narrowed to the five metric keys (excludes optional fields like imageUrl).
export type FoodMetric =
  | 'foodTaste'
  | 'qualityOfIngredients'
  | 'freshnessOfFood'
  | 'foodTemperature'
  | 'foodPresentation';

export const FOOD_FIELDS: FoodMetric[] = [
  'foodTaste',
  'qualityOfIngredients',
  'freshnessOfFood',
  'foodTemperature',
  'foodPresentation',
];

export type BeverageMetric = 'drinkQuality' | 'drinkFlavorBalance' | 'responseTime';

export const BEVERAGE_FIELDS: BeverageMetric[] = ['drinkQuality', 'drinkFlavorBalance', 'responseTime'];

export const SERVICE_FIELDS: (keyof StoredSurvey)[] = [
  'promptnessOfService',
  'attentivenessAndCare',
  'cleanliness',
  'value',
];

// Maps each rating field to its i18n key (labels are translated at render time).
export const RATING_LABEL_KEY: Record<string, string> = {
  foodTaste: 'rating.foodTaste',
  qualityOfIngredients: 'rating.qualityOfIngredients',
  freshnessOfFood: 'rating.freshnessOfFood',
  foodTemperature: 'rating.foodTemperature',
  foodPresentation: 'rating.foodPresentation',
  drinkQuality: 'rating.drinkQuality',
  drinkFlavorBalance: 'rating.drinkFlavorBalance',
  responseTime: 'rating.responseTime',
  promptnessOfService: 'rating.promptness',
  attentivenessAndCare: 'rating.attentiveness',
  cleanliness: 'rating.cleanliness',
  value: 'rating.value',
};

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
      for (const f of FOOD_FIELDS) {
        const n = toNum(item[f]);
        if (n != null) out.push(n);
      }
    }
  }
  return out;
}

export const avgFoodQuality = (surveys: StoredSurvey[]): number | null => mean(foodRatings(surveys));

// Every beverage rating (all metrics, all beverage items) across the surveys.
export function beverageRatings(surveys: StoredSurvey[]): number[] {
  const out: number[] = [];
  for (const s of surveys) {
    for (const item of s.beverageItems ?? []) {
      for (const f of BEVERAGE_FIELDS) {
        const n = toNum(item[f]);
        if (n != null) out.push(n);
      }
    }
  }
  return out;
}

// All food + beverage + service ratings for a single survey, as numbers.
export function surveyRatings(s: StoredSurvey): number[] {
  const out: number[] = [];
  for (const item of s.tastedItems ?? []) {
    for (const f of FOOD_FIELDS) {
      const n = toNum(item[f]);
      if (n != null) out.push(n);
    }
  }
  for (const item of s.beverageItems ?? []) {
    for (const f of BEVERAGE_FIELDS) {
      const n = toNum(item[f]);
      if (n != null) out.push(n);
    }
  }
  for (const f of SERVICE_FIELDS) {
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
