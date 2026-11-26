'use client';

/**
 * Persona-tailored AQI dashboard coordinating city telemetry, calculators, routines, and inline coach.
 */
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AqiCard } from '@/components/aqi/AqiCard';
import { CitySearchForm } from '@/components/aqi/CitySearchForm';
import { CommuteExposureTable } from '@/components/aqi/CommuteExposureTable';
import { ForecastChart } from '@/components/aqi/ForecastChart';
import { IaqCadrCalculator } from '@/components/aqi/IaqCadrCalculator';
import { InversionBanner } from '@/components/aqi/InversionBanner';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { RoutineCard } from '@/components/dashboard/RoutineCard';
import { updateAppProfile, useUserProfile } from '@/components/layout/useProfile';
import { fetchCityAqiClient } from '@/lib/api/aqiClient';
import { buildPersonaRoutines } from '@/lib/aqi/routines';
import { applySmogScenario, type SmogScenario } from '@/lib/aqi/scenario';
import type { AqiReading } from '@/lib/types';

interface DashboardViewProps {
  initialReading: AqiReading;
}

function DashboardHeader({ persona, city }: { persona: string; city: string }) {
  const personaLabel = persona.charAt(0).toUpperCase() + persona.slice(1);
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{personaLabel} Air Quality Dashboard</h1>
        <p className="mt-1 text-base text-slate-700">
          Tailored recommendations for {city} with quantified, source-cited impacts.
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
  );
}

/** Renders the complete persona-aware air quality dashboard and scenario simulator. */
export function DashboardView({ initialReading }: DashboardViewProps) {
  const profile = useUserProfile();
  const [baseReading, setBaseReading] = useState<AqiReading>(initialReading);
  const [scenario, setScenario] = useState<SmogScenario>('baseline');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const reading = useMemo(() => applySmogScenario(baseReading, scenario), [baseReading, scenario]);
  const routines = useMemo(() => buildPersonaRoutines(reading, profile), [reading, profile]);

  async function refreshCity(city: string) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setErrorMsg('');

    const result = await fetchCityAqiClient(city, controller.signal);
    setLoading(false);
    if (result.ok) {
      setBaseReading(result.data);
      setScenario('baseline');
      updateAppProfile({ ...profile, city: result.data.city });
    } else if (!result.aborted) {
      setErrorMsg(result.error);
    }
  }

  return (
    <div className="space-y-8">
      <DashboardHeader persona={profile.persona} city={reading.city} />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <CitySearchForm
          initialCity={profile.city}
          onSelectCity={(c) => void refreshCity(c)}
          loading={loading}
        />
        {errorMsg && (
          <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-900">
            {errorMsg}
          </p>
        )}
      </section>

      <InversionBanner aqi={reading.aqi} scenario={scenario} onScenarioChange={setScenario} />
      <AqiCard reading={reading} onRefresh={() => void refreshCity(reading.city)} />

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
