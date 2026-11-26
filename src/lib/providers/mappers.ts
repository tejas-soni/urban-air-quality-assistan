import { asNum, asObj, asStr } from '@/lib/providers/jsonHelpers';
import type { AqiReading } from '@/lib/types';

export { normalizeOpenWeather } from '@/lib/providers/openWeatherMapper';
export { normalizeOpenAq, normalizeAirNow } from '@/lib/providers/aqAirNowMapper';

function readCoordinates(coords: unknown): { lon?: number; lat?: number } {
  if (!Array.isArray(coords)) return {};
  return {
    lon: asNum(coords[0]) ?? undefined,
    lat: asNum(coords[1]) ?? undefined,
  };
}

/** Normalizes an IQAir AirVisual `/v2/city` or `/v2/nearest_city` payload. */
export function normalizeIqAir(payload: unknown): Partial<AqiReading> | null {
  const root = asObj(payload);
  const data = root ? asObj(root.data) : null;
  if (!data) return null;

  const current = asObj(data.current);
  const pollution = current ? asObj(current.pollution) : null;
  const aqius = asNum(pollution?.aqius);
  if (aqius === null) return null;

  const location = asObj(data.location);
  const { lon, lat } = readCoordinates(location?.coordinates);
  return {
    city: asStr(data.city),
    country: asStr(data.country),
    lon,
    lat,
    aqi: Math.round(aqius),
  };
}
