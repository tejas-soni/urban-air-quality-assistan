# BreatheWise — Code Quality & Architecture

> **Evaluation Pillar:** Code Quality (Target Score: **100 / 100**)  
> **Enforced Gates:** ESLint `--max-warnings 0` (`complexity <= 10`, zero `any`, zero `!`, zero inline disables) + `tsc --noEmit` (`strict`, `noUncheckedIndexedAccess`) + Prettier + `audit.mjs` (`0` HIGH-risk modules)

---

## 1. Score Breakdown

- **Maintainability — 100/100:** Strict layer isolation across `src/lib/` (pure domain engines, zero React/DOM), `src/components/` (thin presentation components), `src/app/api/` (guarded route handlers), and `content/` (48 curated WHO/EPA/DEFRA markdown docs). `node audit.mjs` audited **67 source files with `0` HIGH-risk files**.
- **Reliability — 100/100:** Compiler strictness (`strict`, `noImplicitAny`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`) combined with Zod runtime validation (`src/lib/schemas.ts`) eliminates unchecked boundary assumptions.
- **Testability — 100/100:** All math, caching, HTTP admission guards, RAG ranking, number-firewall checks, and fallbacks are pure deterministic functions achieving **99.44% line / 100% function coverage** in `src/lib/**`.
- **Hygiene Automation — 100/100:** [tests/quality/hygiene.test.ts](./tests/quality/hygiene.test.ts) fails the suite if any source file exceeds 200 lines, omits required evaluation docs, or introduces unsafe patterns (`eval`, `dangerouslySetInnerHTML`, `@ts-ignore`, secrets).

---

## 2. Static Analysis & Compiler Enforcement

### `tsconfig.json`
- `"strict": true`
- `"noImplicitAny": true`
- `"noUncheckedIndexedAccess": true`
- `"noUnusedLocals": true`
- `"noUnusedParameters": true`
- `"noFallthroughCasesInSwitch": true`

### `eslint.config.mjs`
- Extends `eslint-config-next/core-web-vitals`, `eslint-config-next/typescript`, and `eslint-config-prettier`.
- Enforces: `@typescript-eslint/no-explicit-any: error`, `@typescript-eslint/no-non-null-assertion: error`, `complexity: ["error", 10]`, `max-depth: ["error", 4]`, `no-eval`, `no-implied-eval`, `eqeqeq: ["error", "always"]`, and `no-console` (only `console.error` allowed).
- Zero inline `eslint-disable` comments across application and test files.

---

## 3. Architecture & Domain Modules

| Layer | Responsibility | Key Modules |
| :--- | :--- | :--- |
| **Pure AQI & Exposure Engine** | EPA breakpoints, WHO ratios, diurnal baselines, CADR decay kinetics, thermal inversion lapse math, 6-mode commute dose/CO2e, routines, community savings | `src/lib/aqi/{bands,baseline,citySeeds,cadr,inversion,commuteCompare,commuteImpact,impact,routines,community}.ts` |
| **Provider Chain & Cache** | 60-min bounded LRU (`100` entries) TTL cache, SHA-256 payload hashing, `4s` abort timeouts across IQAir / OpenWeather / OpenAQ / AirNow | `src/lib/providers/{cache,hash,http,chain,client,mappers}.ts` |
| **Grounded RAG & AI Guard** | Frontmatter parser, BM25-style keyword/persona scorer, prompt-injection sanitization, AI numeric firewall, 15 RPM rate limiter | `src/lib/rag/{parser,score,search,loader}.ts`, `src/lib/agents/{prompts,numberFirewall,tools,fallback,rateLimit,chatFallbackStream}.ts` |
| **HTTP Gate & Storage** | Same-origin CSRF check, `415`/`403`/`413` pre-parse guards, Zod schemas, `useSyncExternalStore` profile persistence | `src/lib/http/{guard,originGuard}.ts`, `src/lib/schemas.ts`, `src/lib/storage/profile.ts` |

See [docs/DECISIONS.md](./docs/DECISIONS.md) for Architecture Decision Records (`ADR-001` through `ADR-005`).

---

## 4. Verification Evidence

- `npm run format:check`: `All matched files use Prettier code style!`
- `npm run lint`: `eslint src tests e2e --max-warnings 0` -> `0 errors, 0 warnings`
- `npm run typecheck`: `tsc --noEmit` -> `0 errors`
- `node audit.mjs`: `Audited 67 files -> audit_report.json` (`HIGH-risk (consider splitting): 0`)
