import { pm25ToUsAqi } from '@/lib/aqi/bands';
import { asNum, asObj } from '@/lib/providers/jsonHelpers';
import type { AqiReading } from '@/lib/types';

function buildOpenWeatherDaily(items: unknown[]): AqiReading['forecast5d'] {
  const buckets = new Map<string, number[]>();
  for (const raw of items.slice(0, 120)) {
    const row = asObj(raw);
    const dt = asNum(row?.dt);
    const pm25 = asNum(asObj(row?.components)?.pm2_5);
    if (dt === null || pm25 === null) continue;
    const key = new Date(dt * 1000).toISOString().slice(0, 10);
    buckets.set(key, [...(buckets.get(key) ?? []), pm25]);
  }
  return Array.from(buckets.entries())
    .slice(0, 5)
    .map(([dayLabel, vals], idx) => {
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      return {
        dayLabel: idx === 0 ? 'Today' : dayLabel.slice(5),
        avgPm25: Math.round(avg * 10) / 10,
        minAqi: pm25ToUsAqi(Math.min(...vals)),
        maxAqi: pm25ToUsAqi(Math.max(...vals)),
      };
    });
}

/** Normalizes OpenWeather Air Pollution API (current + 5-day forecast) payloads. */
export function normalizeOpenWeather(
  currentPayload: unknown,
  forecastPayload?: unknown,
): Partial<AqiReading> | null {
  const list = asObj(currentPayload)?.list;
  const first = Array.isArray(list) ? asObj(list[0]) : null;
  const components = asObj(first?.components);
  const pm25 = asNum(components?.pm2_5);
  if (pm25 === null) return null;

  const fcList = asObj(forecastPayload)?.list;
  const forecast5d = Array.isArray(fcList) ? buildOpenWeatherDaily(fcList) : [];

  return {
    aqi: pm25ToUsAqi(pm25),
    pollutants: {
      pm25: Math.round(pm25 * 10) / 10,
      pm10: asNum(components?.pm10),
      o3: asNum(components?.o3),
      no2: asNum(components?.no2),
    },
    ...(forecast5d.length > 0 ? { forecast5d } : {}),
  };
}
