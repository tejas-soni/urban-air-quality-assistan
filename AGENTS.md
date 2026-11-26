# AGENTS.md — Hard Rules for ALL AI Models (Claude + Gemini)

> Placed at the repo root from `hackathon-prep/AGENTS.md` and pinned to the Urban Air Quality Assistant challenge.

## 0. THE PROBLEM

PROBLEM: Build **BreatheWise — Urban Air Quality Assistant**, a GenAI-powered Next.js (App Router, TypeScript, Tailwind CSS) web app that helps families, commuters, and community groups navigate severe winter smog and urban air pollution. It suggests low-emission daily routines, indoor air quality hacks, and sustainable alternatives tailored to location and lifestyle — always with a quantified impact explanation grounded in live AQI data (IQAir, OpenWeather, OpenAQ, AirNow with 60-min server-side cache and fallback chain), a curated WHO/EPA markdown knowledge base in `/content`, and streaming AI chat via Vercel AI SDK + Google Gemini (with deterministic offline fallback). Light theme only, WCAG 2.1 AA accessible, repo < 10 MB, Vercel Hobby ready.
SUCCESS CRITERIA (how judges score): code quality, accessibility (axe 0 violations), test coverage (>=95% `src/lib/**`, >=80% global), problem alignment, quantified cited impact, security (keys server-side only).

## 1. NEVER BREAK WORKING CODE
- DO NOT rewrite, delete, or refactor files that already work without running the quality gate.
- Make the SMALLEST possible diff. No "while I'm here" cleanups.
- Preserve existing comments and clean interfaces.

## 2. PROVE EVERY CLAIM
- NEVER say "done", "100%", "fully working", or "complete" without pasting the ACTUAL test/terminal output that proves it.
- If you did not run it, say "NOT VERIFIED".
- No inventing APIs, imports, or library functions. Never invent AQI or health numbers without a cited source in `/content`.

## 3. TESTS & THE QUALITY GATE ARE SACRED
- DO NOT delete, skip, or comment out tests to make things "pass".
- DO NOT lower coverage thresholds in `vitest.config.ts` to make the gate pass.
- Every new function gets at least one test. Core logic in `src/lib/**` must stay >= 95% lines/functions/statements and >= 90% branches.
- Nothing is "done" until `npm run verify` passes. Paste the real output as proof.
- If tests fail, report the failure. Do NOT hide it by weakening the test.

## 3b. DO NOT DO RISKY LATE REFACTORS
- Build accessibility in from the start (semantic HTML + labels + contrast + reduced motion) and let `vitest-axe` and `@axe-core/playwright` VERIFY. If axe flags an element, fix ONLY that element.
- Business logic lives in pure functions under `src/lib/**` (no React, no I/O). Keep it there.

## 4. ACCESSIBILITY IS MANDATORY (judges check this)
- Light theme only (`#FAFBFC` / `slate-50` background, `#FFFFFF` cards, `sky-600` `#0284C7` primary).
- Semantic HTML (`<header>`, `<nav>`, `<main>`, `<footer>`, `<button>`, `<label>`).
- Every image/SVG icon has `alt` or `aria-hidden="true"`; every input has an associated `<label>` or `aria-label`.
- Never convey AQI severity with color alone — always pair color chips with text band label + icon.
- Keyboard navigable; visible `:focus-visible` rings; color contrast >= 4.5:1 for normal text.

## 5. REPO CONSTRAINTS
- Total repo MUST stay < 10MB (excluding `node_modules`, `.next`, `.git` which are gitignored).
- ONE branch only: `main`. No feature branches.
- No committed binaries, datasets, build output, or large images. Prefer inline SVG.
- `hackathon-prep/` must remain gitignored. Environment keys read from `.env` / `process.env` server-side only.

## 6. WHEN STUCK
- Read existing code and package types before assuming behavior.
- Keep files small and modular (`<= 120` LOC where practical) so `node audit.mjs` stays clean (`LOW` risk).

## 7. STYLE
- Small pure functions, clear names, strict TypeScript (no `any`), Zod validation on all external inputs.
- Run `npm run verify` and `node audit.mjs` before declaring anything finished.
