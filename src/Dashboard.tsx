import { useCallback, useEffect, useMemo, useState } from 'react';
import { LayoutDashboard, RefreshCw, Star, UtensilsCrossed } from 'lucide-react';
import { getSurveysSince } from './supabase';
import type { StoredSurvey, TastedItem } from './types';

const FOOD_FIELDS: [keyof TastedItem, string][] = [
  ['foodTaste', 'Food Taste'],
  ['qualityOfIngredients', 'Quality of Ingredients'],
  ['freshnessOfFood', 'Freshness of Food'],
  ['foodTemperature', 'Food Temperature'],
  ['foodPresentation', 'Food Presentation'],
];

const SERVICE_FIELDS: [keyof StoredSurvey, string][] = [
  ['promptnessOfService', 'Promptness of Service'],
  ['attentivenessAndCare', 'Attentiveness & Care'],
  ['cleanliness', 'Cleanliness'],
  ['value', 'Value for Money'],
];

type Range = { label: string; days: number | null };
const RANGES: Range[] = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'All time', days: null },
];

const toNum = (s: string): number | null => {
  const n = Number(s);
  return s !== '' && s != null && !Number.isNaN(n) ? n : null;
};

const mean = (xs: number[]): number | null => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

const fmt = (n: number | null): string => (n == null ? '—' : n.toFixed(1));

const startDateFor = (days: number | null): string => {
  if (days == null) return '1970-01-01';
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
};

// All food + service ratings for a single survey, as numbers.
const surveyRatings = (s: StoredSurvey): number[] => {
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
};

function ScoreBar({ label, value }: { label: string; value: number | null }) {
  const pct = value == null ? 0 : (value / 5) * 100;
  return (
    <div className="flex items-center gap-3" title={value == null ? 'No data' : `${value.toFixed(2)} / 5`}>
      <span className="w-40 md:w-48 shrink-0 text-sm font-bold text-gray-600">{label}</span>
      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#FF6B6B] rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-sm font-black text-[#2D2D2D]">{fmt(value)}</span>
    </div>
  );
}

function StatTile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6">
      <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">{label}</div>
      <div className="text-3xl md:text-4xl font-black text-[#2D2D2D] leading-none">{value}</div>
      <div className="text-xs md:text-sm text-gray-400 mt-2">{sub}</div>
    </div>
  );
}

