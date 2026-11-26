'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Check } from 'lucide-react';
import { updateAppProfile, useUserProfile } from '@/components/layout/useProfile';
import type { CommuteMode, Persona, PurifierType } from '@/lib/types';

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

  function handleSubmit(e: React.FormEvent) {
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
      <div>
        <label htmlFor="onboard-persona" className="block text-sm font-semibold text-slate-800">
          Primary profile
        </label>
        <select
          id="onboard-persona"
          value={persona}
          onChange={(e) => setPersona(e.target.value as Persona)}
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
          onChange={(e) => setCity(e.target.value)}
          minLength={2}
          maxLength={80}
          required
          className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="onboard-purifier" className="block text-sm font-semibold text-slate-800">
            Indoor filtration setup
          </label>
          <select
            id="onboard-purifier"
            value={purifier}
            onChange={(e) => setPurifier(e.target.value as PurifierType)}
            className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900"
          >
            <option value="hepa">Commercial True HEPA purifier</option>
            <option value="diy-cr">DIY MERV-13 Corsi-Rosenthal box</option>
            <option value="none">No air purifier yet</option>
          </select>
        </div>

        <div>
          <label htmlFor="onboard-commute" className="block text-sm font-semibold text-slate-800">
            Typical commute mode
          </label>
          <select
            id="onboard-commute"
            value={commuteMode}
            onChange={(e) => setCommuteMode(e.target.value as CommuteMode)}
            className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900"
          >
            <option value="car">Solo Petrol/Diesel Car</option>
            <option value="carpool">3-Person Carpool</option>
            <option value="bus">Urban Bus</option>
            <option value="metro">Electric Metro / Rail</option>
            <option value="ebike">E-Bike / Bicycle</option>
            <option value="walk">Walking</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="onboard-dist" className="block text-sm font-semibold text-slate-800">
            Daily round-trip distance (km)
          </label>
          <input
            id="onboard-dist"
            type="number"
            min={1}
            max={150}
            value={commuteDistanceKm}
            onChange={(e) => setCommuteDistanceKm(Number(e.target.value) || 1)}
            className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900"
          />
        </div>

        <div>
          <label htmlFor="onboard-group" className="block text-sm font-semibold text-slate-800">
            Community group households
          </label>
          <input
            id="onboard-group"
            type="number"
            min={1}
            max={500}
            value={groupSize}
            onChange={(e) => setGroupSize(Number(e.target.value) || 1)}
            className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900"
          />
        </div>
      </div>

      <div className="space-y-3">
        <label className="flex min-h-[44px] items-center gap-3 text-base text-slate-800">
          <input
            type="checkbox"
            checked={sensitiveMembers}
            onChange={(e) => setSensitiveMembers(e.target.checked)}
            className="h-5 w-5 rounded border-slate-300 text-sky-600"
          />
          <span>Household includes children, older adults, or asthma/heart sensitivity</span>
        </label>

        <label className="flex min-h-[44px] items-center gap-3 text-base text-slate-800">
          <input
            type="checkbox"
            checked={flexibleTiming}
            onChange={(e) => setFlexibleTiming(e.target.checked)}
            className="h-5 w-5 rounded border-slate-300 text-sky-600"
          />
          <span>Can shift morning departure 30–60 min later on high-smog days</span>
        </label>
      </div>

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
