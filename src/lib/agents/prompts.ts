import type { AqiReading, UserProfile } from '@/lib/types';

const MAX_QUERY_LEN = 800;

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/gi,
  /system\s*prompt/gi,
  /you\s+are\s+now\s+/gi,
];

/** Clamps and strips instruction-injection phrases from untrusted user chat input. */
export function sanitizeUserQuery(raw: string): string {
  let clean = raw.replace(/[\r\n\t]+/g, ' ').trim();
  for (const pattern of INJECTION_PATTERNS) {
    clean = clean.replace(pattern, '[redacted]');
  }
  return clean.slice(0, MAX_QUERY_LEN);
}

/** Extracts plain text from the latest user message in AI SDK v7 UIMessage parts or content. */
export function extractLastUserText(
  messages: ReadonlyArray<{
    role: string;
    content?: string;
    parts?: ReadonlyArray<{ type: string; text?: string }>;
  }>,
): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i];
    if (!msg || msg.role !== 'user') continue;
    if (Array.isArray(msg.parts)) {
      const joined = msg.parts
        .filter((p) => p.type === 'text' && typeof p.text === 'string')
        .map((p) => p.text ?? '')
        .join(' ')
        .trim();
      if (joined) return sanitizeUserQuery(joined);
    }
    if (typeof msg.content === 'string' && msg.content.trim()) {
      return sanitizeUserQuery(msg.content);
    }
  }
  return '';
}

const PERSONA_INSTRUCTIONS: Record<UserProfile['persona'], string> = {
  family:
    'Prioritize children, older adults, school runs, afternoon ventilation windows (13:00-16:00), HEPA/Corsi-Rosenthal filtration, and kitchen exhaust.',
  commuter:
    'Prioritize departure timing shifts (+30-60 min), transit vs car vs walk CO2e comparisons, side-street routing, car cabin recirculation, and N95 respirators.',
  community:
    'Prioritize collective school/neighborhood action plans, anti-idling drop-off pledges, classroom clean-air placement, and shareable WhatsApp threshold triggers.',
};

/** Builds the server-side persona-aware system instructions grounding Gemini strictly in cited KB tools. */
export function buildPersonaSystemPrompt(profile: UserProfile, aqiContext?: AqiReading): string {
  const liveLine = aqiContext
    ? `Current baseline context for ${aqiContext.city}: AQI ${aqiContext.aqi} (${aqiContext.band}), PM2.5 ${aqiContext.pollutants.pm25} µg/m³ (${aqiContext.whoRatio}x WHO 24h limit).`
    : `User city: ${profile.city}.`;

  return [
    'You are BreatheWise, a calm, trustworthy Urban Air Quality Assistant.',
    `Active persona: ${profile.persona.toUpperCase()}. ${PERSONA_INSTRUCTIONS[profile.persona]}`,
    liveLine,
    'Always call get_live_aqi for the user city and search_knowledge_base for relevant evidence before giving quantified guidance.',
    'STRICT RULE: Never invent statistics or percentages. Only quote numbers returned by your tools or cited in retrieved /content/*.md sources.',
    'End EVERY recommendation with a "**Quantified Impact & Sources**" section citing the exact source titles/IDs.',
  ].join('\n');
}
