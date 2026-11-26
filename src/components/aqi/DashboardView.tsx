'use client';

import Link from 'next/link';
import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { AqiCard } from '@/components/aqi/AqiCard';
import { CitySearchForm } from '@/components/aqi/CitySearchForm';
import { ForecastChart } from '@/components/aqi/ForecastChart';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { RoutineCard } from '@/components/dashboard/RoutineCard';
import { updateAppProfile, useUserProfile } from '@/components/layout/useProfile';
import { buildPersonaRoutines } from '@/lib/aqi/routines';
import type { AqiReading } from '@/lib/types';

interface DashboardViewProps {
  initialReading: AqiReading;
}

export function DashboardView({ initialReading }: DashboardViewProps) {
  const profile = useUserProfile();
  const [reading, setReading] = useState<AqiReading>(initialReading);
  const [loading, setLoading] = useState(false);

  const routines = buildPersonaRoutines(reading, profile);

  async function refreshCity(city: string) {
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
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {profile.persona.charAt(0).toUpperCase() + profile.persona.slice(1)} Air Quality
            Dashboard
          </h1>
          <p className="mt-1 text-base text-slate-700">
            Tailored recommendations for {reading.city} with quantified, source-cited impacts.
          </p>
        </div>

        <Link
          href="/chat"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
        >
          <MessageSquare className="h-4 w-4" aria-hidden="true" />
          <span>Full AI Chat</span>
        </Link>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <CitySearchForm initialCity={profile.city} onSelectCity={refreshCity} loading={loading} />
      </section>

      <AqiCard reading={reading} onRefresh={() => refreshCity(reading.city)} />

      <section aria-labelledby="routines-heading" className="space-y-4">
        <h2 id="routines-heading" className="text-2xl font-bold text-slate-900">
          Today&apos;s Low-Emission &amp; Clean-Air Routines
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {routines.map((routine) => (
            <RoutineCard key={routine.id} routine={routine} />
          ))}
        </div>
      </section>

      <ForecastChart reading={reading} />

      <ChatPanel compact />
    </div>
  );
}
