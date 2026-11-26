/**
 * Quantified ventilation and indoor air filtration impact estimators grounded in EPA/WHO sources.
 */
import type { ImpactEstimate, PurifierType } from '@/lib/types';

export { estimateCommuteImpact, estimateCommunityImpact } from '@/lib/aqi/commuteImpact';

const PURIFIER_REDUCTION: Record<PurifierType, { pct: number; sourceId: string; label: string }> = {
  hepa: {
    pct: 75,
    sourceId: 'hepa-purifier-cadr-sizing',
    label: 'True HEPA H13 filtration (~4.8 ACH)',
  },
  'diy-cr': {
    pct: 75,
    sourceId: 'diy-corsi-rosenthal-box',
    label: 'DIY MERV-13 Corsi-Rosenthal box (~500+ cfm)',
  },
  none: {
    pct: 0,
    sourceId: 'diy-corsi-rosenthal-box',
    label: 'Unfiltered indoor air (DIY MERV-13 box can cut ~75%)',
  },
};

/** Computes indoor PM2.5 intake reduction from ventilating during afternoon vs morning peak. */
export function estimateVentilationImpact(
  morningPm25: number,
  afternoonPm25: number,
): ImpactEstimate {
  const valid = Number.isFinite(morningPm25) && morningPm25 > 0 && afternoonPm25 >= 0;
  const rawPct = valid ? Math.round(((morningPm25 - afternoonPm25) / morningPm25) * 100) : 0;
  const reductionPercent = Math.max(0, Math.min(60, rawPct));
  const diff = valid ? Math.max(0, Math.round(morningPm25 - afternoonPm25)) : 0;

  return {
    headline: `Ventilate at 2 PM instead of 8 AM -> ~${reductionPercent}% less outdoor PM2.5 intake`,
    reductionPercent,
    unitSaved: `${diff} µg/m³ lower outdoor PM2.5`,
    detail: valid
      ? `Afternoon mixing (${Math.round(afternoonPm25)} µg/m³) avoids morning inversion peaks (${Math.round(morningPm25)} µg/m³).`
      : 'Insufficient morning/afternoon PM2.5 readings to compare windows.',
    sourceId: 'afternoon-ventilation-timing',
  };
}

/** Estimates indoor PM2.5 reduction from HEPA or DIY Corsi-Rosenthal filtration. */
export function estimatePurifierImpact(outdoorPm25: number, method: PurifierType): ImpactEstimate {
  const safeOutdoor = Number.isFinite(outdoorPm25) ? Math.max(0, outdoorPm25) : 0;
  const meta = PURIFIER_REDUCTION[method];
  const savedUg = Math.round((safeOutdoor * meta.pct) / 100);
  const none = method === 'none';

  return {
    headline: none
      ? 'Add a DIY Corsi-Rosenthal box -> ~75% lower indoor PM2.5'
      : `${meta.label} -> ~${meta.pct}% less indoor PM2.5`,
    reductionPercent: meta.pct,
    unitSaved: none ? '0 µg/m³ active cut' : `${savedUg} µg/m³ indoor drop`,
    detail: none
      ? 'Four MERV-13 filters + box fan cut room PM2.5 by ~70–85% in EPA/UC Davis tests.'
      : `Estimated indoor level drops from ~${Math.round(safeOutdoor)} to ~${Math.max(0, Math.round(safeOutdoor - savedUg))} µg/m³.`,
    sourceId: meta.sourceId,
  };
}
