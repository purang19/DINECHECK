import { useCallback, useEffect, useMemo, useState } from 'react';
import { LayoutDashboard, RefreshCw, Star, UtensilsCrossed } from 'lucide-react';
import { getSurveysSince } from './supabase';
import { FOOD_FIELDS, RATING_LABEL_KEY, SERVICE_FIELDS, mean, startDateFor, surveyRatings, toNum } from './stats';
import { useLang } from './i18n';
import type { StoredSurvey } from './types';

const RANGES: { key: string; days: number | null }[] = [
  { key: 'range.7', days: 7 },
  { key: 'range.30', days: 30 },
  { key: 'range.all', days: null },
];

// Stored (English) time-of-service value → i18n key, for display only.
const TIME_KEY: Record<string, string> = {
  Breakfast: 'time.breakfast',
  Lunch: 'time.lunch',
  Dinner: 'time.dinner',
};

const fmt = (n: number | null): string => (n == null ? '—' : n.toFixed(1));

function ScoreBar({ label, value }: { label: string; value: number | null }) {
  const pct = value == null ? 0 : (value / 5) * 100;
  return (
    <div className="flex items-center gap-3" title={value == null ? '' : `${value.toFixed(2)} / 5`}>
      <span className="w-40 md:w-48 shrink-0 text-sm font-bold text-gray-600">{label}</span>
      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-[#FF6B6B] rounded-full transition-all" style={{ width: `${pct}%` }} />
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
  const { t } = useLang();
  const [rangeIdx, setRangeIdx] = useState(2); // default: All time
  const [surveys, setSurveys] = useState<StoredSurvey[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(
    async (days: number | null) => {
      setLoading(true);
      setError('');
      try {
        const data = await getSurveysSince(startDateFor(days));
        setSurveys(data);
      } catch (err) {
        console.error('Error loading dashboard:', err);
        setError(t('dash.errLoad'));
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    load(RANGES[rangeIdx].days);
  }, [rangeIdx, load]);

  const stats = useMemo(() => {
    if (!surveys) return null;
    const foodByField = FOOD_FIELDS.map((f) => {
      const vals: number[] = [];
      for (const s of surveys) for (const item of s.tastedItems ?? []) {
        const n = toNum(item[f]);
        if (n != null) vals.push(n);
      }
      return { field: f as string, value: mean(vals) };
    });
    const serviceByField = SERVICE_FIELDS.map((f) => {
      const vals: number[] = [];
      for (const s of surveys) {
        const n = toNum(s[f] as string);
        if (n != null) vals.push(n);
      }
      return { field: f as string, value: mean(vals) };
    });

    const foodAll = foodByField.flatMap((c) => (c.value == null ? [] : [c.value]));
    const serviceAll = serviceByField.flatMap((c) => (c.value == null ? [] : [c.value]));

    // Average score grouped by a chosen key (hotel or outlet).
    const groupAvg = (keyOf: (s: StoredSurvey) => string) => {
      const groups = new Map<string, { ratings: number[]; count: number }>();
      for (const s of surveys) {
        const key = keyOf(s) || '';
        const entry = groups.get(key) ?? { ratings: [], count: 0 };
        entry.ratings.push(...surveyRatings(s));
        entry.count += 1;
        groups.set(key, entry);
      }
      return [...groups.entries()]
        .map(([name, e]) => ({ name, avg: mean(e.ratings), count: e.count }))
        .sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0));
    };
    const byHotel = groupAvg((s) => s.hotel);
    const byRestaurant = groupAvg((s) => s.restaurant);

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
      byHotel,
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
            {t('dash.title')} <span className="text-4xl">📊</span>
          </h2>
          <p className="text-gray-500 mt-2 text-lg">{t('dash.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-2xl p-1">
            {RANGES.map((r, i) => (
              <button
                key={r.key}
                onClick={() => setRangeIdx(i)}
                className={`px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition ${
                  rangeIdx === i ? 'bg-white text-[#FF6B6B] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t(r.key)}
              </button>
            ))}
          </div>
          <button
            onClick={() => load(RANGES[rangeIdx].days)}
            className="p-2.5 rounded-xl bg-gray-100 text-gray-500 hover:text-[#FF6B6B] transition"
            title={t('dash.refresh')}
            aria-label={t('dash.refresh')}
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
        <div className="py-20 text-center text-gray-400 font-bold">{t('dash.loading')}</div>
      )}

      {stats && stats.total === 0 && !loading && (
        <div className="py-20 text-center space-y-4">
          <div className="w-24 h-24 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto">
            <LayoutDashboard className="w-12 h-12" />
          </div>
          <h3 className="text-2xl font-black text-[#2D2D2D]">{t('dash.emptyTitle')}</h3>
          <p className="text-gray-500 max-w-md mx-auto">{t('dash.emptyBody')}</p>
        </div>
      )}

      {stats && stats.total > 0 && (
        <div className="space-y-8">
          {/* KPI tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <StatTile
              label={t('kpi.evaluations')}
              value={String(stats.total)}
              sub={t('kpi.dishes', { n: stats.itemCount })}
            />
            <StatTile label={t('kpi.foodQuality')} value={fmt(stats.foodQuality)} sub={t('kpi.avgOutOf5')} />
            <StatTile label={t('kpi.service')} value={fmt(stats.service)} sub={t('kpi.avgOutOf5')} />
            <StatTile label={t('kpi.overall')} value={fmt(stats.overall)} sub={t('kpi.avgOutOf5')} />
          </div>

          {/* Category breakdowns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6 space-y-4">
              <h3 className="font-black text-[#2D2D2D] flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-[#FF6B6B]" /> {t('kpi.foodQuality')}
              </h3>
              <div className="space-y-3">
                {stats.foodByField.map((c) => (
                  <ScoreBar key={c.field} label={t(RATING_LABEL_KEY[c.field])} value={c.value} />
                ))}
              </div>
            </div>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6 space-y-4">
              <h3 className="font-black text-[#2D2D2D] flex items-center gap-2">
                <Star className="w-5 h-5 text-[#FF6B6B]" /> {t('kpi.service')}
              </h3>
              <div className="space-y-3">
                {stats.serviceByField.map((c) => (
                  <ScoreBar key={c.field} label={t(RATING_LABEL_KEY[c.field])} value={c.value} />
                ))}
              </div>
            </div>
          </div>

          {/* By hotel */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6 space-y-4">
            <h3 className="font-black text-[#2D2D2D]">{t('dash.byHotel')}</h3>
            <div className="space-y-3">
              {stats.byHotel.map((r) => (
                <ScoreBar
                  key={r.name || 'unspecified'}
                  label={`${r.name || t('dash.unspecified')} (${r.count})`}
                  value={r.avg}
                />
              ))}
            </div>
          </div>

          {/* By outlet */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6 space-y-4">
            <h3 className="font-black text-[#2D2D2D]">{t('dash.byRestaurant')}</h3>
            <div className="space-y-3">
              {stats.byRestaurant.map((r) => (
                <ScoreBar
                  key={r.name || 'unspecified'}
                  label={`${r.name || t('dash.unspecified')} (${r.count})`}
                  value={r.avg}
                />
              ))}
            </div>
          </div>

          {/* Recent evaluations */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6">
            <h3 className="font-black text-[#2D2D2D] mb-4">{t('dash.recent')}</h3>
            <div className="divide-y divide-gray-100">
              {stats.recent.map((s) => {
                const avg = mean(surveyRatings(s));
                const time = s.timeOfService ? t(TIME_KEY[s.timeOfService]) || s.timeOfService : '—';
                return (
                  <div key={s.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <div className="font-bold text-[#2D2D2D] truncate">
                        {s.restaurant || t('dash.unspecified')}
                      </div>
                      <div className="text-xs text-gray-400 truncate">
                        {s.date} · {s.name || t('dash.anonymous')} · {time}
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
