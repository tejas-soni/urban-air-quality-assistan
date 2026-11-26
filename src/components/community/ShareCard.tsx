'use client';

/**
 * Printable and WhatsApp-shareable community action card with accessible clipboard feedback.
 */
import { useEffect, useRef, useState } from 'react';
import { SharePlanBody, ShareToolbar } from '@/components/community/ShareCardSections';
import type { CommunityActionPlan } from '@/lib/types';

/** Renders group smog alerts, collective CO2e savings, print button, and WhatsApp share link. */
export function ShareCard({ plan }: { plan: CommunityActionPlan }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(plan.whatsappSummary);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section
      aria-labelledby="share-plan-heading"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="share-plan-heading" className="text-2xl font-bold text-slate-900">
            {plan.groupName}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {plan.city} · Live AQI {plan.aqi} ({plan.bandLabel}) · {plan.households} households
          </p>
        </div>
        <ShareToolbar
          copied={copied}
          url={`https://wa.me/?text=${encodeURIComponent(plan.whatsappSummary)}`}
          onCopy={() => void handleCopy()}
        />
      </div>
      <SharePlanBody plan={plan} />
      <p className="mt-5 border-t border-slate-100 pt-3 text-xs text-slate-600">
        Sources: {plan.sources.join(' · ')}
      </p>
    </section>
  );
}
