import { classifyAqi } from '@/lib/aqi/bands';
import { estimateCommunityImpact } from '@/lib/aqi/impact';
import type { AqiReading, CommunityActionPlan } from '@/lib/types';

export interface CommunityPlanParams {
  groupName: string;
  city: string;
  households: number;
  carTripsReplaced: number;
}

/** Generates a printable and WhatsApp-shareable community smog-action plan with collective math. */
export function buildCommunityActionPlan(
  params: CommunityPlanParams,
  reading: AqiReading,
): CommunityActionPlan {
  const bandInfo = classifyAqi(reading.aqi);
  const impact = estimateCommunityImpact(params.households, params.carTripsReplaced, 4);
  const co2SavedKgDay = Math.round(params.carTripsReplaced * 4 * 0.171 * 10) / 10;
  const severe = reading.aqi > 150;

  const triggers = [
    `Current ${reading.city} AQI: ${reading.aqi} (${bandInfo.label}) — PM2.5 ${reading.pollutants.pm25} µg/m³ (${reading.whoRatio}x WHO 24h guideline).`,
    severe
      ? 'RED ALERT (>150): Move all school recess & sports indoors; activate classroom HEPA/Corsi-Rosenthal filters.'
      : 'ORANGE/MODERATE PROTOCOL: Shift kids play to 13:30–16:00 afternoon mixing window.',
  ];

  const checklist = [
    `Turn engines off at school gates (>30 sec wait) -> ~60–80% lower curbside PM2.5/NO2 spikes.`,
    `Coordinate ${params.carTripsReplaced} shared carpool or walking-bus trips -> ${co2SavedKgDay} kg CO2e/day saved.`,
    `Pause recreational wood/solid-fuel burning across ${params.households} participating households tonight.`,
  ];

  const whatsappSummary = [
    `*${params.groupName} — Smog Action Plan (${reading.city})*`,
    `Live AQI: *${reading.aqi} (${bandInfo.shortLabel})* · PM2.5: ${reading.pollutants.pm25} µg/m³`,
    ``,
    ...triggers.map((t) => `• ${t}`),
    ``,
    `*Today's Collective Actions (${params.households} households):*`,
    ...checklist.map((c) => `✓ ${c}`),
    ``,
    `Impact: ${impact.headline}`,
    `Sources: US EPA School Flag & Idle-Free Schools; WHO 2021 AQG; UK DEFRA Factors.`,
  ].join('\n');

  return {
    groupName: params.groupName,
    city: reading.city,
    aqi: reading.aqi,
    bandLabel: bandInfo.label,
    households: params.households,
    carTripsReplaced: params.carTripsReplaced,
    co2SavedKgDay,
    pm25DropEstimate: '60–80% curbside / 50–70% classroom drop',
    triggers,
    checklist,
    whatsappSummary,
    sources: [
      'content/impact-data/05-school-dropoff-anti-idling.md',
      'content/health-guidance/11-school-recess-pe-aqi-policy.md',
      'content/indoor-hacks/15-classroom-clean-air-placement.md',
    ],
  };
}
