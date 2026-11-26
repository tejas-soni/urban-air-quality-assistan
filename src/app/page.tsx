/**
 * Landing page server entry loading initial urban AQI telemetry cleanly on the server.
 */
import { LandingView } from '@/components/aqi/LandingView';
import { AppShell } from '@/components/layout/AppShell';
import { fetchCityAqi } from '@/lib/providers/client';

export const dynamic = 'force-dynamic';

/** Server component fetching initial baseline/live AQI for the landing lookup view. */
export default async function HomePage() {
  const initialReading = await fetchCityAqi('New Delhi');

  return (
    <AppShell>
      <LandingView initialReading={initialReading} />
    </AppShell>
  );
}
