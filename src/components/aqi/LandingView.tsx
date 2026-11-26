'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Car, Home, Users } from 'lucide-react';
import { AqiCard } from '@/components/aqi/AqiCard';
import { CitySearchForm } from '@/components/aqi/CitySearchForm';
import { switchAppPersona, updateAppProfile, useUserProfile } from '@/components/layout/useProfile';
import type { AqiReading, Persona } from '@/lib/types';

interface LandingViewProps {
  initialReading: AqiReading;
}

const PERSONA_CARDS: ReadonlyArray<{
  id: Persona;
  title: string;
  summary: string;
  impact: string;
  Icon: typeof Home;
}> = [
  {
    id: 'family',
    title: 'Family Shield',
    summary: 'School-run timing, kids outdoor play windows, and HEPA/DIY clean rooms.',
    impact: 'Ventilate at 2 PM vs 8 AM -> ~40% less indoor PM2.5 intake',
    Icon: Home,
  },
  {
    id: 'commuter',
    title: 'Low-Emission Commuter',
    summary: 'Post-peak timing shifts, transit vs car vs walk CO2e math, and N95 guidance.',
    impact: 'Shift 30+ min later -> ~15% lower exposure + up to 80% less CO2e',
    Icon: Car,
  },
  {
    id: 'community',
    title: 'Community & Schools',
    summary: 'Shareable no-idling school gate pledges and WhatsApp-ready alert cards.',
    impact: 'Idle-free pickup zones -> ~60–80% lower curbside PM2.5 spikes',
    Icon: Users,
  },
];

export function LandingView({ initialReading }: LandingViewProps) {
  const profile = useUserProfile();
  const [reading, setReading] = useState<AqiReading>(initialReading);
  const [loading, setLoading] = useState(false);

  async function lookupCity(city: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/aqi?city=${encodeURIComponent(city)}`);
      if (res.ok) {
        const next: AqiReading = await res.json();
        setReading(next);
        updateAppProfile({ ...profile, city: next.city });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="max-w-3xl space-y-3">
          <span className="inline-block rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">
            WHO 2021 · US EPA · Multi-Provider AQI Cache
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Navigate winter smog with calm, quantified daily choices
          </h1>
          <p className="text-lg text-slate-700">
            Check live urban air quality, tailor routines for your household or commute, and get
            AI guidance backed by verified WHO/EPA research — never invented numbers.
          </p>
        </div>

        <div className="mt-6">
          <CitySearchForm initialCity={reading.city} onSelectCity={lookupCity} loading={loading} />
        </div>
      </section>

      <AqiCard reading={reading} onRefresh={() => lookupCity(reading.city)} />

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
          {PERSONA_CARDS.map(({ id, title, summary, impact, Icon }) => (
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
                  onClick={() => switchAppPersona(id)}
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
                >
                  <span>Open {title}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
