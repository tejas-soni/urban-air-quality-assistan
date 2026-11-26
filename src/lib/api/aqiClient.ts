/**
 * Shared typed client-side AQI API fetcher validating JSON responses against AqiReadingSchema.
 */
import { isAbortError } from '@/lib/logger';
import { AqiReadingSchema } from '@/lib/schemas';
import type { AqiReading } from '@/lib/types';

export type AqiFetchResult =
  { ok: true; data: AqiReading } | { ok: false; aborted: boolean; error: string };

/** Fetches `/api/aqi` with Zod runtime validation, abort tracking, and readable error messages. */
export async function fetchCityAqiClient(
  city: string,
  signal?: AbortSignal,
): Promise<AqiFetchResult> {
  try {
    const res = await fetch(`/api/aqi?city=${encodeURIComponent(city)}`, { signal });
    if (!res.ok) {
      return { ok: false, aborted: false, error: `Unable to load AQI (HTTP ${res.status})` };
    }
    const raw: unknown = await res.json();
    const parsed = AqiReadingSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, aborted: false, error: 'Received malformed AQI response payload' };
    }
    return { ok: true, data: parsed.data };
  } catch (err) {
    if (isAbortError(err)) {
      return { ok: false, aborted: true, error: '' };
    }
    return { ok: false, aborted: false, error: 'Network unavailable; showing cached AQI values.' };
  }
}
