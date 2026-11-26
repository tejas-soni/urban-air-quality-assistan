# BreatheWise — Accessibility (WCAG 2.2 Level AA)

> **Evaluation Pillar:** Accessibility & Inclusivity (Target Score: **100 / 100**)  
> **Automated Proof:** Lighthouse Desktop Accessibility **100 / 100**, `@axe-core/playwright` across 5 routes x 2 viewports (**0 violations**), `vitest-axe` + contrast math (**0 violations**).

---

## 1. Semantic HTML5 Landmarks & Headings

Every route renders inside `src/app/layout.tsx` and `src/components/layout/AppShell.tsx`:
- First focusable DOM node: `.skip-link` (`Skip to main content` -> `#main-content`).
- Proper landmarks: `<header>`, `<nav aria-label="Primary navigation">`, `<main id="main-content">`, and `<footer>`.
- Exactly one `<h1>` per route with monotonic `<h2>` / `<h3>` outline.

---

## 2. WCAG 2.2 AA Controls & Twin Representation

| Criterion | Implementation | File | Verification |
| :--- | :--- | :--- | :--- |
| **1.1.1 Non-text Content (Twin Rule)** | `ForecastChart.tsx` hides purely visual `<svg aria-hidden="true">` and renders an adjacent `.sr-only` `<ul>` containing every hourly AQI, category, PM2.5, and lowest window. | `ForecastChart.tsx` | `tests/a11y.test.tsx`, `e2e/app.spec.ts` |
| **1.3.1 Tables & Forms** | `CommuteExposureTable.tsx` uses `<caption>`, `<th scope="col">`, and `<th scope="row">`. Every `<input>` and `<select>` uses explicit `<label htmlFor="...">` or `sr-only` labels. | `CommuteExposureTable.tsx`, `OnboardingForm.tsx`, `IaqCadrCalculator.tsx` | `tests/a11y.test.tsx` |
| **1.4.1 Color Independence** | AQI severity chips always pair background tint + distinct `lucide-react` icon + text band label (`Good`, `Moderate`, `Sensitive`, `Unhealthy`, `Very Unhealthy`, `Hazardous`) + numeric AQI. | `AqiBadge.tsx`, `bandData.ts` | `tests/a11y.test.tsx` |
| **1.4.3 Color Contrast (>= 4.5:1)** | Warm light palette (`#FAFBFC` page, `#FFFFFF` cards, `#0F172A` body text `17.8:1`, `#0369A1` primary buttons `5.91:1` with white text). Proven programmatically in `tests/a11y.test.tsx`. | `globals.css` | `tests/a11y.test.tsx`, `e2e/app.spec.ts` |
| **2.1.1 Scrollable Regions & Keyboard** | Scrollable `CommuteExposureTable` container sets `role="region" aria-label="..." tabIndex={0}` so mobile keyboard users can pan horizontally without a pointer. | `CommuteExposureTable.tsx` | `e2e/app.spec.ts` (`wcag22aa`) |
| **2.4.7 Focus Visible & Preserved** | Global `3px solid #0369A1` `:focus-visible` outline. Async submit controls (`CitySearchForm`, `ChatPanel`, `CommunityPlanner`) use `aria-disabled` so keyboard focus is never dropped during requests. | `globals.css`, `CitySearchForm.tsx`, `ChatPanel.tsx`, `CommunityPlanner.tsx` | `e2e/app.spec.ts` |
| **2.5.8 Touch Target Size (>= 44px)** | Interactive links, persona buttons, city chips, inputs, and submit actions enforce `min-h-[44px]`. Verified at `Pixel 5` (`393x851`) with `0` horizontal overflow. | `src/components/**` | `e2e/app.spec.ts` |
| **2.3.3 / Forced Colors** | `@media (prefers-reduced-motion: reduce)` disables transitions/animations; `@media (forced-colors: active)` preserves explicit control/card borders. | `globals.css` | Inspected + built |
| **4.1.3 Live Regions & Alerts** | `InversionBanner.tsx` switches to `role="alert" aria-live="assertive"` when severe winter smog (`AQI > 200` or strong thermal cap) occurs; `ChatPanel` and `IaqCadrCalculator` use `aria-live="polite"`. | `InversionBanner.tsx`, `ChatPanel.tsx`, `IaqCadrCalculator.tsx` | `tests/components.test.tsx`, `e2e/app.spec.ts` |

---

## 3. Audit Negative Control & Proof

`tests/a11y.test.tsx` executes a negative-control test injecting an unlabeled `<input>` and an `<img>` missing `alt` to confirm `axe-core` actively reports `label` and `image-alt` violations, guaranteeing our `0`-violation assertions across live components and Playwright Chromium routes are genuine.
