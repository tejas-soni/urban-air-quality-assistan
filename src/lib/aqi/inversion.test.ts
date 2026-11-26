import { describe, it, expect } from 'vitest';
import { evaluateInversionRisk } from './inversion';

describe('evaluateInversionRisk', () => {
  it('flags severe winter smog trapping when warm air caps calm surface air or AQI > 200', () => {
    const cap = evaluateInversionRisk(6, 10.5, 3, 165);
    expect(cap.severity).toBe('severe');
    expect(cap.isInversion).toBe(true);
    expect(cap.lapseRateC).toBe(4.5);

    const highAqi = evaluateInversionRisk(15, 14, 15, 240);
    expect(highAqi.severity).toBe('severe');
  });

  it('flags moderate inversion on slight lapse and calm wind', () => {
    const mod = evaluateInversionRisk(9, 10.5, 8, 95);
    expect(mod.severity).toBe('moderate');
    expect(mod.isInversion).toBe(true);
  });

  it('reports active dispersion when winds mix surface air cleanly and handles NaN defaults', () => {
    const clear = evaluateInversionRisk(14, 11, 18, 42);
    expect(clear.severity).toBe('none');
    expect(clear.isInversion).toBe(false);

    const safe = evaluateInversionRisk(Number.NaN, Number.NaN, Number.NaN, Number.NaN);
    expect(safe.isInversion).toBe(true);
  });
});
