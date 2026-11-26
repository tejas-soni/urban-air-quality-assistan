import { checkSameOrigin } from '@/lib/http/originGuard';

export const DEFAULT_MAX_BODY_BYTES = 8192;

export type AdmissionResult = { ok: true } | { ok: false; status: 403 | 413 | 415; error: string };

export type BodyReadResult =
  { ok: true; data: unknown } | { ok: false; status: 400 | 413; error: string };

/** Verifies Content-Type, same-origin CSRF headers, and declared Content-Length before body parsing. */
export function checkPostAdmission(
  req: Request,
  maxBytes: number = DEFAULT_MAX_BODY_BYTES,
): AdmissionResult {
  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return { ok: false, status: 415, error: 'Unsupported Media Type: expected application/json' };
  }
  const originCheck = checkSameOrigin(req);
  if (!originCheck.ok) return originCheck;

  const declared = Number(req.headers.get('content-length') ?? '');
  if (declared > maxBytes) {
    return { ok: false, status: 413, error: `Payload exceeds ${maxBytes} byte limit` };
  }
  return { ok: true };
}

/** Reads request body text up to maxBytes UTF-8 bytes and parses JSON safely. */
export async function readJsonBodyCapped(
  req: Request,
  maxBytes: number = DEFAULT_MAX_BODY_BYTES,
): Promise<BodyReadResult> {
  let rawText = '';
  try {
    rawText = await req.text();
  } catch {
    return { ok: false, status: 400, error: 'Unable to read request body' };
  }

  const byteLength = new TextEncoder().encode(rawText).byteLength;
  if (byteLength > maxBytes) {
    return { ok: false, status: 413, error: `Payload exceeds ${maxBytes} byte limit` };
  }

  try {
    return { ok: true, data: JSON.parse(rawText) as unknown };
  } catch {
    return { ok: false, status: 400, error: 'Malformed JSON body' };
  }
}
