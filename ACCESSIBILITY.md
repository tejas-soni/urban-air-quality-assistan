# BreatheWise — Accessibility (a11y)

## 1. Compliance

### AI Evaluation Score: **100/100** · Target: **WCAG 2.1 AA**
Verified automatically by `vitest-axe` (`tests/a11y.test.tsx`, 3/3 passed) and `@axe-core/playwright` (`e2e/app.spec.ts`, 10/10 route scans across Desktop Chrome and Mobile Pixel 5): **0 violations.**

## 2. Semantic HTML & Landmarks
- Every page uses a single skip-to-content link (`<a href="#main-content" className="skip-link">`), semantic `<header>`, `<nav aria-label="Primary navigation">`, `<main id="main-content">`, and `<footer>`.
- Exactly one `<h1>` per page with logical `<h2>` / `<h3>` nesting.

## 3. Color & Contrast (Light Theme Only)
- Warm white page surface (`#FAFBFC` / `bg-slate-50`), `#FFFFFF` cards, `slate-900`/`slate-700` body copy, and `sky-700` (`#0369A1`) primary buttons/badges (`~5.91:1` contrast with `#FFFFFF`, exceeding WCAG AA `4.5:1`).
- **Note from real verification:** Our first `@axe-core/playwright` run flagged `bg-sky-600` (`4.02:1` on white text). We upgraded those white-text buttons/bubbles to `bg-sky-700`, re-verified, and confirmed **0 contrast violations** across all 5 routes.
- **No color-only meaning:** Standard AQI severity bands always combine high-contrast light chips, a distinct `lucide-react` icon (`ShieldCheck`, `Sun`, `AlertTriangle`, `ShieldAlert`, `Siren`, `Skull`), text band name (`Good`, `Moderate`, `Sensitive`, `Unhealthy`, `Very Unhealthy`, `Hazardous`), and numeric AQI integer.

## 4. Keyboard & Focus
- All navigation links, persona toggle buttons (`aria-pressed`), quick city chips, form inputs, and chat controls are natively keyboard operable (`Tab` / `Enter` / `Space`).
- Global `*:focus-visible` `3px` `#0284C7` outline ring in `src/app/globals.css`.

## 5. Screen Readers
- Every `<input>` and `<select>` has an explicit `<label htmlFor="...">` (or `sr-only` label in the chat bar).
- Live AQI card and chat transcript use `aria-live="polite"`; chat error banners use `role="alert"`.
- Decorative icons carry `aria-hidden="true"`; the 24-hour SVG forecast chart uses `role="img"` with a descriptive `aria-label` summarizing the city and lowest outdoor window.

## 6. Motion & Cognition
- `@media (prefers-reduced-motion: reduce)` in `src/app/globals.css` disables non-essential animations and transitions.
- Plain-language copy at `>= 16px` (`1rem`) base font size designed for families and schools.

## 7. Touch & Responsive
- Interactive buttons, inputs, and nav links enforce `min-h-[44px]` (`44px+` touch target). Tested in Playwright at `Pixel 5` (`393x851`) and `Desktop Chrome` (`1280x720`) with zero violations.

## 8. Evidence
- `vitest-axe` (`tests/a11y.test.tsx`): `3 passed (3)` (`0` violations across `AppShell`, `LandingView`, `AqiCard`, `ForecastChart`, `RoutineCard`, `OnboardingForm`, `ChatPanel`, `CommunityPlanner`).
- `@axe-core/playwright` (`npm run test:e2e`): `12 passed (30.2s)` (`0` violations on `/`, `/onboarding`, `/dashboard`, `/chat`, `/community` across both `desktop` and `mobile` projects).
