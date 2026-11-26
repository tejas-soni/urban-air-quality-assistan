/**
 * Clean-room CADR metric readout cards and published/assumption provenance badges.
 */
import type { CadrSizingResult } from '@/lib/aqi/cadr';

/** Renders achieved ACH, 80% particulate clearance duration, and factor citations. */
export function CadrResultsGrid({ plan }: { plan: CadrSizingResult }) {
  return (
    <>
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
    </>
  );
}
