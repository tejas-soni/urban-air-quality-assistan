'use client';

/**
 * Interactive Room CADR & DIY Corsi-Rosenthal mass-balance clearance calculator (4.8+ ACH standard).
 */
import { Wind } from 'lucide-react';
import { useState } from 'react';
import { CadrResultsGrid } from '@/components/aqi/CadrResults';
import { buildCadrSizingPlan } from '@/lib/aqi/cadr';

interface CadrInputsProps {
  areaSqM: number;
  heightM: number;
  mode: 'diy-cr' | 'hepa';
  onArea: (val: number) => void;
  onHeight: (val: number) => void;
  onMode: (val: 'diy-cr' | 'hepa') => void;
}

function CadrInputs({ areaSqM, heightM, mode, onArea, onHeight, onMode }: CadrInputsProps) {
  return (
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
          onChange={(e) => onArea(Number(e.target.value) || 22)}
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
          onChange={(e) => onHeight(Number(e.target.value) || 2.8)}
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
          onChange={(e) => onMode(e.target.value === 'hepa' ? 'hepa' : 'diy-cr')}
          className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900"
        >
          <option value="diy-cr">DIY Corsi-Rosenthal (4x MERV-13)</option>
          <option value="hepa">Commercial True HEPA H13</option>
        </select>
      </div>
    </div>
  );
}

/** Interactive Room CADR and clean-room clearance duration calculator. */
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

      <CadrInputs
        areaSqM={areaSqM}
        heightM={heightM}
        mode={mode}
        onArea={setAreaSqM}
        onHeight={setHeightM}
        onMode={setMode}
      />
      <CadrResultsGrid plan={plan} />
    </section>
  );
}
