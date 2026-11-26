'use client';

import { useState } from 'react';
import { ShareCard } from '@/components/community/ShareCard';
import { useUserProfile } from '@/components/layout/useProfile';
import { buildCommunityActionPlan } from '@/lib/aqi/community';
import type { AqiReading } from '@/lib/types';

interface CommunityPlannerProps {
  initialReading: AqiReading;
}

export function CommunityPlanner({ initialReading }: CommunityPlannerProps) {
  const profile = useUserProfile();
  const [groupName, setGroupName] = useState('Neighborhood Clean Air & School Circle');
  const [city, setCity] = useState(profile.city || initialReading.city);
  const [households, setHouseholds] = useState(profile.groupSize || 25);
  const [carTripsReplaced, setCarTripsReplaced] = useState(15);
  const [reading, setReading] = useState(initialReading);
  const [loading, setLoading] = useState(false);

  const plan = buildCommunityActionPlan(
    {
      groupName: groupName.trim() || 'Community Action Group',
      city: reading.city,
      households,
      carTripsReplaced,
    },
    reading,
  );

  async function refreshCity(e: React.FormEvent) {
    e.preventDefault();
    if (city.trim().length < 2) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/aqi?city=${encodeURIComponent(city.trim())}`);
      if (res.ok) setReading(await res.json());
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={refreshCity}
        className="no-print grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-5"
      >
        <div className="sm:col-span-2">
          <label htmlFor="comm-group" className="block text-sm font-semibold text-slate-800">
            School or group name
          </label>
          <input
            id="comm-group"
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900"
          />
        </div>

        <div>
          <label htmlFor="comm-city" className="block text-sm font-semibold text-slate-800">
            City
          </label>
          <input
            id="comm-city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900"
          />
        </div>

        <div>
          <label htmlFor="comm-hh" className="block text-sm font-semibold text-slate-800">
            Households
          </label>
          <input
            id="comm-hh"
            type="number"
            min={1}
            max={2000}
            value={households}
            onChange={(e) => setHouseholds(Number(e.target.value) || 1)}
            className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900"
          />
        </div>

        <div>
          <label htmlFor="comm-trips" className="block text-sm font-semibold text-slate-800">
            Car trips replaced
          </label>
          <input
            id="comm-trips"
            type="number"
            min={0}
            max={2000}
            value={carTripsReplaced}
            onChange={(e) => setCarTripsReplaced(Number(e.target.value) || 0)}
            className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900"
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-5">
          <button
            type="submit"
            disabled={loading}
            className="min-h-[44px] rounded-xl bg-sky-700 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-60"
          >
            {loading ? 'Updating city AQI...' : 'Update City Reading & Plan'}
          </button>
        </div>
      </form>

      <ShareCard plan={plan} />
    </div>
  );
}
