import { useCallback, useEffect, useState } from 'react';
import { ImageOff, Star } from 'lucide-react';
import { getSurveysSince } from './supabase';
import { mean, startDateFor, surveyRatings } from './stats';
import { useLang } from './i18n';
import type { StoredSurvey } from './types';

const RANGES: { key: string; days: number | null }[] = [
  { key: 'range.7', days: 7 },
  { key: 'range.30', days: 30 },
  { key: 'range.all', days: null },
];

const TIME_KEY: Record<string, string> = {
  Breakfast: 'time.breakfast',
  Lunch: 'time.lunch',
  Dinner: 'time.dinner',
};

const fmt = (n: number | null): string => (n == null ? '—' : n.toFixed(1));

export default function Summary() {
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
        setSurveys(await getSurveysSince(startDateFor(days)));
      } catch (err) {
        console.error('Error loading summary:', err);
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b-2 border-gray-100 pb-4 mb-2 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-[#2D2D2D] flex items-center gap-3">
            {t('summary.title')} <span className="text-4xl">📸</span>
          </h2>
          <p className="text-gray-500 mt-2 text-lg">{t('summary.subtitle')}</p>
        </div>
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
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-2xl text-sm font-bold border-2 border-red-200">
          {error}
        </div>
      )}

      {loading && !surveys && (
        <div className="py-20 text-center text-gray-400 font-bold">{t('dash.loading')}</div>
      )}

      {surveys && surveys.length === 0 && !loading && (
        <div className="py-20 text-center space-y-4">
          <div className="w-24 h-24 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto">
            <ImageOff className="w-12 h-12" />
          </div>
          <h3 className="text-2xl font-black text-[#2D2D2D]">{t('dash.emptyTitle')}</h3>
          <p className="text-gray-500 max-w-md mx-auto">{t('dash.emptyBody')}</p>
        </div>
      )}

      {surveys && surveys.length > 0 && (
        <div className="space-y-6">
          {surveys.map((s) => {
            const overall = mean(surveyRatings(s));
            const time = s.timeOfService ? t(TIME_KEY[s.timeOfService]) || s.timeOfService : '';
            const meta = [time, s.typeOfService].filter(Boolean).join(' · ');
            const items = s.tastedItems ?? [];
            return (
              <div key={s.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6 space-y-5">
                {/* Card header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-lg font-black text-[#2D2D2D] truncate">
                      {s.restaurant || t('dash.unspecified')}
                      {meta && <span className="text-gray-400 font-bold"> · {meta}</span>}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 truncate">
                      {s.date} · {s.name || t('dash.anonymous')}
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1 bg-[#FFF2F2] text-[#FF6B6B] font-black px-3 py-1.5 rounded-xl">
                    <Star className="w-4 h-4" /> {fmt(overall)}
                  </div>
                </div>

                {/* Dishes with photos */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {items.map((item, idx) => (
                    <div key={idx} className="space-y-2">
                      {item.imageUrl ? (
                        <a href={item.imageUrl} target="_blank" rel="noreferrer" className="block">
                          <img
                            src={item.imageUrl}
                            alt={item.itemName}
                            loading="lazy"
                            className="w-full h-28 md:h-32 object-cover rounded-2xl border border-gray-100 hover:opacity-90 transition"
                          />
                        </a>
                      ) : (
                        <div className="w-full h-28 md:h-32 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col items-center justify-center text-gray-300 gap-1">
                          <ImageOff className="w-6 h-6" />
                          <span className="text-[10px] font-bold">{t('summary.noPhoto')}</span>
                        </div>
                      )}
                      <div className="text-sm font-bold text-[#2D2D2D] truncate" title={item.itemName}>
                        {item.itemName || '—'}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Comment */}
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1">
                    {t('summary.comment')}
                  </div>
                  <div className="text-sm text-[#2D2D2D] whitespace-pre-wrap">
                    {s.comments?.trim() ? s.comments : <span className="text-gray-400 italic">{t('summary.noComment')}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
