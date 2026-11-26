import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { AqiCard } from '@/components/aqi/AqiCard';
import { ForecastChart } from '@/components/aqi/ForecastChart';
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

describe('WCAG 2.1 AA component accessibility (vitest-axe)', () => {
  const reading = buildBaselineReading('New Delhi');
  const routines = buildPersonaRoutines(reading, DEFAULT_PROFILE);

  it('LandingView inside AppShell has 0 axe violations', async () => {
    const { container } = render(
      <AppShell>
        <LandingView initialReading={reading} />
      </AppShell>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('AqiCard, ForecastChart, and RoutineCard have 0 axe violations', async () => {
    const { container } = render(
      <main>
        <h1>Air Quality</h1>
        <AqiCard reading={reading} />
        <ForecastChart reading={reading} />
        <RoutineCard routine={routines[0]} />
      </main>,
    );
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
});
