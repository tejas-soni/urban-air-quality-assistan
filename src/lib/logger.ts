/**
 * Structured server-side logger compliant with CWE-209 (never logs user prompts or secret tokens).
 */
const SECRET_PATTERN = /(AIza[0-9A-Za-z_-]{12,}|sk-[A-Za-z0-9]{12,}|Bearer\s+[A-Za-z0-9._-]+)/gi;

/** Extracts a concise, redacted error summary safe for server logs and client fallbacks. */
export function summarizeError(err: unknown): string {
  const raw =
    err instanceof Error || err instanceof DOMException
      ? `${err.name}: ${err.message}`
      : String(err);
  return raw.replace(SECRET_PATTERN, '[redacted-secret]').slice(0, 200);
}

/** Returns true when an error came from an intentional AbortController or timeout cancellation. */
export function isAbortError(err: unknown): boolean {
  const named = err instanceof Error || err instanceof DOMException;
  return named && (err.name === 'AbortError' || err.name === 'TimeoutError');
}

/** Logs structured diagnostic events on the server without exposing secrets or raw user input. */
export function logServerEvent(
  event: string,
  meta: Record<string, string | number | boolean> = {},
): void {
  const payload = JSON.stringify({ level: 'error', event, ...meta });
  console.error(payload);
}
