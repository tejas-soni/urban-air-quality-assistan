import { describe, it, expect } from 'vitest';
import { loadKnowledgeBase, searchKnowledgeBase } from './loader';

describe('curated markdown knowledge base loader', () => {
  it('loads 40-60 curated docs where every doc has cited sources', () => {
    const docs = loadKnowledgeBase();
    expect(docs.length).toBeGreaterThanOrEqual(40);
    expect(docs.length).toBeLessThanOrEqual(60);

    for (const doc of docs) {
      expect(doc.title.length).toBeGreaterThan(5);
      expect(doc.impactMetric.length).toBeGreaterThan(5);
      expect(doc.sources.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('retrieves relevant cited sources for ventilation and commute queries', () => {
    const vent = searchKnowledgeBase('ventilate at 2 pm vs 8 am pm2.5', { persona: 'family' });
    expect(vent.length).toBeGreaterThan(0);
    expect(vent[0]?.id).toBe('afternoon-ventilation-timing');

    const commute = searchKnowledgeBase('shift commute 30 min metro emission', {
      persona: 'commuter',
    });
    expect(commute.length).toBeGreaterThan(0);
  });
});
