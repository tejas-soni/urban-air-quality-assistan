import { CommunityPlanner } from '@/components/community/CommunityPlanner';
import { AppShell } from '@/components/layout/AppShell';
import { fetchCityAqi } from '@/lib/providers/client';

export const dynamic = 'force-dynamic';

export default async function CommunityPage() {
  const initialReading = await fetchCityAqi('New Delhi');

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Community &amp; School Action Plans</h1>
          <p className="mt-2 text-base text-slate-700">
            Generate printable and WhatsApp-ready winter smog pledges with collective emission and
            curbside exposure savings.
          </p>
        </div>
        <CommunityPlanner initialReading={initialReading} />
      </div>
    </AppShell>
  );
}
