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

  it('falls back cleanly when frontmatter or sources are missing', () => {
    const doc = parseMarkdownDoc('fallback-slug', 'health-guidance', 'Plain markdown body.');
    expect(doc.id).toBe('fallback-slug');
    expect(doc.personas).toEqual(['family', 'commuter', 'community']);
    expect(doc.sources).toEqual([]);
  });
});
