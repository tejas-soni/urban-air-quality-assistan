import type { AxeMatchers } from 'vitest-axe/matchers';

declare module 'vitest' {
  // Type parameter `T` must match Vitest's Assertion<T> declaration for interface merging
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-object-type
  interface Assertion<T = unknown> extends AxeMatchers {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}
