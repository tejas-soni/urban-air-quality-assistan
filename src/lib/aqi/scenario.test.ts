import { describe, it, expect } from 'vitest';
import { buildBaselineReading } from '@/lib/aqi/baseline';
import { applySmogScenario } from '@/lib/aqi/scenario';
import { isAbortError, logServerEvent, summarizeError } from '@/lib/logger';

describe('applySmogScenario and CWE-209 safe logger', () => {
  it('simulates winter inversion spike and solar afternoon dispersion purely', () => {
    const base = buildBaselineReading('London');
    expect(applySmogScenario(base, 'baseline')).toBe(base);

    const spike = applySmogScenario(base, 'spike');
    expect(spike.aqi).toBeGreaterThan(base.aqi);
    expect(spike.pollutants.pm25).toBeGreaterThan(base.pollutants.pm25);

    const clear = applySmogScenario(buildBaselineReading('New Delhi'), 'clear');
    expect(clear.aqi).toBeLessThan(220);
  });

  it('scrubs potential secrets from error summaries and logs structured JSON', () => {
    const err = new Error('Request failed for key AIzaSyAbCdEfGhIjKlMnOpQrStUv');
    expect(summarizeError(err)).toContain('[redacted-secret]');
    expect(summarizeError(err)).not.toContain('AIzaSy');
    expect(isAbortError(new DOMException('aborted', 'AbortError'))).toBe(true);
    expect(isAbortError(new Error('other'))).toBe(false);
    expect(() => logServerEvent('test_event', { count: 1 })).not.toThrow();
  });
});
