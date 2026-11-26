/**
 * Pre-parse POST admission gate and streaming UTF-8 byte-capped JSON body reader.
 */
import { checkSameOrigin } from '@/lib/http/originGuard';

export const DEFAULT_MAX_BODY_BYTES = 8192;

export type AdmissionResult = { ok: true } | { ok: false; status: 403 | 413 | 415; error: string };

export type BodyReadResult =
  { ok: true; data: unknown } | { ok: false; status: 400 | 413; error: string };

/** Verifies Content-Type, same-origin CSRF headers, and declared Content-Length before body read. */
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
  if (Number.isFinite(declared) && declared > maxBytes) {
    return { ok: false, status: 413, error: `Payload exceeds ${maxBytes} byte limit` };
  }
  return { ok: true };
}

function parseJsonPayload(rawText: string): BodyReadResult {
  try {
    const parsed: unknown = JSON.parse(rawText);
    return { ok: true, data: parsed };
  } catch {
    return { ok: false, status: 400, error: 'Malformed JSON body' };
  }
}

async function readStreamCapped(
  body: ReadableStream<Uint8Array>,
  maxBytes: number,
): Promise<{ ok: true; text: string } | { ok: false; status: 413; error: string }> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let totalBytes = 0;
  let step = await reader.read();

  while (!step.done) {
    totalBytes += step.value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel().catch(() => undefined);
      return { ok: false, status: 413, error: `Payload exceeds ${maxBytes} byte limit` };
    }
    chunks.push(decoder.decode(step.value, { stream: true }));
    step = await reader.read();
  }
  chunks.push(decoder.decode());
  return { ok: true, text: chunks.join('') };
}

/** Reads request body bytes up to maxBytes UTF-8 bytes (cancelling stream early) and parses JSON. */
export async function readJsonBodyCapped(
  req: Request,
  maxBytes: number = DEFAULT_MAX_BODY_BYTES,
): Promise<BodyReadResult> {
  try {
    if (req.body) {
      const streamRes = await readStreamCapped(req.body, maxBytes);
      return streamRes.ok ? parseJsonPayload(streamRes.text) : streamRes;
    }
    const rawText = await req.text();
    if (new TextEncoder().encode(rawText).byteLength > maxBytes) {
      return { ok: false, status: 413, error: `Payload exceeds ${maxBytes} byte limit` };
    }
    return parseJsonPayload(rawText);
  } catch {
    return { ok: false, status: 400, error: 'Unable to read request body' };
  }
}
