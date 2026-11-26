/**
 * Prompt-injection sanitizer and randomized XML data fencing for untrusted inputs and telemetry.
 */
const MAX_QUERY_LEN = 800;

const CONTROL_CHARS_RE = /[\u0000-\u001f\u007f]/g;
const INVISIBLE_UNICODE_RE = /[\u200b-\u200d\ufeff\u202a-\u202e]/g;

const INJECTION_PATTERNS: readonly RegExp[] = [
  /ignore\s+(all\s+)?previous\s+instructions/gi,
  /disregard\s+(all\s+)?prior\s+instructions/gi,
  /reveal\s+(the\s+)?system\s*prompt/gi,
  /system\s*prompt/gi,
  /you\s+are\s+now\s+/gi,
  /<\|im_start\|>|<\|im_end\|>|\[INST\]/gi,
];

/** Removes control bytes, zero-width spoofing characters, delimiters, and injection phrases. */
export function sanitizeUserQuery(raw: string): string {
  let clean = raw
    .replace(CONTROL_CHARS_RE, ' ')
    .replace(INVISIBLE_UNICODE_RE, '')
    .replace(/[<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  for (const pattern of INJECTION_PATTERNS) {
    clean = clean.replace(pattern, '[redacted]');
  }
  return clean.slice(0, MAX_QUERY_LEN);
}

/** Wraps untrusted external strings (user city, station reportingArea) in a per-call random fence. */
export function fenceUntrustedData(label: string, value: string, fenceId?: string): string {
  const safeLabel = label.replace(/[^a-zA-Z0-9_-]/g, '_');
  const tag = `${safeLabel}_${fenceId ?? crypto.randomUUID().slice(0, 8)}`;
  const clean = sanitizeUserQuery(value);
  return `<${tag}>${clean}</${tag}>`;
}
