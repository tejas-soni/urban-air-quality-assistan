'use client';

/**
 * Community smog-action planner combining live city lookup, collective math, and ShareCard output.
 */
import { type SyntheticEvent, useEffect, useRef, useState } from 'react';
import { CommunityPlanForm } from '@/components/community/CommunityPlanForm';
import { ShareCard } from '@/components/community/ShareCard';
import { useUserProfile } from '@/components/layout/useProfile';
import { fetchCityAqiClient } from '@/lib/api/aqiClient';
import { buildCommunityActionPlan } from '@/lib/aqi/community';
import type { AqiReading } from '@/lib/types';

interface CommunityPlannerProps {
  initialReading: AqiReading;
}

/** Coordinates live AQI updates and collective emission/PM2.5 reduction summaries for groups. */
export function CommunityPlanner({ initialReading }: CommunityPlannerProps) {
  const profile = useUserProfile();
  const [groupName, setGroupName] = useState('Neighborhood Clean Air & School Circle');
  const [city, setCity] = useState(profile.city || initialReading.city);
  const [households, setHouseholds] = useState(profile.groupSize || 25);
  const [carTripsReplaced, setCarTripsReplaced] = useState(15);
  const [reading, setReading] = useState(initialReading);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const plan = buildCommunityActionPlan(
    {
      groupName: groupName.trim() || 'Community Action Group',
      city: reading.city,
      households,
      carTripsReplaced,
    },
    reading,
  );

  async function refreshCity(e: SyntheticEvent) {
    e.preventDefault();
    if (loading || city.trim().length < 2) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setErrorMsg('');

    const res = await fetchCityAqiClient(city.trim(), controller.signal);
    setLoading(false);
    if (res.ok) setReading(res.data);
    else if (!res.aborted) setErrorMsg(res.error);
  }

  return (
    <div className="space-y-8">
      <CommunityPlanForm
        groupName={groupName}
        onGroupNameChange={setGroupName}
        city={city}
        onCityChange={setCity}
        households={households}
        onHouseholdsChange={setHouseholds}
        carTripsReplaced={carTripsReplaced}
        onTripsChange={setCarTripsReplaced}
        loading={loading}
        onSubmit={(ev) => void refreshCity(ev)}
      />
      {errorMsg && (
        <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {errorMsg}
        </p>
      )}
      <ShareCard plan={plan} />
    </div>
  );
}
