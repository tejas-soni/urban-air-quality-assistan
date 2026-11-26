import { describe, it, expect } from 'vitest';
import {
  pm25ToUsAqi,
  classifyAqi,
  whoGuidelineRatio,
  aqiHealthSummary,
  WHO_PM25_24H_GUIDELINE,
} from './bands';

describe('pm25ToUsAqi', () => {
  it('computes exact EPA 2024 breakpoints across ranges', () => {
    expect(pm25ToUsAqi(0)).toBe(0);
    expect(pm25ToUsAqi(9.0)).toBe(50);
    expect(pm25ToUsAqi(35.4)).toBe(100);
    expect(pm25ToUsAqi(55.4)).toBe(150);
    expect(pm25ToUsAqi(125.4)).toBe(200);
    expect(pm25ToUsAqi(225.4)).toBe(300);
    expect(pm25ToUsAqi(500.4)).toBe(500);
  });

  it('handles negative, NaN, and extreme inputs safely', () => {
    expect(pm25ToUsAqi(-5)).toBe(0);
    expect(pm25ToUsAqi(Number.NaN)).toBe(0);
    expect(pm25ToUsAqi(900)).toBe(500);
  });
});

describe('classifyAqi', () => {
  it('maps every EPA band boundary with text label and icon', () => {
    expect(classifyAqi(0).band).toBe('good');
    expect(classifyAqi(50).band).toBe('good');
    expect(classifyAqi(51).band).toBe('moderate');
    expect(classifyAqi(100).band).toBe('moderate');
    expect(classifyAqi(101).band).toBe('usg');
    expect(classifyAqi(150).band).toBe('usg');
    expect(classifyAqi(151).band).toBe('unhealthy');
    expect(classifyAqi(200).band).toBe('unhealthy');
    expect(classifyAqi(201).band).toBe('very-unhealthy');
    expect(classifyAqi(300).band).toBe('very-unhealthy');
    expect(classifyAqi(301).band).toBe('hazardous');
  });

  it('guards negative and NaN AQI values', () => {
    expect(classifyAqi(-10).band).toBe('good');
    expect(classifyAqi(Number.NaN).band).toBe('good');
  });
});

describe('whoGuidelineRatio and aqiHealthSummary', () => {
  it('computes WHO 24h PM2.5 ratio cleanly', () => {
    expect(WHO_PM25_24H_GUIDELINE).toBe(15);
    expect(whoGuidelineRatio(15)).toBe(1);
    expect(whoGuidelineRatio(60)).toBe(4);
    expect(whoGuidelineRatio(-3)).toBe(0);
    expect(whoGuidelineRatio(Number.NaN)).toBe(0);
  });

  it('builds tailored persona summaries', () => {
    expect(aqiHealthSummary('unhealthy', 'family')).toContain('HEPA');
    expect(aqiHealthSummary('usg', 'commuter')).toContain('N95');
    expect(aqiHealthSummary('good', 'commuter')).toContain('Good:');
    expect(aqiHealthSummary('very-unhealthy', 'community')).toContain('no-idling');
    expect(aqiHealthSummary('good', 'community')).toContain('Good:');
  });
});
