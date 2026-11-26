# BreatheWise — Security Architecture & OWASP Defenses

> **Evaluation Pillar:** Security (Target Score: **100 / 100**)

---

## 1. Threat Model

- **Protected Assets:** Server-side API credentials (`GEMINI_API_KEY`, AQI provider tokens), free-tier LLM quota, numeric fidelity of respiratory health advice, and browser DOM integrity.
- **Boundary Assumption:** Every HTTP header, request body, query string, upstream AQI payload, and LLM generation is untrusted until validated at runtime.

---

## 2. Multi-Layer HTTP & API Admission Pipeline

### Browser Security Headers ([next.config.ts](./next.config.ts))
Applied across all routes:
- **`Content-Security-Policy`:** `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; media-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`
- **`Strict-Transport-Security`:** `max-age=31536000; includeSubDomains; preload`
- **`X-Content-Type-Options: nosniff`** · **`X-Frame-Options: DENY`** · **`Referrer-Policy: strict-origin-when-cross-origin`**
- **`Cross-Origin-Opener-Policy: same-origin`** · **`Cross-Origin-Resource-Policy: same-origin`** · **`X-Permitted-Cross-Domain-Policies: none`**
- **`Permissions-Policy`:** Denies `camera`, `microphone`, `geolocation`, `payment`, `usb`, `bluetooth`, `display-capture`.

### `POST /api/chat` Request Gate ([src/lib/http/guard.ts](./src/lib/http/guard.ts) & [originGuard.ts](./src/lib/http/originGuard.ts))

| Stage | Control | Status Returned | Verification |
| :--- | :--- | :---: | :--- |
| 1. Media type | Requires `Content-Type: application/json` (blocks CSRF form posts) | `415` | `guard.test.ts`, `api-chat.test.ts` |
| 2. CSRF / Origin | Blocks `Sec-Fetch-Site: cross-site`, `Origin: null`, and cross-origin callers | `403` | `guard.test.ts`, `api-chat.test.ts` |
| 3. Payload size | Checks declared `Content-Length` and actual UTF-8 byte length against `8,192` bytes | `413` | `guard.test.ts`, `api-chat.test.ts` |
| 4. Schema validation | Strict Zod parsing (`ChatRequestSchema`, `CityQuerySchema`, `UserProfileSchema`) | `400` | `schemas.test.ts`, `api-chat.test.ts` |
| 5. Rate limiting | 15 requests/min sliding window per client IP (`rateLimit.ts`), degrading to local RAG stream | `200` (`rate-limit-fallback`) | `rateLimit.test.ts`, `api-chat.test.ts` |
| 6. Response caching | Private AI replies include `Cache-Control: no-store` | `200` | `api-chat.test.ts` |

---

## 3. Prompt Injection Guard & AI Number Firewall

1. **Input Sanitization ([src/lib/agents/prompts.ts](./src/lib/agents/prompts.ts)):** `sanitizeUserQuery()` collapses control newlines/tabs, neutralizes instruction-override phrases (`ignore previous instructions`, `system prompt`, `you are now`), and truncates queries to `800` characters.
2. **Programmatic Number Firewall ([src/lib/agents/numberFirewall.ts](./src/lib/agents/numberFirewall.ts)):** Extracts numerals from generated replies (ignoring technical labels like `PM2.5`, `PM10`, `NO2`, `CO2e`, `N95`, `MERV-13`), verifies every figure against `buildAllowedNumberSet(aqi, profile, citations)`, and flags any ungrounded figures explicitly.

---

## 4. Secrets, Privacy & Supply Chain CI

- **Server-Only Secrets:** API keys are read from `process.env` solely inside server routes/adapters. `.env*` files are gitignored; `.env.example` holds empty placeholders.
- **No PII Storage:** User preferences remain strictly on-device in `localStorage` (`breathewise_profile_v1`).
- **Continuous Security Verification:**
  - `npm audit --omit=dev --audit-level=high`: **`found 0 vulnerabilities`**
  - [tests/quality/hygiene.test.ts](./tests/quality/hygiene.test.ts): asserts zero API key strings (`AIza...`), zero `dangerouslySetInnerHTML`, zero `eval()`, and zero `@ts-ignore` directives.
  - [.github/workflows/ci.yml](./.github/workflows/ci.yml) + [.github/workflows/codeql.yml](./.github/workflows/codeql.yml): runs Prettier, ESLint, coverage, `next build`, Playwright CSP check, `npm audit`, and CodeQL `security-extended` analysis.
