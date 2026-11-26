import { CheckCircle2, FileText } from 'lucide-react';
import type { RoutineRecommendation } from '@/lib/types';

interface RoutineCardProps {
  routine: RoutineRecommendation;
}

export function RoutineCard({ routine }: RoutineCardProps) {
  return (
    <article className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">
            {routine.windowLabel}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            {routine.priority} priority
          </span>
        </div>

        <h3 className="mt-3 text-lg font-bold text-slate-900">{routine.title}</h3>
        <p className="mt-2 text-base text-slate-700">{routine.action}</p>
      </div>

      <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
        <div className="flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-950">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
          <div>
            <p className="font-semibold">{routine.impact.headline}</p>
            <p className="mt-0.5 text-xs text-emerald-900">{routine.impact.detail}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <FileText className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden="true" />
          <span>Source: {routine.sourceCitation}</span>
        </div>
      </div>
    </article>
  );
}
