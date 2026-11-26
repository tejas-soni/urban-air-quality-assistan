export interface CadrSizingResult {
  volumeM3: number;
  requiredCadrM3h: number;
  selectedCadrM3h: number;
  achievedAch: number;
  clearanceMinutes80: number;
  recommendedUnit: string;
  provenance: ReadonlyArray<{ label: string; kind: 'published' | 'assumption'; source: string }>;
}

export const DIY_CORSI_ROSENTHAL_CADR_M3H = 480;
export const STANDARD_HEPA_CADR_M3H = 340;
const MIN_EFFICIENCY = 0.05;
const MAX_EFFICIENCY = 0.99;

/** Computes room volume in cubic meters clamped to safe positive architectural bounds. */
export function calculateRoomVolumeM3(areaSqM: number, ceilingHeightM: number): number {
  const safeArea = Number.isFinite(areaSqM) ? Math.min(500, Math.max(4, areaSqM)) : 20;
  const safeHeight = Number.isFinite(ceilingHeightM)
    ? Math.min(6, Math.max(2, ceilingHeightM))
    : 2.8;
  return Math.round(safeArea * safeHeight * 10) / 10;
}

/** Computes required Clean Air Delivery Rate (m³/h) for a target Air Changes per Hour (default 4.8 ACH). */
export function calculateRequiredCadrM3h(volumeM3: number, targetAch = 4.8): number {
  const safeVol = Number.isFinite(volumeM3) && volumeM3 > 0 ? volumeM3 : 56;
  const safeAch = Number.isFinite(targetAch) ? Math.min(12, Math.max(1, targetAch)) : 4.8;
  return Math.round(safeVol * safeAch);
}

/** Estimates minutes to achieve target particulate reduction via single-compartment decay t = (-ln(1-eff)*V/CADR)*60. */
export function estimateClearanceMinutes(
  volumeM3: number,
  cadrM3h: number,
  targetEfficiency = 0.8,
): number {
  const safeVol = Number.isFinite(volumeM3) && volumeM3 > 0 ? volumeM3 : 56;
  const safeCadr = Number.isFinite(cadrM3h) && cadrM3h > 0 ? cadrM3h : STANDARD_HEPA_CADR_M3H;
  const clampedEff = Number.isFinite(targetEfficiency)
    ? Math.min(MAX_EFFICIENCY, Math.max(MIN_EFFICIENCY, targetEfficiency))
    : 0.8;
  const hours = (-Math.log(1 - clampedEff) * safeVol) / safeCadr;
  return Math.max(1, Math.round(hours * 60));
}

/** Produces a complete room-by-room IAQ CADR plan with published vs assumption provenance. */
export function buildCadrSizingPlan(
  areaSqM: number,
  ceilingHeightM: number,
  mode: 'hepa' | 'diy-cr',
  targetAch = 4.8,
): CadrSizingResult {
  const volumeM3 = calculateRoomVolumeM3(areaSqM, ceilingHeightM);
  const requiredCadrM3h = calculateRequiredCadrM3h(volumeM3, targetAch);
  const selectedCadrM3h = mode === 'diy-cr' ? DIY_CORSI_ROSENTHAL_CADR_M3H : STANDARD_HEPA_CADR_M3H;
  const achievedAch = Math.round((selectedCadrM3h / volumeM3) * 10) / 10;
  const clearanceMinutes80 = estimateClearanceMinutes(volumeM3, selectedCadrM3h, 0.8);

  return {
    volumeM3,
    requiredCadrM3h,
    selectedCadrM3h,
    achievedAch,
    clearanceMinutes80,
    recommendedUnit:
      mode === 'diy-cr'
        ? 'DIY MERV-13 Corsi-Rosenthal Box (~480 m³/h)'
        : 'Commercial True HEPA H13 (~340 m³/h)',
    provenance: [
      {
        label: '4.8 ACH target for wildfire/winter smog clean rooms',
        kind: 'published',
        source: 'US EPA / ASHRAE Clean Room Guidance',
      },
      {
        label: 'DIY Corsi-Rosenthal 4x MERV-13 CADR (~480 m³/h)',
        kind: 'published',
        source: 'Dal Porto et al. (2022), Aerosol Sci. Technol. 56(6)',
      },
      {
        label: 'Single-compartment uniform mixing factor',
        kind: 'assumption',
        source: 'Standard first-order mass-balance model assumption',
      },
    ],
  };
}
