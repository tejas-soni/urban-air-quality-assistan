'use client';

/**
 * Thermal inversion warning banner and interactive atmospheric scenario selector.
 */
import { AlertTriangle, CloudFog, Sun } from 'lucide-react';
import { evaluateInversionRisk } from '@/lib/aqi/inversion';
import { SCENARIO_METEOROLOGY, type SmogScenario } from '@/lib/aqi/scenario';

export type { SmogScenario };

interface InversionBannerProps {
  aqi: number;
  scenario: SmogScenario;
  onScenarioChange: (scenario: SmogScenario) => void;
}

const SCENARIO_BUTTONS: readonly {
  id: SmogScenario;
  label: string;
  activeClass: string;
}[] = [
  { id: 'baseline', label: 'Live Baseline', activeClass: 'border-sky-700 bg-sky-700 text-white' },
  {
    id: 'spike',
    label: 'Simulate Winter Smog Spike',
    activeClass: 'border-rose-800 bg-rose-800 text-white',
  },
  {
    id: 'clear',
    label: 'Simulate Solar Dispersion',
    activeClass: 'border-emerald-800 bg-emerald-800 text-white',
  },
];

/** Displays thermal boundary-layer inversion status and accessible scenario toggle controls. */
export function InversionBanner({ aqi, scenario, onScenarioChange }: InversionBannerProps) {
  const met = SCENARIO_METEOROLOGY[scenario];
  const assessment = evaluateInversionRisk(met.ground, met.aloft, met.wind, aqi);
  const severe = assessment.severity === 'severe';
  const containerClass = severe ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-white';

  return (
    <section
      aria-labelledby="inversion-heading"
      className={`rounded-2xl border p-5 shadow-sm ${containerClass}`}
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
          {SCENARIO_BUTTONS.map(({ id, label, activeClass }) => {
            const pressed = scenario === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={pressed}
                onClick={() => onScenarioChange(id)}
                className={`inline-flex min-h-[44px] items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                  pressed
                    ? activeClass
                    : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                }`}
              >
                {id === 'clear' && <Sun className="h-3.5 w-3.5" aria-hidden="true" />}
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
