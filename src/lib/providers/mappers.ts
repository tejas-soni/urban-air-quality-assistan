import { asNum, asObj, asStr } from '@/lib/providers/jsonHelpers';
import type { AqiReading } from '@/lib/types';

export { normalizeOpenWeather } from '@/lib/providers/openWeatherMapper';
export { normalizeOpenAq, normalizeAirNow } from '@/lib/providers/aqAirNowMapper';

/** Normalizes an IQAir AirVisual `/v2/city` or `/v2/nearest_city` payload. */
export function normalizeIqAir(payload: unknown): Partial<AqiReading> | null {
  const data = asObj(asObj(payload)?.data);
  const aqius = asNum(asObj(asObj(data?.current)?.pollution)?.aqius);
  if (aqius === null) return null;

  const coords = asObj(data?.location)?.coordinates;
  const pair = Array.isArray(coords) ? coords : [];
  return {
    city: asStr(data?.city),
    country: asStr(data?.country),
    lon: asNum(pair[0]) ?? undefined,
    lat: asNum(pair[1]) ?? undefined,
    aqi: Math.round(aqius),
  };
}
