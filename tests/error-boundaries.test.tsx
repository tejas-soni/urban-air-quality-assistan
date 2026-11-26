import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RouteError from '@/app/error';
import GlobalError from '@/app/global-error';
import NotFound from '@/app/not-found';
import { LandingView } from '@/components/aqi/LandingView';
import { CommunityPlanner } from '@/components/community/CommunityPlanner';
import { buildBaselineReading } from '@/lib/aqi/baseline';

describe('error boundaries, 404 route, and UI fetch failure alerts', () => {
  it('renders RouteError recovery UI and NotFound navigation card', () => {
    const reset = vi.fn();
    render(<RouteError error={new Error('boom')} reset={reset} />);
    fireEvent.click(screen.getByRole('button', { name: /Try Again/i }));
    expect(reset).toHaveBeenCalledTimes(1);

    render(<NotFound />);
    expect(screen.getByText(/does not exist/i)).toBeInTheDocument();

    const resetGlobal = vi.fn();
    render(<GlobalError reset={resetGlobal} />);
    fireEvent.click(screen.getByRole('button', { name: /Reload App/i }));
    expect(resetGlobal).toHaveBeenCalledTimes(1);
  });

  it('shows accessible error alerts in LandingView and CommunityPlanner when AQI fetch fails', async () => {
    const spy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('bad', { status: 502 }));
    render(<LandingView initialReading={buildBaselineReading('New Delhi')} />);
    fireEvent.change(screen.getByLabelText('City or urban area'), { target: { value: 'London' } });
    fireEvent.click(screen.getByRole('button', { name: /Check Air Quality/i }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/HTTP 502/i);
    });

    render(<CommunityPlanner initialReading={buildBaselineReading('New Delhi')} />);
    fireEvent.click(screen.getByRole('button', { name: /Update City Reading/i }));
    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(2);
    });
    spy.mockRestore();
  });
});
