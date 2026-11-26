import { describe, it, expect } from 'vitest';
import { buildBaselineReading } from '@/lib/aqi/baseline';
import { buildFallbackAnswer } from './fallback';
import type { KbCitation, UserProfile } from '@/lib/types';

const PROFILE: UserProfile = {
  persona: 'family',
  city: 'New Delhi',
  sensitiveMembers: true,
  purifier: 'hepa',
  commuteMode: 'car',
  commuteDistanceKm: 10,
  flexibleTiming: true,
  groupSize: 20,
};

describe('buildFallbackAnswer', () => {
  it('produces grounded answer with quantified impact and cited sources', () => {
    const aqi = buildBaselineReading('New Delhi');
    const citations: KbCitation[] = [
      {
        id: 'afternoon-ventilation-timing',
        title: 'Ventilate at 2 PM Instead of 8 AM',
        category: 'indoor-hacks',
        impactMetric: '~35-45% less outdoor PM2.5 infiltration',
        snippet: 'Opening windows at 14:00 avoids morning inversion peaks.',
        sources: ['US EPA Ventilation Guide'],
        score: 8,
      },
    ];

    const out = buildFallbackAnswer('When should we open windows?', PROFILE, aqi, citations);
    expect(out).toContain('New Delhi');
    expect(out).toContain('Quantified Impact & Sources');
    expect(out).toContain('US EPA Ventilation Guide');
  });

  it('handles empty citations and blank query safely', () => {
    const aqi = buildBaselineReading('London');
    const out = buildFallbackAnswer('', PROFILE, aqi, []);
    expect(out).toContain('London');
    expect(out).toContain('content/indoor-hacks');
  });
});
