import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { AqiCard } from '@/components/aqi/AqiCard';
import { CommuteExposureTable } from '@/components/aqi/CommuteExposureTable';
import { ForecastChart } from '@/components/aqi/ForecastChart';
import { IaqCadrCalculator } from '@/components/aqi/IaqCadrCalculator';
import { InversionBanner } from '@/components/aqi/InversionBanner';
import { LandingView } from '@/components/aqi/LandingView';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { CommunityPlanner } from '@/components/community/CommunityPlanner';
import { RoutineCard } from '@/components/dashboard/RoutineCard';
import { AppShell } from '@/components/layout/AppShell';
import { OnboardingForm } from '@/components/onboarding/OnboardingForm';
import { buildBaselineReading } from '@/lib/aqi/baseline';
import { buildPersonaRoutines } from '@/lib/aqi/routines';
import { DEFAULT_PROFILE } from '@/lib/storage/profile';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn() }),
}));

function relativeLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  const channels = [0, 2, 4].map((i) => {
    const c = parseInt(clean.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const [r = 0, g = 0, b = 0] = channels;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hexA: string, hexB: string): number {
  const la = relativeLuminance(hexA);
  const lb = relativeLuminance(hexB);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('WCAG 2.2 AA accessibility and contrast verification', () => {
  const reading = buildBaselineReading('New Delhi');
  const routines = buildPersonaRoutines(reading, DEFAULT_PROFILE);
  const firstRoutine = routines[0];
  if (!firstRoutine) throw new Error('Expected at least one routine');

  it('LandingView inside AppShell has 0 axe violations', async () => {
    const { container } = render(
      <AppShell>
        <LandingView initialReading={reading} />
      </AppShell>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('Dashboard telemetry, ForecastChart sr-only twin, CADR, and Commute table have 0 axe violations', async () => {
    const { container } = render(
      <main>
        <h1>Air Quality Dashboard</h1>
        <InversionBanner aqi={reading.aqi} scenario="baseline" onScenarioChange={vi.fn()} />
        <AqiCard reading={reading} />
        <ForecastChart reading={reading} />
        <IaqCadrCalculator />
        <CommuteExposureTable pm25={reading.pollutants.pm25} aqi={reading.aqi} />
        <RoutineCard routine={firstRoutine} />
      </main>,
    );
    expect(screen.getByRole('list', { name: /24-hour AQI data list/i })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('OnboardingForm, ChatPanel, and CommunityPlanner have 0 axe violations', async () => {
    const { container } = render(
      <main>
        <h1>Interactive Views</h1>
        <OnboardingForm />
        <ChatPanel />
        <CommunityPlanner initialReading={reading} />
      </main>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('verifies palette contrast ratios exceed WCAG AA (4.5:1)', () => {
    expect(contrastRatio('#0F172A', '#FAFBFC')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#0F172A', '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#475569', '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#FFFFFF', '#0369A1')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#0F172A', '#ECFDF5')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#0F172A', '#FFF1F2')).toBeGreaterThanOrEqual(4.5);
  });

  it('negative control: axe detects unlabelled inputs and images lacking alt text', async () => {
    const main = document.createElement('main');
    const brokenInput = document.createElement('input');
    brokenInput.type = 'text';
    const brokenImg = document.createElement('img');
    brokenImg.src = '/broken.png';
    main.append(brokenInput, brokenImg);
    document.body.appendChild(main);

    const results = await axe(main);
    main.remove();
    const ruleIds = results.violations.map((v) => v.id);
    expect(ruleIds).toContain('label');
    expect(ruleIds).toContain('image-alt');
  });
});
