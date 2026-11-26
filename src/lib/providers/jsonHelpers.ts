/**
 * Zod-backed runtime JSON narrowing helpers without unsafe TypeScript `as` assertions.
 */
import { z } from 'zod';

const PlainObjectSchema = z.record(z.string(), z.unknown());

/** Safely narrows an unknown JSON value into a plain string-keyed record, or returns null. */
export function asObj(val: unknown): Record<string, unknown> | null {
  if (val === null || typeof val !== 'object' || Array.isArray(val)) return null;
  const parsed = PlainObjectSchema.safeParse(val);
  return parsed.success ? parsed.data : null;
}

/** Returns val if it is a finite number, otherwise null. */
export function asNum(val: unknown): number | null {
  return typeof val === 'number' && Number.isFinite(val) ? val : null;
}

/** Returns val if it is a string, otherwise undefined. */
export function asStr(val: unknown): string | undefined {
  return typeof val === 'string' ? val : undefined;
}
