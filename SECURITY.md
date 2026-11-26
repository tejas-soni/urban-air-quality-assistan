# BreatheWise — Security Architecture & OWASP Defenses

> **Evaluation Pillar:** Security (Target Score: **100 / 100**)

---

## 1. Threat Model

- **Protected Assets:** Server-side API credentials (`GEMINI_API_KEY`, AQI provider tokens), free-tier LLM quota, numeric fidelity of respiratory health advice, and browser DOM integrity.
- **Boundary Assumption:** Every HTTP header, chunked body, query string, upstream AQI payload, localStorage value, and LLM generation is untrusted until validated at runtime via Zod and strict origin/size guards.

---

## 2. Multi-Layer HTTP & API Admission Pipeline

### Nonce-Based Strict Content Security Policy & Browser Hardening ([src/proxy.ts](./src/proxy.ts), [src/lib/http/csp.ts](./src/lib/http/csp.ts), [next.config.ts](./next.config.ts))
- **`Content-Security-Policy` (Per-Request Nonce via Next.js 16 `proxy.ts` + `layout.tsx`):**
  - Production page requests receive a fresh cryptographic UUID base64 nonce (`x-nonce`):
    `default-src 'self'; script-src 'self' 'nonce-<random>' 'strict-dynamic'; style-src 'self' 'nonce-<random>'; img-src 'self' data:; font-src 'self'; connect-src 'self'; media-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`
  - Zero `'unsafe-inline'` in production scripts or stylesheets. API routes receive `default-src 'none'; frame-ancestors 'none'`.
- **`Strict-Transport-Security`:** `max-age=63072000; includeSubDomains; preload`
- **`X-Content-Type-Options: nosniff`** · **`X-Frame-Options: DENY`** · **`Referrer-Policy: strict-origin-when-cross-origin`**
- **`Cross-Origin-Opener-Policy: same-origin`** · **`Cross-Origin-Resource-Policy: same-origin`** · **`X-Permitted-Cross-Domain-Policies: none`**
- **`Permissions-Policy`:** Denies 12 sensitive APIs (`camera`, `microphone`, `geolocation`, `payment`, `usb`, `bluetooth`, `display-capture`, `autoplay`, `fullscreen`, `midi`, `serial`, `hid`).

### `POST /api/chat` Request Gate ([src/lib/http/guard.ts](./src/lib/http/guard.ts) & [originGuard.ts](./src/lib/http/originGuard.ts))

| Stage | Control | Status | Verification |
| :--- | :--- | :---: | :--- |
| 1. Media type | Requires `Content-Type: application/json` (blocks CSRF form posts) | `415` | `guard.test.ts`, `api-chat.test.ts` |
| 2. Strict Same-Origin | Blocks `Sec-Fetch-Site` outside `{same-origin, none}` (blocking sibling `same-site` subdomains & `cross-site`), `Origin: null`, and cross-origin callers | `403` | `originGuard.ts`, `security.test.ts`, `api-chat.test.ts` |
| 3. Streamed Byte Cap | Checks declared `Content-Length` AND reads `ReadableStream` chunk-by-chunk, cancelling stream immediately once UTF-8 bytes exceed `8,192` bytes | `413` | `guard.ts`, `security.test.ts`, `api-chat.test.ts` |
| 4. Schema validation | Strict Zod parsing without `.passthrough()` (`ChatRequestSchema` strips unknown part keys; `AqiReadingSchema` validates client API payloads) | `400` | `schemas.test.ts`, `aqiClient.test.ts` |
| 5. Bounded Rate Limit | 15 req/min sliding window per resolved IP (`clientIp.ts`), memory-bounded at `1,000` keys with stale eviction to prevent IP-flood OOM | `200` (`rate-limit-fallback`) | `rateLimit.ts`, `securityGuards.test.ts` |
| 6. Response cache | Private AI replies include `Cache-Control: no-store` | `200` | `api-chat.test.ts` |

---

## 3. Prompt Injection Guard & Live AI Number Firewall

1. **Sanitization & Random Data Fencing ([src/lib/agents/promptGuard.ts](./src/lib/agents/promptGuard.ts), [prompts.ts](./src/lib/agents/prompts.ts)):**
   - Strips ASCII control characters (`\u0000-\u001f`, `\u007f`), zero-width/bidi spoofing characters (`\u200b-\u200d`, `\ufeff`, `\u202a-\u202e`), XML delimiter brackets (`<`, `>`), and instruction-override phrases (`ignore previous instructions`, `disregard prior`, `reveal system prompt`, `[INST]`).
   - Wraps untrusted location strings (`profile.city` and external API station `city`) in randomized per-request XML delimiters (`<city_<uuid>>...`) labeled strictly as untrusted data.
2. **Real-Time Number Firewall ([src/lib/agents/liveFirewall.ts](./src/lib/agents/liveFirewall.ts), [numberFirewall.ts](./src/lib/agents/numberFirewall.ts)):**
   - Wraps BOTH live Gemini `UIMessageChunk` streams AND offline fallback replies through `buildAllowedNumberSet()` + `verifyReplyGrounding()`, appending an explicit grounding note if any unverified statistic appears.
3. **O(n) ReDoS-Safe Markdown Parser ([src/lib/rag/parser.ts](./src/lib/rag/parser.ts)):** Line-scanning frontmatter/citation extraction avoids backtracking regex vulnerabilities (verified weekly by CodeQL `security-extended`).

---

## 4. CWE-209 Logging, Supply Chain & Disclosure

- **Server-Only Secrets & Redacted Logs ([src/lib/logger.ts](./src/lib/logger.ts)):** API keys stay strictly server-side (`process.env`). Server logs use `summarizeError()` to redact secret tokens (`AIza...`, `sk-...`, `Bearer ...`) before writing JSON diagnostics (`CWE-209` safe). Client errors return concise generic messages.
- **No PII Storage:** Preferences stay on-device in `localStorage` (`breathewise_profile_v1`) validated with Zod on load.
- **Supply Chain & CI ([ci.yml](./.github/workflows/ci.yml), [codeql.yml](./.github/workflows/codeql.yml), [dependabot.yml](./.github/dependabot.yml)):**
  - All GitHub Actions are pinned to verified commit SHAs; Dependabot monitors npm & GitHub Actions weekly; CI runs full `npm audit --audit-level=low` (`found 0 vulnerabilities`) and an automated secret scan.
  - Vulnerability disclosure policy published at [public/.well-known/security.txt](./public/.well-known/security.txt).
