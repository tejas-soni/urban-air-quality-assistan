import { pm25ToUsAqi } from '@/lib/aqi/bands';
import { asNum, asObj, asStr } from '@/lib/providers/jsonHelpers';
import type { AqiReading } from '@/lib/types';

/** Normalizes OpenAQ v3 `/v3/locations` PM2.5 monitor responses. */
export function normalizeOpenAq(payload: unknown): Partial<AqiReading> | null {
  const results = asObj(payload)?.results;
  if (!Array.isArray(results)) return null;
  const sensors = results.flatMap((r) => {
    const s = asObj(r)?.sensors;
    return Array.isArray(s) ? s : [];
  });
  const pmSensor = sensors.find((s) => {
    const row = asObj(s);
    const val = asNum(asObj(row?.latest)?.value);
    return asObj(row?.parameter)?.name === 'pm25' && val !== null;
  });
  const val = asNum(asObj(asObj(pmSensor)?.latest)?.value);
  if (val === null || val < 0) return null;
  return {
    aqi: pm25ToUsAqi(val),
    pollutants: { pm25: Math.round(val * 10) / 10, pm10: null, o3: null, no2: null },
  };
}

/** Normalizes US EPA AirNow current observation JSON array. */
export function normalizeAirNow(payload: unknown): Partial<AqiReading> | null {
  if (!Array.isArray(payload) || payload.length === 0) return null;
  const rows = payload.map(asObj).filter((r): r is Record<string, unknown> => r !== null);
  const pmRow = rows.find((r) => r.ParameterName === 'PM2.5') ?? rows[0];
  const aqi = asNum(pmRow?.AQI);
  if (aqi === null) return null;

  return {
    city: asStr(pmRow?.ReportingArea),
    aqi: Math.round(aqi),
  };
}
