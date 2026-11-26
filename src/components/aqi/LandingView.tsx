'use client';

/**
 * Landing page view providing live city AQI lookup, instant guidance card, and persona launchers.
 */
import { useEffect, useRef, useState } from 'react';
import { AqiCard } from '@/components/aqi/AqiCard';
import { CitySearchForm } from '@/components/aqi/CitySearchForm';
import { PersonaCardGrid } from '@/components/aqi/PersonaCardGrid';
import { switchAppPersona, updateAppProfile, useUserProfile } from '@/components/layout/useProfile';
import { fetchCityAqiClient } from '@/lib/api/aqiClient';
import type { AqiReading } from '@/lib/types';

interface LandingViewProps {
  initialReading: AqiReading;
}

/** Interactive landing experience coordinating Zod-validated city lookups and persona selection. */
export function LandingView({ initialReading }: LandingViewProps) {
  const profile = useUserProfile();
  const [reading, setReading] = useState<AqiReading>(initialReading);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function lookupCity(city: string) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setErrorMsg('');

    const result = await fetchCityAqiClient(city, controller.signal);
    setLoading(false);
    if (result.ok) {
      setReading(result.data);
      updateAppProfile({ ...profile, city: result.data.city });
    } else if (!result.aborted) {
      setErrorMsg(result.error);
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
            Check live urban air quality, tailor routines for your household or commute, and get AI
            guidance backed by verified WHO/EPA research — never invented numbers.
          </p>
        </div>

        <div className="mt-6">
          <CitySearchForm
            initialCity={reading.city}
            onSelectCity={(c) => void lookupCity(c)}
            loading={loading}
          />
          {errorMsg && (
            <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-900">
              {errorMsg}
            </p>
          )}
        </div>
      </section>

      <AqiCard reading={reading} onRefresh={() => void lookupCity(reading.city)} />
      <PersonaCardGrid onSelectPersona={(id) => switchAppPersona(id)} />
    </div>
  );
}
