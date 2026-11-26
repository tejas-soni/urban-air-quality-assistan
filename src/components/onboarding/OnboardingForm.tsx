'use client';

/**
 * Interactive profile onboarding form persisting household/commuter defaults locally with Zod safety.
 */
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type SyntheticEvent, useState } from 'react';
import { updateAppProfile, useUserProfile } from '@/components/layout/useProfile';
import { OnboardingFields } from '@/components/onboarding/OnboardingFields';
import { PersonaSchema } from '@/lib/schemas';
import type { CommuteMode, Persona, PurifierType } from '@/lib/types';

function PersonaAndCityFields({
  persona,
  city,
  onPersona,
  onCity,
}: {
  persona: Persona;
  city: string;
  onPersona: (p: Persona) => void;
  onCity: (c: string) => void;
}) {
  return (
    <>
      <div>
        <label htmlFor="onboard-persona" className="block text-sm font-semibold text-slate-800">
          Primary profile
        </label>
        <select
          id="onboard-persona"
          value={persona}
          onChange={(e) => {
            const p = PersonaSchema.safeParse(e.target.value);
            if (p.success) onPersona(p.data);
          }}
          className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900"
        >
          <option value="family">Family (kids, elders, indoor air, school runs)</option>
          <option value="commuter">Commuter (timing shift, transit vs car, N95)</option>
          <option value="community">Community (schools, PTAs, neighborhood alerts)</option>
        </select>
      </div>
      <div>
        <label htmlFor="onboard-city" className="block text-sm font-semibold text-slate-800">
          Home city
        </label>
        <input
          id="onboard-city"
          type="text"
          value={city}
          onChange={(e) => onCity(e.target.value)}
          minLength={2}
          maxLength={80}
          required
          className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900"
        />
      </div>
    </>
  );
}

/** Saves validated UserProfile defaults to browser storage and navigates to the dashboard. */
export function OnboardingForm() {
  const router = useRouter();
  const saved = useUserProfile();

  const [persona, setPersona] = useState<Persona>(saved.persona);
  const [city, setCity] = useState(saved.city);
  const [sensitiveMembers, setSensitiveMembers] = useState(saved.sensitiveMembers);
  const [purifier, setPurifier] = useState<PurifierType>(saved.purifier);
  const [commuteMode, setCommuteMode] = useState<CommuteMode>(saved.commuteMode);
  const [commuteDistanceKm, setCommuteDistanceKm] = useState(saved.commuteDistanceKm);
  const [flexibleTiming, setFlexibleTiming] = useState(saved.flexibleTiming);
  const [groupSize, setGroupSize] = useState(saved.groupSize);

  function handleSubmit(e: SyntheticEvent) {
    e.preventDefault();
    updateAppProfile({
      persona,
      city: city.trim() || 'New Delhi',
      sensitiveMembers,
      purifier,
      commuteMode,
      commuteDistanceKm,
      flexibleTiming,
      groupSize,
    });
    router.push('/dashboard');
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-2xl space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <PersonaAndCityFields persona={persona} city={city} onPersona={setPersona} onCity={setCity} />
      <OnboardingFields
        purifier={purifier}
        onPurifierChange={setPurifier}
        commuteMode={commuteMode}
        onCommuteModeChange={setCommuteMode}
        commuteDistanceKm={commuteDistanceKm}
        onDistanceChange={setCommuteDistanceKm}
        groupSize={groupSize}
        onGroupSizeChange={setGroupSize}
        sensitiveMembers={sensitiveMembers}
        onSensitiveChange={setSensitiveMembers}
        flexibleTiming={flexibleTiming}
        onFlexibleChange={setFlexibleTiming}
      />
      <button
        type="submit"
        className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-sky-700 px-6 py-3 text-base font-semibold text-white hover:bg-sky-800"
      >
        <Check className="h-5 w-5" aria-hidden="true" />
        <span>Save Profile &amp; Open Dashboard</span>
      </button>
    </form>
  );
}
