import { describe, it, expect } from 'vitest';
import { parseMarkdownDoc } from './parser';

describe('parseMarkdownDoc', () => {
  it('extracts frontmatter, body, and ## Sources footer', () => {
    const raw = `---
id: test-doc
title: Sample Ventilation Guide
category: indoor-hacks
personas: family, commuter
tags: ventilation, timing
impactMetric: 40% reduction
---

Open windows around 2 PM.

## Sources
- US EPA Indoor Air Guide
- WHO 2021 AQG`;

    const doc = parseMarkdownDoc('01-sample', 'indoor-hacks', raw);
    expect(doc.id).toBe('test-doc');
    expect(doc.title).toBe('Sample Ventilation Guide');
    expect(doc.personas).toEqual(['family', 'commuter']);
    expect(doc.tags).toEqual(['ventilation', 'timing']);
    expect(doc.sources).toEqual(['US EPA Indoor Air Guide', 'WHO 2021 AQG']);
  });

  it('falls back cleanly when frontmatter, tags, or sources are missing or invalid', () => {
    const plain = parseMarkdownDoc('fallback-slug', 'health-guidance', 'Plain markdown body.');
    expect(plain.id).toBe('fallback-slug');
    expect(plain.personas).toEqual(['family', 'commuter', 'community']);
    expect(plain.sources).toEqual([]);

    const partialMeta = `---
titleOnlyNoColonLine
personas: invalid-persona
---

Body without sources header.`;
    const partial = parseMarkdownDoc('partial-slug', 'impact-data', partialMeta);
    expect(partial.id).toBe('partial-slug');
    expect(partial.personas).toEqual(['family', 'commuter', 'community']);
    expect(partial.tags).toEqual([]);
    expect(partial.impactMetric).toBe('');
  });
});
