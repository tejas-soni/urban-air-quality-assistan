import { aqiHealthSummary, classifyAqi } from '@/lib/aqi/bands';
import { buildPersonaRoutines } from '@/lib/aqi/routines';
import type { AqiReading, KbCitation, UserProfile } from '@/lib/types';

/** Formats a deterministic, cited, quantified answer when Gemini API key is absent or unavailable. */
export function buildFallbackAnswer(
  query: string,
  profile: UserProfile,
  aqi: AqiReading,
  citations: ReadonlyArray<KbCitation>,
): string {
  const band = classifyAqi(aqi.aqi);
  const routines = buildPersonaRoutines(aqi, profile);
  const topRoutine = routines[0];
  const topCitation = citations[0];

  const header = `**Live Air Check — ${aqi.city}: AQI ${aqi.aqi} (${band.label})**\nPM2.5 is **${aqi.pollutants.pm25} µg/m³** (${aqi.whoRatio}x the WHO 24-hour guideline of 15 µg/m³). ${aqiHealthSummary(aqi.band, profile.persona)}`;

  const guidanceLines = citations.slice(0, 2).map((c) => `- **${c.title}:** ${c.snippet}`);
  const routineLine = topRoutine
    ? `- **Priority ${profile.persona} action (${topRoutine.windowLabel}):** ${topRoutine.action}`
    : `- **Priority ${profile.persona} action:** Follow ${band.label} exposure precautions.`;

  const sourceList =
    citations.length > 0
      ? citations.map((c) => `[${c.id}] ${c.title} — ${c.sources[0] ?? 'WHO / US EPA KB'}`)
      : [topRoutine?.sourceCitation ?? 'WHO 2021 Global Air Quality Guidelines'];

  const fallbackHeadline =
    topRoutine?.impact.headline ?? `${band.label} guidance: minimize peak smog exposure`;
  const impactSummary = topCitation?.impactMetric || fallbackHeadline;

  return [
    header,
    '',
    `Here is your tailored plan for *"${query || 'today'}"*:`,
    routineLine,
    ...guidanceLines,
    '',
    '**Quantified Impact & Sources**',
    `- **Estimated impact:** ${fallbackHeadline} (${impactSummary})`,
    ...sourceList.map((s) => `- Source: ${s}`),
  ].join('\n');
}
