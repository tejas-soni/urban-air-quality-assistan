import { describe, it, expect } from 'vitest';
import { compareCommuteModes } from './commuteCompare';

describe('compareCommuteModes', () => {
  it('evaluates 6 transit modes and recommends metro in severe smog', () => {
    const severe = compareCommuteModes(10, 140, 210);
    expect(severe).toHaveLength(6);

    const byMode = Object.fromEntries(severe.map((row) => [row.mode, row]));
    const metro = byMode.metro;
    const walk = byMode.walk;
    const car = byMode.car;

    if (!metro || !walk || !car) throw new Error('Expected metro, walk, and car rows');

    expect(metro.recommended).toBe(true);
    expect(walk.recommended).toBe(false);
    expect(metro.co2Kg).toBeLessThan(car.co2Kg);
    expect(metro.inhaledPm25Ug).toBeLessThan(walk.inhaledPm25Ug);
    expect(walk.riskTier).toBe('High');
    expect(walk.advisory).toContain('N95');
  });

  it('recommends active/clean modes when ambient AQI is moderate or good', () => {
    const mild = compareCommuteModes(6, 12, 48);
    const walk = mild.find((m) => m.mode === 'walk');
    if (!walk) throw new Error('Expected walk row');
    expect(walk.recommended).toBe(true);
    expect(walk.riskTier).toBe('Low');

    const fallback = compareCommuteModes(Number.NaN, -5, 110);
    expect(fallback.every((m) => m.durationMinutes >= 1)).toBe(true);
  });
});
