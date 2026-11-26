/**
 * Deterministic fallback assistant reply builder formatting cited KB guidance cleanly.
 */
import { aqiHealthSummary, classifyAqi } from '@/lib/aqi/bands';
import { buildPersonaRoutines } from '@/lib/aqi/routines';
import type { AqiReading, KbCitation, RoutineRecommendation, UserProfile } from '@/lib/types';

function formatSourceLines(
  citations: readonly KbCitation[],
  topRoutine?: RoutineRecommendation,
): string[] {
  if (citations.length > 0) {
    return citations.map((c) => `[${c.id}] ${c.title} — ${c.sources[0] ?? 'WHO / US EPA KB'}`);
  }
  return [topRoutine?.sourceCitation ?? 'WHO 2021 Global Air Quality Guidelines'];
}

function pickImpactSummary(topCitation?: KbCitation, fallbackHeadline = ''): string {
  const metric = topCitation?.impactMetric;
  return metric && metric.length > 0 ? metric : fallbackHeadline;
}

/** Formats a deterministic, cited, quantified answer when Gemini API key is absent or unavailable. */
export function buildFallbackAnswer(
  query: string,
  profile: UserProfile,
  aqi: AqiReading,
  citations: readonly KbCitation[],
): string {
  const band = classifyAqi(aqi.aqi);
  const topRoutine = buildPersonaRoutines(aqi, profile)[0];
  const topCitation = citations[0];

  const header = `**Live Air Check — ${aqi.city}: AQI ${aqi.aqi} (${band.label})**\nPM2.5 is **${aqi.pollutants.pm25} µg/m³** (${aqi.whoRatio}x the WHO 24-hour guideline of 15 µg/m³). ${aqiHealthSummary(aqi.band, profile.persona)}`;
  const routineLine = topRoutine
    ? `- **Priority ${profile.persona} action (${topRoutine.windowLabel}):** ${topRoutine.action}`
    : `- **Priority ${profile.persona} action:** Follow ${band.label} exposure precautions.`;

  const fallbackHeadline =
    topRoutine?.impact.headline ?? `${band.label} guidance: minimize peak smog exposure`;
  const impactSummary = pickImpactSummary(topCitation, fallbackHeadline);
  const sourceLines = formatSourceLines(citations, topRoutine);

  return [
    header,
    '',
    `Here is your tailored plan for *"${query || 'today'}"*:`,
    routineLine,
    ...citations.slice(0, 2).map((c) => `- **${c.title}:** ${c.snippet}`),
    '',
    '**Quantified Impact & Sources**',
    `- **Estimated impact:** ${fallbackHeadline} (${impactSummary})`,
    ...sourceLines.map((s) => `- Source: ${s}`),
  ].join('\n');
}
