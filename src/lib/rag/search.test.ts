import { describe, it, expect } from 'vitest';
import { searchDocs } from './search';
import type { KbDoc } from '@/lib/types';

const SAMPLE_DOCS: KbDoc[] = [
  {
    id: 'vent',
    slug: '01-vent',
    title: 'Ventilate at 2 PM Instead of 8 AM',
    category: 'indoor-hacks',
    personas: ['family'],
    tags: ['ventilation', 'afternoon'],
    impactMetric: '~40% less indoor PM2.5 intake',
    body: 'Opening windows in the afternoon takes advantage of atmospheric mixing.',
    sources: ['US EPA Ventilation Guide'],
  },
  {
    id: 'commute',
    slug: '02-commute',
    title: 'Shift Commute 30 Minutes Later',
    category: 'impact-data',
    personas: ['commuter'],
    tags: ['commute', 'rush-hour'],
    impactMetric: '~15% lower exposure',
    body: 'Shifting morning departure later avoids peak congestion.',
    sources: ['HEI Traffic Report'],
  },
];

describe('searchDocs', () => {
  it('ranks matching docs and applies persona boost', () => {
    const hits = searchDocs(SAMPLE_DOCS, 'when should I ventilate at 2 pm?', {
      persona: 'family',
      limit: 2,
    });
    expect(hits).toHaveLength(1);
    expect(hits[0]?.id).toBe('vent');
    expect(hits[0]?.sources).toEqual(['US EPA Ventilation Guide']);
  });

  it('returns persona-prioritized fallback matches for stopword-only queries', () => {
    const hits = searchDocs(SAMPLE_DOCS, 'the and for', { persona: 'commuter' });
    expect(hits[0]?.id).toBe('commute');
  });
});