export default function Dashboard() {
  const [rangeIdx, setRangeIdx] = useState(2); // default: All time
  const [surveys, setSurveys] = useState<StoredSurvey[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (days: number | null) => {
    setLoading(true);
    setError('');
    try {
      const data = await getSurveysSince(startDateFor(days));
      setSurveys(data);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Could not load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(RANGES[rangeIdx].days);
  }, [rangeIdx, load]);

  const stats = useMemo(() => {
    if (!surveys) return null;
    const foodByField = FOOD_FIELDS.map(([f, label]) => {
      const vals: number[] = [];
      for (const s of surveys) for (const item of s.tastedItems ?? []) {
        const n = toNum(item[f]);
        if (n != null) vals.push(n);
      }
      return { label, value: mean(vals) };
    });
    const serviceByField = SERVICE_FIELDS.map(([f, label]) => {
      const vals: number[] = [];
      for (const s of surveys) {
        const n = toNum(s[f] as string);
        if (n != null) vals.push(n);
      }
      return { label, value: mean(vals) };
    });

    const foodAll = foodByField.flatMap((c) => (c.value == null ? [] : [c.value]));
    const serviceAll = serviceByField.flatMap((c) => (c.value == null ? [] : [c.value]));

    const restaurants = new Map<string, { ratings: number[]; count: number }>();
    for (const s of surveys) {
      const key = s.restaurant || 'Unspecified';
      const entry = restaurants.get(key) ?? { ratings: [], count: 0 };
      entry.ratings.push(...surveyRatings(s));
      entry.count += 1;
      restaurants.set(key, entry);
    }
    const byRestaurant = [...restaurants.entries()]
      .map(([name, e]) => ({ name, avg: mean(e.ratings), count: e.count }))
      .sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0));

    const itemCount = surveys.reduce((acc, s) => acc + (s.tastedItems?.length ?? 0), 0);
    const recent = surveys.slice(0, 6);

    return {
      total: surveys.length,
      itemCount,
      foodByField,
      serviceByField,
      foodQuality: mean(foodAll),
      service: mean(serviceAll),
      overall: mean([...foodAll, ...serviceAll]),
      byRestaurant,
      recent,
    };
  }, [surveys]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b-2 border-gray-100 pb-4 mb-2 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-[#2D2D2D] flex items-center gap-3">
            Dashboard <span className="text-4xl">📊</span>
          </h2>
          <p className="text-gray-500 mt-2 text-lg">Live insights from submitted evaluations.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-2xl p-1">
            {RANGES.map((r, i) => (
              <button
                key={r.label}
                onClick={() => setRangeIdx(i)}
                className={`px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition ${
                  rangeIdx === i ? 'bg-white text-[#FF6B6B] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => load(RANGES[rangeIdx].days)}
            className="p-2.5 rounded-xl bg-gray-100 text-gray-500 hover:text-[#FF6B6B] transition"
            title="Refresh"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-2xl text-sm font-bold border-2 border-red-200">
          {error}
        </div>
      )}

      {loading && !stats && (
        <div className="py-20 text-center text-gray-400 font-bold">Loading insights…</div>
      )}

      {stats && stats.total === 0 && !loading && (
        <div className="py-20 text-center space-y-4">
          <div className="w-24 h-24 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto">
            <LayoutDashboard className="w-12 h-12" />
          </div>
          <h3 className="text-2xl font-black text-[#2D2D2D]">No evaluations yet</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Once evaluations are submitted for this period, their insights will appear here.
          </p>
        </div>
      )}

      {stats && stats.total > 0 && (
        <div className="space-y-8">
          {/* KPI tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <StatTile label="Evaluations" value={String(stats.total)} sub={`${stats.itemCount} dishes tasted`} />
            <StatTile label="Food Quality" value={`${fmt(stats.foodQuality)}`} sub="avg out of 5" />
            <StatTile label="Staff Service" value={`${fmt(stats.service)}`} sub="avg out of 5" />
            <StatTile label="Overall Score" value={`${fmt(stats.overall)}`} sub="avg out of 5" />
          </div>

          {/* Category breakdowns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6 space-y-4">
              <h3 className="font-black text-[#2D2D2D] flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-[#FF6B6B]" /> Food Quality
              </h3>
              <div className="space-y-3">
                {stats.foodByField.map((c) => (
                  <ScoreBar key={c.label} label={c.label} value={c.value} />
                ))}
              </div>
            </div>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6 space-y-4">
              <h3 className="font-black text-[#2D2D2D] flex items-center gap-2">
                <Star className="w-5 h-5 text-[#FF6B6B]" /> Staff Service
              </h3>
              <div className="space-y-3">
                {stats.serviceByField.map((c) => (
                  <ScoreBar key={c.label} label={c.label} value={c.value} />
                ))}
              </div>
            </div>
          </div>

          {/* By restaurant */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6 space-y-4">
            <h3 className="font-black text-[#2D2D2D]">Average by Restaurant</h3>
            <div className="space-y-3">
              {stats.byRestaurant.map((r) => (
                <ScoreBar key={r.name} label={`${r.name} (${r.count})`} value={r.avg} />
              ))}
            </div>
          </div>

          {/* Recent evaluations */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6">
            <h3 className="font-black text-[#2D2D2D] mb-4">Recent Evaluations</h3>
            <div className="divide-y divide-gray-100">
              {stats.recent.map((s) => {
                const avg = mean(surveyRatings(s));
                return (
                  <div key={s.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <div className="font-bold text-[#2D2D2D] truncate">{s.restaurant || 'Unspecified'}</div>
                      <div className="text-xs text-gray-400 truncate">
                        {s.date} · {s.name || 'Anonymous'} · {s.timeOfService || '—'}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1 bg-[#FFF2F2] text-[#FF6B6B] font-black px-3 py-1.5 rounded-xl">
                      <Star className="w-4 h-4" /> {fmt(avg)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
