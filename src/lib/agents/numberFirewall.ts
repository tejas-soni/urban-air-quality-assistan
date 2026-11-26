/**
 * Programmatic numeric firewall verifying AI replies contain only grounded context numerals.
 */
import type { AqiReading, KbCitation, UserProfile } from '@/lib/types';

const TECHNICAL_TOKENS =
  /\b(?:PM[ -]?2\.5|PM[ -]?10|PM1|NO2|SO2|O3|CO2e?|CO|N[ -]?95|KN[ -]?95|FFP[ -]?2|MERV[ -]?13|H13|HEPA[ -]?13|WHO|EPA|DEFRA|ASHRAE)\b/gi;

const NUMERAL_PATTERN = /\d+(?:[.,]\d+)*/g;
const BASELINE_NUMBERS = ['0', '1', '2', '3', '4', '5', '15', '24', '2021', '2024'];

/** Extracts normalized numeric strings from text after ignoring standard pollutant/filter labels. */
export function extractNumbersFromText(text: string): string[] {
  const cleaned = text.replace(TECHNICAL_TOKENS, ' ');
  const matches = cleaned.match(NUMERAL_PATTERN) ?? [];
  return matches
    .map((token) => Number(token.replace(/,/g, '')))
    .filter((num) => Number.isFinite(num))
    .map((num) => String(num));
}

function addTokens(allowed: Set<string>, text: string): void {
  for (const num of extractNumbersFromText(text)) {
    allowed.add(num);
  }
}

function addScalarMetrics(allowed: Set<string>, aqi: AqiReading, profile: UserProfile): void {
  const scalars: (number | null)[] = [
    aqi.aqi,
    aqi.whoRatio,
    aqi.pollutants.pm25,
    aqi.pollutants.pm10,
    aqi.pollutants.no2,
    aqi.pollutants.o3,
    profile.commuteDistanceKm,
    profile.groupSize,
  ];
  for (const val of scalars) {
    if (val === null || !Number.isFinite(val)) continue;
    allowed.add(String(val));
    allowed.add(String(Math.round(val)));
  }
}

/** Builds the set of grounded numbers permitted in AI responses for a given context. */
export function buildAllowedNumberSet(
  aqi: AqiReading,
  profile: UserProfile,
  citations: readonly KbCitation[],
  extraTexts: readonly string[] = [],
): Set<string> {
  const allowed = new Set<string>(BASELINE_NUMBERS);
  addScalarMetrics(allowed, aqi, profile);

  for (const slot of aqi.forecast24h) {
    allowed.add(String(slot.aqi));
    allowed.add(String(slot.pm25));
    addTokens(allowed, slot.hourLabel);
  }
  for (const day of aqi.forecast5d) {
    allowed.add(String(day.minAqi));
    allowed.add(String(day.maxAqi));
    allowed.add(String(day.avgPm25));
  }
  for (const doc of citations) {
    addTokens(allowed, `${doc.title} ${doc.snippet} ${doc.impactMetric}`);
  }
  for (const extra of extraTexts) {
    addTokens(allowed, extra);
  }
  return allowed;
}

/** Identifies any numeric claim in AI-generated text that is not grounded in verified facts. */
export function findUngroundedNumbers(
  replyText: string,
  allowedNumbers: ReadonlySet<string>,
): string[] {
  return [...new Set(extractNumbersFromText(replyText).filter((num) => !allowedNumbers.has(num)))];
}

/** Verifies AI text against grounded context numbers and attaches an audit note on mismatches. */
export function verifyReplyGrounding(
  replyText: string,
  allowedNumbers: ReadonlySet<string>,
): { grounded: boolean; ungrounded: string[]; safeText: string } {
  const ungrounded = findUngroundedNumbers(replyText, allowedNumbers);
  if (ungrounded.length === 0) {
    return { grounded: true, ungrounded: [], safeText: replyText };
  }
  const warning = `\n\n> **Grounding Note:** Some figures (${ungrounded.join(', ')}) came from general phrasing rather than retrieved WHO/EPA records. Rely on the cited **Quantified Impact & Sources** metrics.`;
  return { grounded: false, ungrounded, safeText: `${replyText}${warning}` };
}
