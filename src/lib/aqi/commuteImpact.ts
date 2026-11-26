/**
 * Quantified commute shift and community anti-idling emission reduction calculators.
 */
import type { CommuteMode, ImpactEstimate } from '@/lib/types';

const EMISSION_G_PER_PKM: Record<CommuteMode, number> = {
  car: 171,
  bus: 97,
  carpool: 57,
  metro: 35,
  ebike: 8,
  walk: 0,
};

/** Quantifies daily CO2e savings and peak PM2.5 exposure drop for a commute option. */
export function estimateCommuteImpact(
  distanceKm: number,
  mode: CommuteMode,
  shiftLater: boolean,
): ImpactEstimate {
  const km = Number.isFinite(distanceKm) ? Math.max(0.5, distanceKm) : 0.5;
  const baselineCo2 = km * EMISSION_G_PER_PKM.car;
  const modeCo2 = km * EMISSION_G_PER_PKM[mode];
  const savedKg = Math.round(((baselineCo2 - modeCo2) / 1000) * 100) / 100;
  const co2CutPct = Math.round(((baselineCo2 - modeCo2) / baselineCo2) * 100);
  const exposurePct = shiftLater ? 15 : 0;

  return {
    headline: shiftLater
      ? `Shift 30+ min later (${mode}) -> ~${exposurePct}% lower PM2.5 exposure & ${co2CutPct}% lower CO2e`
      : `Choose ${mode} over solo car -> ~${co2CutPct}% lower CO2e (${savedKg} kg/day)`,
    reductionPercent: Math.max(co2CutPct, exposurePct),
    unitSaved: `${savedKg} kg CO2e/day saved`,
    detail: `DEFRA/EPA factors: car 171 g/pkm vs ${mode} ${EMISSION_G_PER_PKM[mode]} g/pkm over ${km} km.`,
    sourceId: shiftLater ? 'commute-shift-30min-exposure' : 'car-vs-bus-vs-metro-emissions',
  };
}

/** Computes collective daily emission and school-curbside PM2.5 savings for community groups. */
export function estimateCommunityImpact(
  households: number,
  carTripsReplaced: number,
  avgTripKm = 4,
): ImpactEstimate {
  const safeHouseholds = Math.max(1, Math.round(households));
  const safeTrips = Math.max(0, Math.round(carTripsReplaced));
  const km = Math.max(1, avgTripKm);
  const co2SavedKg = Math.round(safeTrips * km * 0.171 * 10) / 10;
  const curbDropPct = safeTrips > 0 ? 70 : 0;

  return {
    headline: `${safeTrips} fewer car trips across ${safeHouseholds} households -> ${co2SavedKg} kg CO2e/day saved`,
    reductionPercent: curbDropPct,
    unitSaved: `${co2SavedKg} kg CO2e/day`,
    detail: `Idle-free school gates + walking buses cut curbside PM2.5/NO2 peaks ~60–80% while avoiding cold-start trips.`,
    sourceId: 'school-dropoff-anti-idling',
  };
}
