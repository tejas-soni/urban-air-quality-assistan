# BreatheWise — Testing & Quality Assurance

> **Evaluation Pillar:** Testing & QA Automation (Target Score: **100 / 100**)

---

## 1. Test Pyramid & Enforced Coverage Gate

Coverage thresholds are strictly enforced in [vitest.config.ts](./vitest.config.ts) across `src/lib/**`, `src/components/**`, and `src/app/api/**` (the build fails automatically if any metric falls below threshold):

| Scope | Lines | Branches | Functions | Statements | Threshold Gate |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Core Engine (`src/lib/**`)** | **99.85%** | **91.63%** | **99.42%** | **99.17%** | `95% / 90% / 95% / 95%` |
| **Global (`src/lib + components + api`)** | **98.73%** | **88.47%** | **96.93%** | **97.90%** | `95% / 88% / 95% / 95%` |

Totals across automated verification: **`37` test files (`36` Vitest + `1` Playwright E2E) · `118` executed test cases (`106` Vitest + `12` Playwright) · `359` `expect()` assertions.**

---

## 2. Automated Verification Suites

| Suite Layer | Files | Scope Covered |
| :--- | :--- | :--- |
| **AQI, CADR, Scenario & Commute Math** | `src/lib/aqi/*.test.ts` | EPA 2024 breakpoints, WHO multiples, NaN/negative guards, CADR ASHRAE decay, inversion lapse rates, scenario simulator, 6-mode transit dose & CO2e, community offsets |
| **Provider Chain, Fetcher & Bounded Cache** | `src/lib/providers/*.test.ts`, `src/lib/api/aqiClient.test.ts` | 60-min TTL expiry, 100-entry LRU eviction, SHA-256 `hashPayload`, Zod client payload validation, 4 provider normalizers, `4s` abort timeouts, fallback chain |
| **HTTP Gate, Security & AI Firewall** | `src/lib/http/*.test.ts`, `src/lib/agents/*.test.ts`, `src/lib/rag/*.test.ts` | `415`/`403`/`413` admission rules (including `same-site` rejection & streaming chunk truncation), CSP nonce header rules, 48 `/content/*.md` sources, prompt guard, live Gemini stream firewall, bounded 15 RPM rate limiter |
| **API Route & Error Boundary Suites** | `tests/api-*.test.ts`, `tests/error-boundaries.test.tsx` | `GET /api/aqi`, `POST /api/chat` (`415`/`403`/`413`/`400`), `X-BreatheWise-Cache`, Gemini mock + error fallback, `RouteError`, `GlobalError`, `NotFound`, UI error alerts |
| **UI Interaction & Accessibility** | `tests/components.test.tsx`, `tests/a11y.test.tsx` | Persona switch, simulator, CADR calculator, commute table, Onboarding, ChatPanel, WhatsApp summary copy, WCAG contrast >= `4.5:1`, `.sr-only` chart twins, `vitest-axe` + negative control |
| **Architectural Conventions & Hygiene** | `tests/quality/conventions.test.ts`, `tests/quality/hygiene.test.ts` | Pure-engine/UI layer isolation, opening doc banners, zero `as` casts, module line limits, required docs, `security.txt`, and zero unsafe DOM/`eval`/secret patterns |
| **Production Browser E2E** | `e2e/app.spec.ts` | Runs against `next build && npx next start -p 3005` with strict nonce CSP on Desktop Chrome + Mobile Pixel 5: WCAG 2.2 AA axe (`0` violations), `0` console/CSP errors, `0` horizontal overflow |

---

## 3. Executed Command Output (Verified)

```text
> npm run verify
  eslint src tests e2e --max-warnings 0   -> 0 errors, 0 warnings
  tsc --noEmit                             -> 0 errors
  vitest run --coverage                    -> Test Files  36 passed (36) · Tests  106 passed (106)
    Global    | 98.73% Lines | 97.90% Stmts | 96.93% Funcs | 88.47% Branch
    src/lib/**| 99.85% Lines | 99.17% Stmts | 99.42% Funcs | 91.63% Branch
  next build                               -> Compiled cleanly (Proxy Middleware + 7 App Router routes + /api/*)

> node audit.mjs
  Audited 88 files -> audit_report.json
  HIGH-risk (consider splitting): 0

> npm run test:e2e
  12 passed (35.0s) [desktop & mobile Pixel 5: 0 WCAG 2.2 AA axe violations, 0 console/CSP errors, 0 overflow]
```
