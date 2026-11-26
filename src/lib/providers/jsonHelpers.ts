export function asObj(val: unknown): Record<string, unknown> | null {
  return val !== null && typeof val === 'object' ? (val as Record<string, unknown>) : null;
}

export function asNum(val: unknown): number | null {
  return typeof val === 'number' && Number.isFinite(val) ? val : null;
}

export function asStr(val: unknown): string | undefined {
  return typeof val === 'string' ? val : undefined;
}
