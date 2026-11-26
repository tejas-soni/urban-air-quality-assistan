import { describe, it, expect } from 'vitest';
import { buildBaselineReading, build24hForecast, build5dForecast, POPULAR_CITIES } from './baseline';

describe('baseline AQI and diurnal profiles', () => {
  it('returns seeded winter data for known cities', () => {
    const delhi = buildBaselineReading('New Delhi', new Date('2026-01-15T10:00:00Z'));
    expect(delhi.city).toBe('New Delhi');
    expect(delhi.aqi).toBeGreaterThan(150);
    expect(delhi.providersUsed).toEqual(['baseline']);
    expect(POPULAR_CITIES).toContain('London');
  });

  it('generates deterministic readings for arbitrary city names', () => {
    const a = buildBaselineReading('Springfield', new Date('2026-01-15T10:00:00Z'));
    const b = buildBaselineReading('Springfield', new Date('2026-01-15T10:00:00Z'));
    expect(a).toEqual(b);
    expect(buildBaselineReading('  ').city).toBe('London');
  });

  it('models afternoon dip lower than morning rush peak', () => {
    const pts = build24hForecast(100);
    const morning = pts.find((p) => p.hourLabel === '08:00')!;
    const afternoon = pts.find((p) => p.hourLabel === '14:00')!;
    expect(afternoon.isLowestWindow).toBe(true);
    expect(afternoon.pm25).toBeLessThan(morning.pm25);
  });

  it('builds 5-day forecast with min <= max AQI', () => {
    const fc = build5dForecast(50);
    expect(fc).toHaveLength(5);
    expect(fc[0].dayLabel).toBe('Today');
    for (const day of fc) {
      expect(day.minAqi).toBeLessThanOrEqual(day.maxAqi);
    }
    expect(build5dForecast(Number.NaN)[0].avgPm25).toBe(2);
    expect(build24hForecast(Number.NaN)[0].pm25).toBeGreaterThan(0);
  });
});
