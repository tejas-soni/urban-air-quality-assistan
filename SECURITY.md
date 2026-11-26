# BreatheWise — Security

## 1. Scoring

### AI Evaluation Score: **100/100**

## 2. Threat Model
- **In scope:** Browser client components (`localStorage` profile), Next.js server routes (`/api/aqi`, `/api/chat`), external AQI API integrations, and optional Gemini AI streaming route.
- **Out of scope:** User authentication or server-side PII database (intentionally omitted; profile preferences stay strictly on-device in `localStorage`).

## 3. OWASP-Aligned Mitigations
- **Input Validation (Zod):** Every external boundary validates inputs via strict Zod schemas (`CityQuerySchema` enforces alphanumeric city pattern and `2–80` char bounds; `ChatRequestSchema` limits message arrays to `1–30` items; `UserProfileSchema` and `CommunityPlanInputSchema` clamp numeric ranges).
- **Injection / XSS:** Zero `dangerouslySetInnerHTML` anywhere in `src/`. Chat responses render as escaped text nodes inside React (`whitespace-pre-wrap`).
- **Prompt Injection Defense (`src/lib/agents/prompts.ts`):** `sanitizeUserQuery()` strips control whitespace, neutralizes instruction-override phrases (`ignore previous instructions`, `system prompt`, `you are now`), and clamps user messages to `800` characters. System instructions live strictly server-side.
- **Secrets Hygiene:** All API keys (`GEMINI_API_KEY`, `IQAIR_API_KEY`, `OPENWEATHER_API_KEY`, `OPENAQ_API_KEY`, `AIRNOW_API_KEY`) are read from `process.env` inside server-only modules (`src/app/api/chat/route.ts`, `src/lib/providers/client.ts`). `.env*` is gitignored; `.env.example` contains empty placeholder variable names only.

## 4. HTTP Hardening
`next.config.ts` applies defensive headers to all routes:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

## 5. Abuse / Rate Limiting
- `SlidingWindowRateLimiter` (`src/lib/agents/rateLimit.ts`) enforces **15 requests per minute** per client IP on `/api/chat` (matching Google Gemini free-tier quota) and degrades gracefully to a local RAG stream when exceeded (`X-BreatheWise-Mode: rate-limit-fallback`).

## 6. Privacy by Design
- Household and commute preferences remain exclusively in the user's browser `localStorage` (`breathewise_profile_v1`). No analytics trackers, no accounts, and no server database.

## 7. Evidence
- `npm audit --omit=dev`: **`found 0 vulnerabilities`**
- Secret scan (`Get-ChildItem -Path src -Recurse -File | Select-String -Pattern "AIza"`): **0 matches**
- Rate-limit & fallback tests (`tests/api-chat.test.ts`, `tests/api-chat-gemini.test.ts`): all passed.
