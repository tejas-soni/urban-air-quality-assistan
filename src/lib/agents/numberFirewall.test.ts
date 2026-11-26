import { describe, it, expect } from 'vitest';
import { buildBaselineReading } from '@/lib/aqi/baseline';
import { searchKnowledgeBase } from '@/lib/rag/loader';
import { DEFAULT_PROFILE } from '@/lib/storage/profile';
import {
  buildAllowedNumberSet,
  extractNumbersFromText,
  findUngroundedNumbers,
  verifyReplyGrounding,
} from './numberFirewall';

describe('AI number firewall', () => {
  it('ignores technical pollutant and respirator labels while normalizing numerals', () => {
    const nums = extractNumbersFromText(
      'During PM2.5 spikes above 1,200.5 µg/m³ wear an N95 or run MERV-13 CADR 350.',
    );
    expect(nums).toEqual(['1200.5', '350']);
  });

  it('permits grounded facts from live AQI, profile, and retrieved KB docs', () => {
    const delhi = buildBaselineReading('New Delhi');
    const docs = searchKnowledgeBase('ventilate at 2 pm vs 8 am pm2.5', {
      persona: 'family',
      limit: 3,
    });
    const allowed = buildAllowedNumberSet(delhi, DEFAULT_PROFILE, docs);

    expect(findUngroundedNumbers(`Delhi PM2.5 is ${delhi.pollutants.pm25} µg/m³`, allowed)).toEqual(
      [],
    );
    const verified = verifyReplyGrounding(`Delhi AQI is ${delhi.aqi}.`, allowed);
    expect(verified.grounded).toBe(true);
    expect(verified.safeText).toBe(`Delhi AQI is ${delhi.aqi}.`);
  });

  it('flags invented statistics not present in context facts', () => {
    const london = buildBaselineReading('London');
    const allowed = buildAllowedNumberSet(london, DEFAULT_PROFILE, []);
    const result = verifyReplyGrounding('This reduces risk by 99.7% across 412 days.', allowed);
    expect(result.grounded).toBe(false);
    expect(result.ungrounded).toContain('99.7');
    expect(result.ungrounded).toContain('412');
    expect(result.safeText).toContain('Grounding Note:');
  });
});
