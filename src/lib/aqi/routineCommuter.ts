/**
 * Commuter persona daily routine generator prioritizing post-peak departure shifts and transit mode switches.
 */
import { estimateCommuteImpact, estimatePurifierImpact } from '@/lib/aqi/impact';
import type { AqiReading, RoutineRecommendation, UserProfile } from '@/lib/types';

/** Builds commuter routines comparing peak-hour shifts, rail/walking alternatives, and recirculation. */
export function buildCommuterRoutines(
  reading: AqiReading,
  profile: UserProfile,
): RoutineRecommendation[] {
  const shortWalk = profile.commuteDistanceKm <= 4 && reading.aqi <= 120;
  const bestMode = shortWalk ? 'walk' : 'metro';

  return [
    {
      id: 'commuter-timing',
      title: profile.flexibleTiming
        ? 'Shift Departure 30+ Min Post-Peak'
        : 'Use Side-Street Corridor',
      windowLabel: profile.flexibleTiming ? '09:15 vs 08:15' : 'Off-Arterial Route',
      action: profile.flexibleTiming
        ? 'Depart 30–60 min after peak winter rush to let surface inversion disperse.'
        : 'Walk/cycle 1–2 blocks parallel to major arterials to cut roadside black carbon ~20–35%.',
      impact: estimateCommuteImpact(
        profile.commuteDistanceKm,
        profile.commuteMode,
        profile.flexibleTiming,
      ),
      priority: 'high',
      sourceCitation: 'content/impact-data/01-commute-shift-30min-exposure.md',
    },
    {
      id: 'commuter-mode',
      title: `Switch ${profile.commuteDistanceKm} km Trip to ${bestMode === 'metro' ? 'Electric Metro/Rail' : 'Walking'}`,
      windowLabel: 'Daily Commute',
      action: `Swap solo petrol driving for ${bestMode} and wear an N95/FFP2 when AQI > 100.`,
      impact: estimateCommuteImpact(profile.commuteDistanceKm, bestMode, false),
      priority: 'high',
      sourceCitation: 'content/impact-data/02-car-vs-bus-vs-metro-emissions.md',
    },
    {
      id: 'commuter-cabin',
      title: 'Cabin Recirculation in Traffic Queues',
      windowLabel: 'Congested Stretches',
      action:
        'Toggle car HVAC to recirculation in heavy traffic (brief fresh-air reset every 25 min).',
      impact: estimatePurifierImpact(reading.pollutants.pm25, 'hepa'),
      priority: 'medium',
      sourceCitation: 'content/impact-data/03-in-cabin-recirculation-mode.md',
    },
  ];
}
