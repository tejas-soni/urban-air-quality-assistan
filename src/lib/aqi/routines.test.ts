import { describe, it, expect } from 'vitest';
import { buildBaselineReading } from './baseline';
import { buildPersonaRoutines } from './routines';
import type { UserProfile } from '@/lib/types';

const BASE_PROFILE: UserProfile = {
  persona: 'family',
  city: 'New Delhi',
  sensitiveMembers: true,
  purifier: 'hepa',
  commuteMode: 'car',
  commuteDistanceKm: 10,
  flexibleTiming: true,
  groupSize: 20,
};

describe('buildPersonaRoutines', () => {
  it('generates family severe-AQI routines when AQI > 150', () => {
    const delhi = buildBaselineReading('New Delhi');
    const routines = buildPersonaRoutines(delhi, BASE_PROFILE);
    expect(routines).toHaveLength(3);
    expect(routines[0]?.title).toContain('Sealed');
    expect(routines[1]?.sourceCitation).toContain('02-hepa-purifier-cadr-sizing.md');
  });

  it('generates family moderate-AQI routines with DIY recommendation when purifier is none', () => {
    const london = buildBaselineReading('London');
    const routines = buildPersonaRoutines(london, {
      ...BASE_PROFILE,
      city: 'London',
      purifier: 'none',
      sensitiveMembers: false,
    });
    expect(routines[0]?.title).toContain('Afternoon Ventilation');
    expect(routines[1]?.title).toContain('DIY Corsi-Rosenthal');
  });

  it('generates commuter timing, mode, and recirculation routines', () => {
    const london = buildBaselineReading('London');
    const flex = buildPersonaRoutines(london, {
      ...BASE_PROFILE,
      persona: 'commuter',
      commuteDistanceKm: 3,
      flexibleTiming: true,
    });
    expect(flex[0]?.title).toContain('Shift Departure');
    expect(flex[1]?.title).toContain('Walking');

    const fixed = buildPersonaRoutines(london, {
      ...BASE_PROFILE,
      persona: 'commuter',
      commuteDistanceKm: 12,
      flexibleTiming: false,
    });
    expect(fixed[0]?.title).toContain('Side-Street');
    expect(fixed[1]?.title).toContain('Metro');
  });

  it('generates community anti-idling and classroom routines', () => {
    const delhi = buildBaselineReading('New Delhi');
    const comm = buildPersonaRoutines(delhi, { ...BASE_PROFILE, persona: 'community' });
    expect(comm).toHaveLength(2);
    expect(comm[0]?.sourceCitation).toContain('anti-idling');
    expect(comm[1]?.priority).toBe('high');

    const london = buildBaselineReading('London');
    expect(
      buildPersonaRoutines(london, { ...BASE_PROFILE, persona: 'community' })[1]?.priority,
    ).toBe('medium');
  });
});
