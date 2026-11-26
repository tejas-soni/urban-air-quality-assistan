import { MapPin, RefreshCw } from 'lucide-react';
import { AqiBadge } from '@/components/aqi/AqiBadge';
import { classifyAqi } from '@/lib/aqi/bands';
import type { AqiReading } from '@/lib/types';

interface AqiCardProps {
  reading: AqiReading;
  onRefresh?: () => void;
}

export function AqiCard({ reading, onRefresh }: AqiCardProps) {
  const band = classifyAqi(reading.aqi);

  return (
    <section
      aria-labelledby="live-aqi-heading"
      aria-live="polite"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <MapPin className="h-4 w-4 text-sky-600" aria-hidden="true" />
            <span>
              {reading.city}
              {reading.country ? `, ${reading.country}` : ''}
            </span>
          </div>
          <h2 id="live-aqi-heading" className="mt-1 text-4xl font-bold text-slate-900">
            AQI {reading.aqi}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AqiBadge aqi={reading.aqi} />
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              aria-label="Refresh air quality data"
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              <span>Refresh</span>
            </button>
          )}
        </div>
      </div>

      <p className="mt-3 text-base text-slate-700">{band.guidance}</p>

      <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-slate-50 p-3">
          <dt className="text-xs font-medium text-slate-600">PM2.5</dt>
          <dd className="mt-1 text-lg font-bold text-slate-900">{reading.pollutants.pm25} µg/m³</dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <dt className="text-xs font-medium text-slate-600">vs WHO 24h (15 µg/m³)</dt>
          <dd className="mt-1 text-lg font-bold text-slate-900">{reading.whoRatio}x limit</dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <dt className="text-xs font-medium text-slate-600">PM10 / NO2</dt>
          <dd className="mt-1 text-lg font-bold text-slate-900">
            {reading.pollutants.pm10 ?? '—'} / {reading.pollutants.no2 ?? '—'}
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <dt className="text-xs font-medium text-slate-600">Source &amp; Cache</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-900">
            {reading.providersUsed.join(' + ')} {reading.cached ? '(cached)' : '(fresh)'}
          </dd>
        </div>
      </dl>

      <p className="mt-3 text-xs text-slate-600">{reading.note}</p>
    </section>
  );
}
