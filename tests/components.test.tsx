import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DashboardView } from '@/components/aqi/DashboardView';
import { LandingView } from '@/components/aqi/LandingView';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { CommunityPlanner } from '@/components/community/CommunityPlanner';
import { AppShell } from '@/components/layout/AppShell';
import { OnboardingForm } from '@/components/onboarding/OnboardingForm';
import { buildBaselineReading } from '@/lib/aqi/baseline';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: pushMock }),
}));

describe('UI component flows and state', () => {
  beforeEach(() => {
    window.localStorage.clear();
    pushMock.mockReset();
  });

  it('switches persona from Navbar and refreshes city in DashboardView', async () => {
    const delhi = buildBaselineReading('New Delhi');
    const london = buildBaselineReading('London');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(london), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    render(
      <AppShell>
        <DashboardView initialReading={delhi} />
      </AppShell>,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Family');

    fireEvent.click(screen.getByRole('button', { name: 'Commuter' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Commuter');

    fireEvent.click(screen.getByRole('button', { name: 'London' }));
    await waitFor(() => {
      expect(screen.getByText(/London, GB/)).toBeInTheDocument();
    });
    fetchSpy.mockRestore();
  });

  it('submits city search in LandingView using /api/aqi', async () => {
    const london = buildBaselineReading('London');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(london), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    render(<LandingView initialReading={buildBaselineReading('New Delhi')} />);
    const input = screen.getByLabelText('City or urban area');
    fireEvent.change(input, { target: { value: 'London' } });
    fireEvent.click(screen.getByRole('button', { name: /Check Air Quality/i }));

    await waitFor(() => {
      expect(screen.getByText(/London, GB/)).toBeInTheDocument();
    });
    fetchSpy.mockRestore();
  });

  it('saves onboarding profile with toggles and navigates to /dashboard', () => {
    render(<OnboardingForm />);
    fireEvent.change(screen.getByLabelText('Primary profile'), { target: { value: 'commuter' } });
    fireEvent.change(screen.getByLabelText('Home city'), { target: { value: 'Salt Lake City' } });
    fireEvent.change(screen.getByLabelText('Indoor filtration setup'), { target: { value: 'hepa' } });
    fireEvent.change(screen.getByLabelText('Typical commute mode'), { target: { value: 'metro' } });
    fireEvent.change(screen.getByLabelText('Daily round-trip distance (km)'), {
      target: { value: '15' },
    });
    fireEvent.change(screen.getByLabelText('Community group households'), {
      target: { value: '30' },
    });
    fireEvent.click(screen.getByLabelText(/Household includes children/i));
    fireEvent.click(screen.getByLabelText(/Can shift morning departure/i));
    fireEvent.click(screen.getByRole('button', { name: /Save Profile/i }));
    expect(pushMock).toHaveBeenCalledWith('/dashboard');
  });

  it('updates community plan inputs, fetches city, and copies WhatsApp summary', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(buildBaselineReading('Milan')), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    render(<CommunityPlanner initialReading={buildBaselineReading('New Delhi')} />);
    fireEvent.change(screen.getByLabelText('School or group name'), {
      target: { value: 'Oakridge PTA' },
    });
    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Milan' } });
    fireEvent.change(screen.getByLabelText('Households'), { target: { value: '40' } });
    fireEvent.change(screen.getByLabelText('Car trips replaced'), { target: { value: '20' } });
    fireEvent.click(screen.getByRole('button', { name: /Update City Reading/i }));

    await waitFor(() => {
      expect(screen.getByText(/Milan · Live AQI/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Copy Summary/i }));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalled();
    });
    fetchSpy.mockRestore();
  });

  it('renders ChatPanel suggestions, submits question, and renders MessageBubble parts', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('data: {"type":"text-start","id":"1"}\n\ndata: {"type":"text-delta","id":"1","delta":"Open windows at 2 PM."}\n\ndata: {"type":"text-end","id":"1"}\n\ndata: [DONE]\n\n', {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      }),
    );

    render(<ChatPanel />);
    const input = screen.getByLabelText(/Ask BreatheWise/i);
    fireEvent.change(input, { target: { value: 'Ventilation time?' } });
    fireEvent.click(screen.getByRole('button', { name: /Ask Assistant/i }));
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });

    render(
      <MessageBubble
        message={{
          id: 'm1',
          role: 'assistant',
          parts: [
            {
              type: 'tool-get_live_aqi',
              toolCallId: 'c1',
              state: 'output-available',
              input: { city: 'London' },
              output: { aqi: 66 },
            },
            { type: 'text', text: 'Ventilate at 2 PM.' },
          ],
        }}
      />,
    );
    expect(screen.getByText(/Verified source tool: get_live_aqi/)).toBeInTheDocument();
    expect(screen.getByText(/Ventilate at 2 PM\./)).toBeInTheDocument();
    fetchSpy.mockRestore();
  });
});
