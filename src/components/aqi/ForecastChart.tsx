import { classifyAqi } from '@/lib/aqi/bands';
import type { AqiReading } from '@/lib/types';

interface ForecastChartProps {
  reading: AqiReading;
}

export function ForecastChart({ reading }: ForecastChartProps) {
  const maxAqi = Math.max(100, ...reading.forecast24h.map((p) => p.aqi));
  const lowest = reading.forecast24h.find((p) => p.isLowestWindow);

  return (
    <section
      aria-labelledby="forecast-heading"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="forecast-heading" className="text-xl font-bold text-slate-900">
          24-Hour Winter Smog Profile
        </h2>
        {lowest && (
          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">
            Lowest outdoor window: {lowest.hourLabel} (AQI {lowest.aqi})
          </span>
        )}
      </div>

      <p className="mt-1 text-sm text-slate-600">
        Afternoon warming breaks morning temperature inversions around 14:00, lowering outdoor PM2.5.
      </p>

      <div className="mt-5">
        <svg
          role="img"
          aria-label={`24-hour AQI profile for ${reading.city}. Lowest window at ${lowest?.hourLabel ?? '14:00'} with AQI ${lowest?.aqi ?? reading.aqi}.`}
          viewBox="0 0 640 180"
          className="h-44 w-full"
        >
          {reading.forecast24h.map((pt, idx) => {
            const barH = Math.max(12, Math.round((pt.aqi / maxAqi) * 115));
            const x = 16 + idx * 78;
            const y = 140 - barH;
            const band = classifyAqi(pt.aqi);
            return (
              <g key={pt.hourLabel}>
                <rect
                  x={x}
                  y={y}
                  width={54}
                  height={barH}
                  rx={8}
                  fill={pt.isLowestWindow ? '#0284C7' : band.hexAccent}
                  opacity={pt.isLowestWindow ? 1 : 0.82}
                />
                <text
                  x={x + 27}
                  y={y - 6}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="700"
                  fill="#0F172A"
                >
                  {pt.aqi}
                </text>
                <text
                  x={x + 27}
                  y={164}
                  textAnchor="middle"
                  fontSize="12"
                  fill={pt.isLowestWindow ? '#0369A1' : '#475569'}
                  fontWeight={pt.isLowestWindow ? '700' : '500'}
                >
                  {pt.hourLabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <h3 className="mt-6 text-sm font-bold uppercase tracking-wide text-slate-600">
        5-Day Outlook
      </h3>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {reading.forecast5d.map((day) => (
          <div key={day.dayLabel} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="text-xs font-semibold text-slate-600">{day.dayLabel}</div>
            <div className="mt-1 text-base font-bold text-slate-900">
              {day.minAqi}–{day.maxAqi} AQI
            </div>
            <div className="text-xs text-slate-600">~{day.avgPm25} µg/m³</div>
          </div>
        ))}
      </div>
    </section>
  );
}
