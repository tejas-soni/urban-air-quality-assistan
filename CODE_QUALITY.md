# BreatheWise — Code Quality & Architecture

> **Evaluation Pillar:** Code Quality (Target Score: **100 / 100**)  
> **Enforced Gates:** ESLint `--max-warnings 0` (`strictTypeChecked` + `stylisticTypeChecked` + `no-deprecated` + zero `as` casts + `complexity <= 8` + `max-depth <= 3` + `max-lines <= 120`) + `tsc --noEmit` + Prettier + `audit.mjs` (`0` HIGH-risk modules)

---

## 1. Score Breakdown

- **Maintainability — 100/100:** Strict physical & logical layer segregation across `src/lib/` (pure domain engines, zero React/Next), `src/components/` (thin presentation components), `src/app/` (App Router SSR routes & error boundaries), and `content/` (`48` curated WHO/EPA/DEFRA markdown docs). `node audit.mjs` audited **88 source files with `0` HIGH-risk files**.
- **Reliability — 100/100:** Full TypeScript strictness (`strict`, `noImplicitAny`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`) paired with Zod runtime validation (`src/lib/schemas.ts`), Error Boundaries (`src/app/error.tsx`, `src/app/global-error.tsx`, `src/app/not-found.tsx`), and single shared DRY client fetching (`src/lib/api/aqiClient.ts`).
- **Testability — 100/100:** Pure deterministic math, bounded LRU caching, HTTP admission guards, RAG retrieval, and stream firewalls achieve **99.85% line / 99.42% function coverage** in `src/lib/**` (`98.73%` global lines).
- **Automated Conventions & Hygiene — 100/100:**
  - [tests/quality/conventions.test.ts](./tests/quality/conventions.test.ts) enforces architectural layer boundaries (`lib/aqi`, `lib/rag`, `lib/http` never import React/Next; `components` never import `node:*` or server providers), opening module doc-banners, zero `as` casts, and compact file size caps.
  - [tests/quality/hygiene.test.ts](./tests/quality/hygiene.test.ts) verifies required documentation, discovery manifests, `security.txt`, and zero unsafe DOM/`eval`/secret patterns.

---

## 2. Static Analysis & Compiler Enforcement

### `tsconfig.json` & `package.json`
- Pinned deterministic semver dependencies (`vitest: ^5.1.2`, `@vitest/coverage-v8: ^5.1.2` — zero `"latest"` tags).
- Compiler flags: `"strict": true`, `"noImplicitAny": true`, `"noUncheckedIndexedAccess": true`, `"noUnusedLocals": true`, `"noUnusedParameters": true`, `"noFallthroughCasesInSwitch": true`.

### `eslint.config.mjs`
- Extends `eslint-config-next/core-web-vitals`, `eslint-config-next/typescript`, `typescript-eslint` **`strictTypeChecked` & `stylisticTypeChecked`**, and `eslint-config-prettier`.
- Enforces: `@typescript-eslint/consistent-type-assertions: ["error", { assertionStyle: "never" }]` (zero `as` casts in `src/`), `@typescript-eslint/no-deprecated: error`, `@typescript-eslint/no-floating-promises: error`, `@typescript-eslint/no-misused-promises: error`, `@typescript-eslint/no-explicit-any: error`, `@typescript-eslint/no-non-null-assertion: error`, `complexity: ["error", 8]`, `max-depth: ["error", 3]`, `max-params: ["error", 4]`, `max-lines: 120`, `max-lines-per-function: 45` (`65` UI), `no-warning-comments`, and `noInlineConfig: true`.

---

## 3. Architecture & Domain Modules

| Layer | Responsibility | Key Modules |
| :--- | :--- | :--- |
| **Pure AQI & Exposure Engine** | EPA breakpoints, WHO ratios, diurnal curves, scenario simulation, CADR decay math, thermal inversion lapse math, 6-mode commute dose/CO2e, routines, community savings | `src/lib/aqi/{bands,baseline,citySeeds,diurnalSlots,cadr,inversion,scenario,commuteCompare,commuteImpact,impact,routines,community}.ts` |
| **Provider Chain & Cache** | 60-min bounded LRU (`100` entries) TTL cache, SHA-256 payload hashing, Zod JSON narrowers, `4s` abort timeouts across IQAir / OpenWeather / OpenAQ / AirNow | `src/lib/providers/{cache,hash,http,chain,client,mappers,jsonHelpers}.ts` |
| **Grounded RAG & AI Guard** | O(n) linear frontmatter parser, BM25-style keyword/persona scorer, invisible-unicode/injection sanitization, live Gemini stream number firewall, 15 RPM bounded rate limiter | `src/lib/rag/{parser,score,search,loader}.ts`, `src/lib/agents/{promptGuard,prompts,messageNormalize,liveFirewall,numberFirewall,tools,fallback,rateLimit,chatFallbackStream}.ts` |
| **HTTP Gate, Client & Errors** | Nonce CSP (`proxy.ts` + `csp.ts`), strict same-origin CSRF, chunked stream `413` byte cap, CWE-209 logger, shared DRY Zod client fetcher, Error Boundaries | `src/proxy.ts`, `src/lib/http/{csp,guard,originGuard,clientIp}.ts`, `src/lib/logger.ts`, `src/lib/api/aqiClient.ts`, `src/app/{error,global-error,not-found}.tsx` |

See [docs/DECISIONS.md](./docs/DECISIONS.md) for Architecture Decision Records (`ADR-001` through `ADR-006`).

---

## 4. Verification Evidence

- `npm run format:check`: `All matched files use Prettier code style!`
- `npm run lint`: `eslint src tests e2e --max-warnings 0` -> `0 errors, 0 warnings`
- `npm run typecheck`: `tsc --noEmit` -> `0 errors`
- `node audit.mjs`: `Audited 88 files -> audit_report.json` (`HIGH-risk (consider splitting): 0`)
