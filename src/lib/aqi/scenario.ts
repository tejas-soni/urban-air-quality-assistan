/**
 * Pure atmospheric scenario simulator transforming baseline AQI telemetry for spike/dispersion views.
 */
import { classifyAqi, pm25ToUsAqi, whoGuidelineRatio } from '@/lib/aqi/bands';
import { build24hForecast } from '@/lib/aqi/baseline';
import type { AqiReading } from '@/lib/types';

export type SmogScenario = 'baseline' | 'spike' | 'clear';

export const SCENARIO_METEOROLOGY: Record<
  SmogScenario,
  { ground: number; aloft: number; wind: number }
> = {
  baseline: { ground: 9, aloft: 11.5, wind: 7 },
  spike: { ground: 5, aloft: 11.0, wind: 2.5 },
  clear: { ground: 15, aloft: 11.0, wind: 18 },
};

const SCENARIO_PARAMS: Record<
  Exclude<SmogScenario, 'baseline'>,
  { delta: number; factor: number; note: string }
> = {
  spike: {
    delta: 120,
    factor: 1.55,
    note: 'Simulated severe winter temperature inversion (+120 AQI)',
  },
  clear: {
    delta: -45,
    factor: 0.65,
    note: 'Simulated afternoon solar dispersion (-45 AQI)',
  },
};

/** Applies an atmospheric smog spike or dispersion scenario onto a baseline AqiReading cleanly. */
export function applySmogScenario(base: AqiReading, scenario: SmogScenario): AqiReading {
  if (scenario === 'baseline') return base;
  const spec = SCENARIO_PARAMS[scenario];
  const pm25 = Math.max(5, Math.round(base.pollutants.pm25 * spec.factor * 10) / 10);
  const aqi = Math.max(20, Math.min(500, Math.max(pm25ToUsAqi(pm25), base.aqi + spec.delta)));
  return {
    ...base,
    aqi,
    band: classifyAqi(aqi).band,
    pollutants: { ...base.pollutants, pm25 },
    whoRatio: whoGuidelineRatio(pm25),
    forecast24h: build24hForecast(pm25),
    note: spec.note,
  };
}
