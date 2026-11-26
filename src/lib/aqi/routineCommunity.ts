/**
 * Community persona daily routine generator for school no-idling pledges and classroom clean air.
 */
import { estimateCommunityImpact, estimatePurifierImpact } from '@/lib/aqi/impact';
import type { AqiReading, RoutineRecommendation, UserProfile } from '@/lib/types';

/** Builds neighborhood and school group routines with quantified collective impact estimates. */
export function buildCommunityRoutines(
  reading: AqiReading,
  profile: UserProfile,
): RoutineRecommendation[] {
  const trips = Math.max(5, Math.round(profile.groupSize * 0.6));
  return [
    {
      id: 'community-school-gate',
      title: 'Idle-Free School Drop-Off Pledge',
      windowLabel: '07:45–08:30 & 14:45–15:30',
      action:
        'Turn engines off while waiting >30 sec; organize a 15-family walking school bus on AQI <=120 days.',
      impact: estimateCommunityImpact(profile.groupSize, trips, 4),
      priority: 'high',
      sourceCitation: 'content/impact-data/05-school-dropoff-anti-idling.md',
    },
    {
      id: 'community-classroom-filter',
      title: 'Dual Classroom Portable Air Cleaners',
      windowLabel: 'School Hours',
      action:
        'Place two HEPA/DIY Corsi-Rosenthal units per classroom for clean-air student recovery.',
      impact: estimatePurifierImpact(reading.pollutants.pm25, 'diy-cr'),
      priority: reading.aqi > 100 ? 'high' : 'medium',
      sourceCitation: 'content/indoor-hacks/15-classroom-clean-air-placement.md',
    },
  ];
}
