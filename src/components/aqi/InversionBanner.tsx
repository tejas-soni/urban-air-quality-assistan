'use client';

import { AlertTriangle, CloudFog, Sun } from 'lucide-react';
import { evaluateInversionRisk } from '@/lib/aqi/inversion';

export type SmogScenario = 'baseline' | 'spike' | 'clear';

interface InversionBannerProps {
  aqi: number;
  scenario: SmogScenario;
  onScenarioChange: (scenario: SmogScenario) => void;
}

const SCENARIO_MET: Record<SmogScenario, { ground: number; aloft: number; wind: number }> = {
  baseline: { ground: 9, aloft: 11.5, wind: 7 },
  spike: { ground: 5, aloft: 11.0, wind: 2.5 },
  clear: { ground: 15, aloft: 11.0, wind: 18 },
};

/** Displays thermal boundary-layer inversion status + accessible simulation controls. */
export function InversionBanner({ aqi, scenario, onScenarioChange }: InversionBannerProps) {
  const met = SCENARIO_MET[scenario];
  const assessment = evaluateInversionRisk(met.ground, met.aloft, met.wind, aqi);
  const severe = assessment.severity === 'severe';

  return (
    <section
      aria-labelledby="inversion-heading"
      className={`rounded-2xl border p-5 shadow-sm ${
        severe ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div role={severe ? 'alert' : 'status'} aria-live={severe ? 'assertive' : 'polite'}>
          <div className="flex items-center gap-2">
            {severe ? (
              <AlertTriangle className="h-5 w-5 text-rose-800" aria-hidden="true" />
            ) : (
              <CloudFog className="h-5 w-5 text-sky-700" aria-hidden="true" />
            )}
            <h2 id="inversion-heading" className="text-lg font-bold text-slate-900">
              {assessment.headline}
            </h2>
          </div>
          <p className="mt-1 text-sm text-slate-800">{assessment.guidance}</p>
          <p className="mt-1 text-xs font-semibold text-slate-700">
            Recommended airing window: {assessment.bestVentilationWindow}
          </p>
        </div>

        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Atmospheric scenario simulator"
        >
          <button
            type="button"
            aria-pressed={scenario === 'baseline'}
            onClick={() => onScenarioChange('baseline')}
            className={`min-h-[44px] rounded-xl border px-3 py-1.5 text-xs font-semibold ${
              scenario === 'baseline'
                ? 'border-sky-700 bg-sky-700 text-white'
                : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
            }`}
          >
            Live Baseline
          </button>
          <button
            type="button"
            aria-pressed={scenario === 'spike'}
            onClick={() => onScenarioChange('spike')}
            className={`min-h-[44px] rounded-xl border px-3 py-1.5 text-xs font-semibold ${
              scenario === 'spike'
                ? 'border-rose-800 bg-rose-800 text-white'
                : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
            }`}
          >
            Simulate Winter Smog Spike
          </button>
          <button
            type="button"
            aria-pressed={scenario === 'clear'}
            onClick={() => onScenarioChange('clear')}
            className={`inline-flex min-h-[44px] items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold ${
              scenario === 'clear'
                ? 'border-emerald-800 bg-emerald-800 text-white'
                : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Sun className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Simulate Solar Dispersion</span>
          </button>
        </div>
      </div>
    </section>
  );
}
