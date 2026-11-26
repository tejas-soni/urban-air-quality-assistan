import { describe, it, expect } from 'vitest';
import {
  buildCadrSizingPlan,
  calculateRequiredCadrM3h,
  calculateRoomVolumeM3,
  DIY_CORSI_ROSENTHAL_CADR_M3H,
  estimateClearanceMinutes,
  STANDARD_HEPA_CADR_M3H,
} from './cadr';

describe('IAQ room CADR and mass-balance decay engine', () => {
  it('computes room volume and clamps non-finite or out-of-range inputs', () => {
    expect(calculateRoomVolumeM3(20, 2.5)).toBe(50);
    expect(calculateRoomVolumeM3(-10, 1)).toBe(8);
    expect(calculateRoomVolumeM3(1000, 10)).toBe(3000);
    expect(calculateRoomVolumeM3(Number.NaN, Number.NaN)).toBe(56);
  });

  it('computes required CADR in m3/h and 80% clearance duration', () => {
    expect(calculateRequiredCadrM3h(50, 4.8)).toBe(240);
    expect(calculateRequiredCadrM3h(0, 20)).toBe(672);

    const minsFast = estimateClearanceMinutes(50, DIY_CORSI_ROSENTHAL_CADR_M3H, 0.8);
    const minsSlow = estimateClearanceMinutes(50, STANDARD_HEPA_CADR_M3H, 0.8);
    expect(minsFast).toBeGreaterThan(0);
    expect(minsFast).toBeLessThan(minsSlow);
    expect(estimateClearanceMinutes(-1, -1, 2)).toBeGreaterThan(0);
  });

  it('builds complete sizing plans with published and assumption provenance', () => {
    const diy = buildCadrSizingPlan(25, 2.8, 'diy-cr');
    expect(diy.volumeM3).toBe(70);
    expect(diy.selectedCadrM3h).toBe(DIY_CORSI_ROSENTHAL_CADR_M3H);
    expect(diy.achievedAch).toBeCloseTo(6.9, 1);
    expect(diy.provenance.some((p) => p.kind === 'published')).toBe(true);
    expect(diy.provenance.some((p) => p.kind === 'assumption')).toBe(true);

    const hepa = buildCadrSizingPlan(25, 2.8, 'hepa');
    expect(hepa.selectedCadrM3h).toBe(STANDARD_HEPA_CADR_M3H);
    expect(hepa.recommendedUnit).toContain('HEPA');
  });
});
