'use client';

/**
 * Persona quick-launch cards linking households, commuters, and community groups to tailored views.
 */
import Link from 'next/link';
import { ArrowRight, Car, Home, Users } from 'lucide-react';
import { PERSONA_CARD_SPECS } from '@/lib/persona/presets';
import type { Persona } from '@/lib/types';

const ICONS: Record<Persona, typeof Home> = {
  family: Home,
  commuter: Car,
  community: Users,
};

interface PersonaCardGridProps {
  onSelectPersona: (persona: Persona) => void;
}

/** Renders accessible persona launcher cards grounded in quantified air-quality benefits. */
export function PersonaCardGrid({ onSelectPersona }: PersonaCardGridProps) {
  return (
    <section aria-labelledby="persona-select-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="persona-select-heading" className="text-2xl font-bold text-slate-900">
          Choose your daily air quality focus
        </h2>
        <Link
          href="/onboarding"
          className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-sky-700 hover:underline"
        >
          <span>Customize full profile</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {PERSONA_CARD_SPECS.map(({ id, title, summary, impact }) => {
          const Icon = ICONS[id];
          return (
            <div
              key={id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div>
                <div className="flex items-center gap-2 text-sky-700">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                </div>
                <p className="mt-2 text-base text-slate-700">{summary}</p>
              </div>
              <div className="mt-4 space-y-3">
                <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800">
                  {impact}
                </p>
                <Link
                  href="/dashboard"
                  onClick={() => onSelectPersona(id)}
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
                >
                  <span>Open {title}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
