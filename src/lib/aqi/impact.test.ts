import { describe, it, expect } from 'vitest';
import {
  estimateVentilationImpact,
  estimatePurifierImpact,
  estimateCommuteImpact,
  estimateCommunityImpact,
} from './impact';

describe('impact estimation math', () => {
  it('computes ventilation afternoon vs morning PM2.5 reduction', () => {
    const est = estimateVentilationImpact(100, 60);
    expect(est.reductionPercent).toBe(40);
    expect(est.headline).toContain('40%');
    expect(est.sourceId).toBe('afternoon-ventilation-timing');
  });

  it('guards non-positive or inverted ventilation values', () => {
    expect(estimateVentilationImpact(40, 80).reductionPercent).toBe(0);
    expect(estimateVentilationImpact(Number.NaN, 0).reductionPercent).toBe(0);
    expect(estimateVentilationImpact(200, 10).reductionPercent).toBe(60);
  });

  it('computes HEPA, DIY Corsi-Rosenthal, and none purifier impacts', () => {
    expect(estimatePurifierImpact(100, 'hepa').reductionPercent).toBe(75);
    expect(estimatePurifierImpact(100, 'diy-cr').unitSaved).toBe('75 µg/m³ indoor drop');
    expect(estimatePurifierImpact(100, 'none').reductionPercent).toBe(0);
    expect(estimatePurifierImpact(Number.NaN, 'hepa').unitSaved).toBe('0 µg/m³ indoor drop');
  });

  it('computes commute CO2e and rush-shift impacts accurately', () => {
    const metro = estimateCommuteImpact(10, 'metro', true);
    expect(metro.unitSaved).toBe('1.36 kg CO2e/day saved');
    expect(metro.headline).toContain('15% lower PM2.5');
    const walk = estimateCommuteImpact(4, 'walk', false);
    expect(walk.reductionPercent).toBe(100);
    expect(estimateCommuteImpact(Number.NaN, 'car', false).unitSaved).toBe('0 kg CO2e/day saved');
  });

  it('computes collective community impact', () => {
    const plan = estimateCommunityImpact(30, 15, 4);
    expect(plan.unitSaved).toBe('10.3 kg CO2e/day');
    expect(plan.reductionPercent).toBe(70);
    expect(estimateCommunityImpact(1, 0).reductionPercent).toBe(0);
  });
});
