import type { CommuteMode } from '@/lib/types';

export interface CommuteModeComparison {
  mode: CommuteMode;
  label: string;
  durationMinutes: number;
  inhaledPm25Ug: number;
  co2Kg: number;
  riskTier: 'Low' | 'Moderate' | 'High';
  recommended: boolean;
  advisory: string;
}

interface ModePhysics {
  label: string;
  speedKmh: number;
  ventilationM3h: number;
  protectionFactor: number;
  co2GPerKm: number;
}

/** Speed, EPA Table 6-2 inhalation rates, cabin filtration, and DEFRA 2024 CO2e factors. */
const MODE_TABLE: Record<CommuteMode, ModePhysics> = {
  metro: {
    label: 'Underground Metro',
    speedKmh: 34,
    ventilationM3h: 0.6,
    protectionFactor: 0.72,
    co2GPerKm: 35,
  },
  carpool: {
    label: 'Shared Carpool (3x)',
    speedKmh: 24,
    ventilationM3h: 0.5,
    protectionFactor: 0.65,
    co2GPerKm: 57,
  },
  bus: {
    label: 'City Bus / E-Bus',
    speedKmh: 19,
    ventilationM3h: 0.6,
    protectionFactor: 0.55,
    co2GPerKm: 97,
  },
  car: {
    label: 'Solo Car (Recirc)',
    speedKmh: 24,
    ventilationM3h: 0.5,
    protectionFactor: 0.65,
    co2GPerKm: 171,
  },
  ebike: {
    label: 'E-Bike / Cycle',
    speedKmh: 16,
    ventilationM3h: 1.8,
    protectionFactor: 0.0,
    co2GPerKm: 8,
  },
  walk: {
    label: 'Walking Side-Street',
    speedKmh: 5,
    ventilationM3h: 1.2,
    protectionFactor: 0.0,
    co2GPerKm: 0,
  },
};

const MODES_ORDER: ReadonlyArray<CommuteMode> = ['metro', 'carpool', 'bus', 'car', 'ebike', 'walk'];

function classifyDoseRisk(inhaledUg: number): 'Low' | 'Moderate' | 'High' {
  if (inhaledUg >= 45) return 'High';
  if (inhaledUg >= 18) return 'Moderate';
  return 'Low';
}

function buildModeAdvisory(mode: CommuteMode, ambientAqi: number): string {
  if (ambientAqi > 150 && (mode === 'walk' || mode === 'ebike')) {
    return 'Wear snug N95/FFP2 + route off main arterials.';
  }
  if (mode === 'metro') return 'Lowest inhaled PM2.5 + ~80% CO2e cut vs solo driving.';
  if (mode === 'car') return 'Enable AC recirculation (~65% in-cabin PM2.5 cut) or switch to rail.';
  return 'Compare emission savings against ambient inhalation.';
}

/** Compares inhaled PM2.5 (µg) and CO2e (kg) across 6 urban commute modes for distanceKm & pm25. */
export function compareCommuteModes(
  distanceKm: number,
  pm25UgM3: number,
  ambientAqi: number,
): CommuteModeComparison[] {
  const safeKm = Number.isFinite(distanceKm) ? Math.min(100, Math.max(0.5, distanceKm)) : 8;
  const safePm25 = Number.isFinite(pm25UgM3) ? Math.max(1, pm25UgM3) : 25;

  return MODES_ORDER.map((mode) => {
    const spec = MODE_TABLE[mode];
    const hours = safeKm / spec.speedKmh;
    const dose = safePm25 * hours * spec.ventilationM3h * (1 - spec.protectionFactor);
    const inhaledPm25Ug = Math.round(dose * 10) / 10;
    const co2Kg = Math.round(((safeKm * spec.co2GPerKm) / 1000) * 100) / 100;
    const recommended =
      ambientAqi > 100 ? mode === 'metro' : mode === 'walk' || mode === 'ebike' || mode === 'metro';

    return {
      mode,
      label: spec.label,
      durationMinutes: Math.max(1, Math.round(hours * 60)),
      inhaledPm25Ug,
      co2Kg,
      riskTier: classifyDoseRisk(inhaledPm25Ug),
      recommended,
      advisory: buildModeAdvisory(mode, ambientAqi),
    };
  });
}
