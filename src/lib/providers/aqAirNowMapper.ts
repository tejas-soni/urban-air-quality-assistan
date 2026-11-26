/**
 * Normalizers for OpenAQ v3 monitor payloads and US EPA AirNow JSON feeds.
 */
import { pm25ToUsAqi } from '@/lib/aqi/bands';
import { asNum, asObj, asStr } from '@/lib/providers/jsonHelpers';
import type { AqiReading } from '@/lib/types';

function extractSensorRecords(results: readonly unknown[]): Record<string, unknown>[] {
  const records: Record<string, unknown>[] = [];
  for (const item of results) {
    const sensors = asObj(item)?.sensors;
    if (!Array.isArray(sensors)) continue;
    for (const entry of sensors) {
      const rec = asObj(entry);
      if (rec) records.push(rec);
    }
  }
  return records;
}

/** Normalizes OpenAQ v3 `/v3/locations` PM2.5 monitor responses. */
export function normalizeOpenAq(payload: unknown): Partial<AqiReading> | null {
  const results = asObj(payload)?.results;
  if (!Array.isArray(results)) return null;
  const sensors = extractSensorRecords(results);
  const pmSensor = sensors.find((row) => {
    const val = asNum(asObj(row.latest)?.value);
    return asObj(row.parameter)?.name === 'pm25' && val !== null;
  });
  const val = asNum(asObj(pmSensor?.latest)?.value);
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
