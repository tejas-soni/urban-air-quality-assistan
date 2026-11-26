import type { AqiReading, KbCitation, UserProfile } from '@/lib/types';

/** Technical tokens containing digits that represent standards/pollutants rather than statistics. */
const TECHNICAL_TOKENS =
  /\b(?:PM[ -]?2\.5|PM[ -]?10|PM1|NO2|SO2|O3|CO2e?|CO|N[ -]?95|KN[ -]?95|FFP[ -]?2|MERV[ -]?13|H13|HEPA[ -]?13|WHO|EPA|DEFRA|ASHRAE)\b/gi;

const NUMERAL_PATTERN = /\d+(?:[.,]\d+)*/g;

/** Extracts normalized numeric strings from text after ignoring standard pollutant/filter labels. */
export function extractNumbersFromText(text: string): string[] {
  const cleaned = text.replace(TECHNICAL_TOKENS, ' ');
  const matches = cleaned.match(NUMERAL_PATTERN) ?? [];
  return matches
    .map((token) => Number(token.replace(/,/g, '')))
    .filter((num) => Number.isFinite(num))
    .map((num) => String(num));
}

/** Builds the set of grounded numbers permitted in AI responses for a given context. */
export function buildAllowedNumberSet(
  aqi: AqiReading,
  profile: UserProfile,
  citations: ReadonlyArray<KbCitation>,
  extraTexts: ReadonlyArray<string> = [],
): Set<string> {
  const allowed = new Set<string>(['0', '1', '2', '3', '4', '5', '15', '24', '2021', '2024']);

  const addFromText = (text: string) => {
    for (const num of extractNumbersFromText(text)) {
      allowed.add(num);
    }
  };

  for (const val of [
    aqi.aqi,
    aqi.whoRatio,
    aqi.pollutants.pm25,
    aqi.pollutants.pm10,
    aqi.pollutants.no2,
    aqi.pollutants.o3,
    profile.commuteDistanceKm,
    profile.groupSize,
  ]) {
    if (typeof val === 'number' && Number.isFinite(val)) {
      allowed.add(String(val));
      allowed.add(String(Math.round(val)));
    }
  }

  for (const slot of aqi.forecast24h) {
    allowed.add(String(slot.aqi));
    allowed.add(String(slot.pm25));
    addFromText(slot.hourLabel);
  }

  for (const day of aqi.forecast5d) {
    allowed.add(String(day.minAqi));
    allowed.add(String(day.maxAqi));
    allowed.add(String(day.avgPm25));
  }

  for (const doc of citations) {
    addFromText(doc.title);
    addFromText(doc.snippet);
    addFromText(doc.impactMetric);
  }

  for (const extra of extraTexts) {
    addFromText(extra);
  }

  return allowed;
}

/** Identifies any numeric claim in AI-generated text that is not grounded in verified facts. */
export function findUngroundedNumbers(
  replyText: string,
  allowedNumbers: ReadonlySet<string>,
): string[] {
  const found = extractNumbersFromText(replyText);
  return [...new Set(found.filter((num) => !allowedNumbers.has(num)))];
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
