import { describe, it, expect } from 'vitest';
import { buildBaselineReading } from './baseline';
import { buildCommunityActionPlan } from './community';

describe('buildCommunityActionPlan', () => {
  it('generates severe-alert community plan and WhatsApp summary', () => {
    const delhi = buildBaselineReading('New Delhi');
    const plan = buildCommunityActionPlan(
      {
        groupName: 'Greenwood School PTA',
        city: 'New Delhi',
        households: 45,
        carTripsReplaced: 20,
      },
      delhi,
    );
    expect(plan.co2SavedKgDay).toBe(13.7);
    expect(plan.triggers[1]).toContain('RED ALERT');
    expect(plan.whatsappSummary).toContain('Greenwood School PTA');
    expect(plan.sources.length).toBeGreaterThanOrEqual(3);
  });

  it('generates moderate-alert community plan for lower AQI cities', () => {
    const london = buildBaselineReading('London');
    const plan = buildCommunityActionPlan(
      { groupName: 'Camden Walkers', city: 'London', households: 15, carTripsReplaced: 10 },
      london,
    );
    expect(plan.triggers[1]).toContain('ORANGE/MODERATE');
  });
});
