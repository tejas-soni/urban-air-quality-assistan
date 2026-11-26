'use client';

/**
 * Toolbar and collective metrics sub-views for printable and WhatsApp community cards.
 */
import { Check, Copy, Printer, Share2 } from 'lucide-react';
import type { CommunityActionPlan } from '@/lib/types';

/** Renders copy-summary, WhatsApp share link, and print action buttons. */
export function ShareToolbar({
  copied,
  url,
  onCopy,
}: {
  copied: boolean;
  url: string;
  onCopy: () => void;
}) {
  return (
    <div className="no-print flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onCopy}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
      >
        {copied ? (
          <Check className="h-4 w-4 text-emerald-700" aria-hidden="true" />
        ) : (
          <Copy className="h-4 w-4" aria-hidden="true" />
        )}
        <span>{copied ? 'Copied Summary' : 'Copy Summary'}</span>
      </button>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
      >
        <Share2 className="h-4 w-4" aria-hidden="true" />
        <span>Share on WhatsApp</span>
      </a>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
      >
        <Printer className="h-4 w-4" aria-hidden="true" />
        <span>Print Card</span>
      </button>
    </div>
  );
}

/** Renders group savings metrics, threshold alerts, and collective action checklist. */
export function SharePlanBody({ plan }: { plan: CommunityActionPlan }) {
  return (
    <>
      <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-emerald-50 p-4">
          <dt className="text-xs font-semibold text-emerald-900">Daily CO2e Saved</dt>
          <dd className="mt-1 text-2xl font-bold text-emerald-950">{plan.co2SavedKgDay} kg/day</dd>
        </div>
        <div className="rounded-xl bg-sky-50 p-4">
          <dt className="text-xs font-semibold text-sky-900">Car Trips Replaced</dt>
          <dd className="mt-1 text-2xl font-bold text-sky-950">
            {plan.carTripsReplaced} trips/day
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <dt className="text-xs font-semibold text-slate-700">Estimated PM2.5 Impact</dt>
          <dd className="mt-1 text-base font-bold text-slate-900">{plan.pm25DropEstimate}</dd>
        </div>
      </dl>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
            Alert Threshold Triggers
          </h3>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-base text-slate-800">
            {plan.triggers.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
            Group Action Checklist
          </h3>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-base text-slate-800">
            {plan.checklist.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
