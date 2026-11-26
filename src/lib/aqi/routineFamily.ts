import {
  estimateCommuteImpact,
  estimatePurifierImpact,
  estimateVentilationImpact,
} from '@/lib/aqi/impact';
import type { AqiReading, RoutineRecommendation, UserProfile } from '@/lib/types';

function morningAfternoon(reading: AqiReading): { morning: number; afternoon: number } {
  const m = reading.forecast24h.find((f) => f.hourLabel === '08:00');
  const a = reading.forecast24h.find((f) => f.hourLabel === '14:00');
  return {
    morning: m ? m.pm25 : reading.pollutants.pm25 * 1.25,
    afternoon: a ? a.pm25 : reading.pollutants.pm25 * 0.74,
  };
}

function buildFiltrationStep(
  reading: AqiReading,
  purifier: UserProfile['purifier'],
): RoutineRecommendation {
  const none = purifier === 'none';
  return {
    id: 'family-filtration',
    title: none ? 'Build DIY Corsi-Rosenthal Filter' : 'Run Bedroom Clean Zone',
    windowLabel: 'Overnight + Peak Hours',
    action: none
      ? 'Tape four 20x20 MERV-13 filters to a box fan (~$70) for bedroom sleep protection.'
      : 'Run purifier continuously at 4.8+ ACH in the primary bedroom with doors closed.',
    impact: estimatePurifierImpact(reading.pollutants.pm25, purifier),
    priority: reading.aqi > 100 ? 'high' : 'medium',
    sourceCitation: `content/indoor-hacks/${purifier === 'hepa' ? '02-hepa-purifier-cadr-sizing.md' : '03-diy-corsi-rosenthal-box.md'}`,
  };
}

export function buildFamilyRoutines(
  reading: AqiReading,
  profile: UserProfile,
): RoutineRecommendation[] {
  const { morning, afternoon } = morningAfternoon(reading);
  const severe = reading.aqi > 150;

  return [
    {
      id: 'family-ventilation',
      title: severe ? 'Keep Windows Sealed & Filter Indoors' : 'Afternoon Ventilation Window',
      windowLabel: severe ? 'All Day (Seal)' : '13:30–15:30',
      action: severe
        ? `AQI is ${reading.aqi} (Unhealthy+). Keep windows latched and use sealed clean-room filtration.`
        : 'Cross-ventilate for 10–15 min around 2 PM instead of 8 AM morning inversion.',
      impact: estimateVentilationImpact(morning, afternoon),
      priority: 'high',
      sourceCitation: 'content/indoor-hacks/01-afternoon-ventilation-timing.md',
    },
    buildFiltrationStep(reading, profile.purifier),
    {
      id: 'family-play',
      title: profile.sensitiveMembers
        ? 'Protect Kids & Sensitive Play'
        : 'Midday Outdoor Play Window',
      windowLabel: severe ? 'Indoor Play' : '13:30–16:00',
      action: severe
        ? 'Move active kids play indoors and ensure fitted N95/KN95 masks for essential errands.'
        : 'Shift park play to afternoon warmth; avoid roadside parks within 150 m of busy roads.',
      impact: estimateCommuteImpact(3, 'walk', true),
      priority: 'medium',
      sourceCitation: 'content/health-guidance/04-pediatric-outdoor-play-windows.md',
    },
  ];
}
