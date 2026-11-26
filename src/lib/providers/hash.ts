import { createHash } from 'node:crypto';

/** Produces a fixed-length SHA-256 hex key for deterministic server-side caching. */
export function hashPayload(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 16);
}
