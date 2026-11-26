'use client';

import { Wind } from 'lucide-react';
import { useState } from 'react';
import { buildCadrSizingPlan } from '@/lib/aqi/cadr';

/** Interactive Room CADR & DIY Corsi-Rosenthal clearance calculator (4.8+ ACH target). */
export function IaqCadrCalculator() {
  const [areaSqM, setAreaSqM] = useState(22);
  const [heightM, setHeightM] = useState(2.8);
  const [mode, setMode] = useState<'diy-cr' | 'hepa'>('diy-cr');
  const plan = buildCadrSizingPlan(areaSqM, heightM, mode);

  return (
    <section
      aria-labelledby="cadr-calc-heading"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Wind className="h-5 w-5 text-sky-700" aria-hidden="true" />
          <h2 id="cadr-calc-heading" className="text-xl font-bold text-slate-900">
            Room CADR &amp; Clean-Room Calculator
          </h2>
        </div>
        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-900">
          ASHRAE 4.8 ACH Standard
        </span>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="cadr-area" className="block text-sm font-semibold text-slate-800">
            Room floor area (m²)
          </label>
          <input
            id="cadr-area"
            type="number"
            min={4}
            max={500}
            value={areaSqM}
            onChange={(e) => setAreaSqM(Number(e.target.value) || 22)}
            className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900"
          />
        </div>

        <div>
          <label htmlFor="cadr-height" className="block text-sm font-semibold text-slate-800">
            Ceiling height (m)
          </label>
          <input
            id="cadr-height"
            type="number"
            min={2}
            max={6}
            step={0.1}
            value={heightM}
            onChange={(e) => setHeightM(Number(e.target.value) || 2.8)}
            className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900"
          />
        </div>

        <div>
          <label htmlFor="cadr-mode" className="block text-sm font-semibold text-slate-800">
            Filtration method
          </label>
          <select
            id="cadr-mode"
            value={mode}
            onChange={(e) => setMode(e.target.value === 'hepa' ? 'hepa' : 'diy-cr')}
            className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900"
          >
            <option value="diy-cr">DIY Corsi-Rosenthal (4x MERV-13)</option>
            <option value="hepa">Commercial True HEPA H13</option>
          </select>
        </div>
      </div>

      <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-xs font-semibold text-slate-600">Room volume</div>
          <div className="text-lg font-bold text-slate-900">{plan.volumeM3} m³</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-xs font-semibold text-slate-600">Target CADR (4.8 ACH)</div>
          <div className="text-lg font-bold text-slate-900">{plan.requiredCadrM3h} m³/h</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-xs font-semibold text-slate-600">Achieved rate</div>
          <div className="text-lg font-bold text-sky-800">{plan.achievedAch} ACH</div>
        </div>
        <div className="rounded-xl bg-emerald-50 p-3">
          <div className="text-xs font-semibold text-emerald-900">80% PM2.5 drop</div>
          <div className="text-lg font-bold text-emerald-950">~{plan.clearanceMinutes80} min</div>
        </div>
      </div>

      <ul
        className="mt-4 flex flex-wrap gap-2 text-xs text-slate-700"
        aria-label="CADR factor sources"
      >
        {plan.provenance.map((p) => (
          <li key={p.label} className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1">
            <strong className="uppercase text-sky-900">[{p.kind}]</strong> {p.label} ({p.source})
          </li>
        ))}
      </ul>
    </section>
  );
}
