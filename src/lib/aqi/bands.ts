/**
 * US EPA 2024 PM2.5-to-AQI breakpoints and WHO 2021 guideline comparison functions.
 */
import { BAND_META } from '@/lib/aqi/bandData';
import type { AqiBand, AqiBandInfo, Persona } from '@/lib/types';

export const WHO_PM25_24H_GUIDELINE = 15;
export const WHO_PM25_ANNUAL_GUIDELINE = 5;

const PM25_BREAKPOINTS: readonly [number, number, number, number][] = [
  [0, 9.0, 0, 50],
  [9.1, 35.4, 51, 100],
  [35.5, 55.4, 101, 150],
  [55.5, 125.4, 151, 200],
  [125.5, 225.4, 201, 300],
  [225.5, 500.4, 301, 500],
];

const BAND_THRESHOLDS: readonly { max: number; band: AqiBand }[] = [
  { max: 50, band: 'good' },
  { max: 100, band: 'moderate' },
  { max: 150, band: 'usg' },
  { max: 200, band: 'unhealthy' },
  { max: 300, band: 'very-unhealthy' },
];

const ELEVATED_ADVICE: Record<Persona, string> = {
  family: '',
  commuter: 'Shift departure post-peak and wear N95 or use cabin recirculation.',
  community: 'Trigger school/group indoor clean-air protocol and no-idling pledge.',
};

/** Converts 24-hour PM2.5 (µg/m³) into US EPA AQI (0–500) using 2024 breakpoints. */
export function pm25ToUsAqi(pm25: number): number {
  const safe = Number.isFinite(pm25) ? Math.max(0, pm25) : 0;
  const clamped = Math.min(500.4, Math.floor(safe * 10) / 10);
  for (const [cLow, cHigh, iLow, iHigh] of PM25_BREAKPOINTS) {
    if (clamped <= cHigh) {
      return Math.round(((iHigh - iLow) / (cHigh - cLow)) * (clamped - cLow) + iLow);
    }
  }
  return 500;
}

/** Maps a numeric AQI (0–500+) to a WCAG-AA light-mode badge descriptor with text and icon. */
export function classifyAqi(aqi: number): AqiBandInfo {
  const safe = Number.isFinite(aqi) ? Math.max(0, aqi) : 0;
  const hit = BAND_THRESHOLDS.find((t) => safe <= t.max);
  return BAND_META[hit ? hit.band : 'hazardous'];
}

/** Returns how many multiples of the WHO 24h PM2.5 guideline (15 µg/m³) a reading represents. */
export function whoGuidelineRatio(pm25: number): number {
  const safe = Number.isFinite(pm25) ? Math.max(0, pm25) : 0;
  return Math.round((safe / WHO_PM25_24H_GUIDELINE) * 10) / 10;
}

/** Generates a concise persona-specific headline summary for a given AQI band. */
export function aqiHealthSummary(band: AqiBand, persona: Persona): string {
  const meta = BAND_META[band];
  const extra = meta.severity >= 3 ? ELEVATED_ADVICE[persona] : '';
  return `${meta.label}: ${extra || meta.guidance}`;
}
