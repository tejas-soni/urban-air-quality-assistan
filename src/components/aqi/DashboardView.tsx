'use client';

import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { AqiCard } from '@/components/aqi/AqiCard';
import { CitySearchForm } from '@/components/aqi/CitySearchForm';
import { CommuteExposureTable } from '@/components/aqi/CommuteExposureTable';
import { ForecastChart } from '@/components/aqi/ForecastChart';
import { IaqCadrCalculator } from '@/components/aqi/IaqCadrCalculator';
import { InversionBanner, type SmogScenario } from '@/components/aqi/InversionBanner';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { RoutineCard } from '@/components/dashboard/RoutineCard';
import { updateAppProfile, useUserProfile } from '@/components/layout/useProfile';
import { classifyAqi, pm25ToUsAqi, whoGuidelineRatio } from '@/lib/aqi/bands';
import { build24hForecast } from '@/lib/aqi/baseline';
import { buildPersonaRoutines } from '@/lib/aqi/routines';
import type { AqiReading } from '@/lib/types';

interface DashboardViewProps {
  initialReading: AqiReading;
}

function applyScenario(base: AqiReading, scenario: SmogScenario): AqiReading {
  if (scenario === 'baseline') return base;
  const delta = scenario === 'spike' ? 120 : -45;
  const factor = scenario === 'spike' ? 1.55 : 0.65;
  const pm25 = Math.max(5, Math.round(base.pollutants.pm25 * factor * 10) / 10);
  const aqi = Math.max(20, Math.min(500, Math.max(pm25ToUsAqi(pm25), base.aqi + delta)));
  return {
    ...base,
    aqi,
    band: classifyAqi(aqi).band,
    pollutants: { ...base.pollutants, pm25 },
    whoRatio: whoGuidelineRatio(pm25),
    forecast24h: build24hForecast(pm25),
    note:
      scenario === 'spike'
        ? 'Simulated severe winter temperature inversion (+120 AQI)'
        : 'Simulated afternoon solar dispersion (-45 AQI)',
  };
}

export function DashboardView({ initialReading }: DashboardViewProps) {
  const profile = useUserProfile();
  const [baseReading, setBaseReading] = useState<AqiReading>(initialReading);
  const [scenario, setScenario] = useState<SmogScenario>('baseline');
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const reading = useMemo(() => applyScenario(baseReading, scenario), [baseReading, scenario]);
  const routines = useMemo(() => buildPersonaRoutines(reading, profile), [reading, profile]);

  async function refreshCity(city: string) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const res = await fetch(`/api/aqi?city=${encodeURIComponent(city)}`, {
        signal: controller.signal,
      });
      if (res.ok) {
        const next = (await res.json()) as AqiReading;
        setBaseReading(next);
        setScenario('baseline');
        updateAppProfile({ ...profile, city: next.city });
      }
    } catch {
      // Aborted or offline fetch keeps current reading visible
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

      <InversionBanner aqi={reading.aqi} scenario={scenario} onScenarioChange={setScenario} />
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
      <IaqCadrCalculator />
      <CommuteExposureTable
        pm25={reading.pollutants.pm25}
        aqi={reading.aqi}
        initialDistanceKm={profile.commuteDistanceKm}
      />
      <ChatPanel compact />
    </div>
  );
}
