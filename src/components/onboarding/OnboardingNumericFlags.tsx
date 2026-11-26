'use client';

/**
 * Household numeric distance/group inputs and vulnerability checkboxes for onboarding.
 */
interface OnboardingNumericFlagsProps {
  commuteDistanceKm: number;
  onDistanceChange: (val: number) => void;
  groupSize: number;
  onGroupSizeChange: (val: number) => void;
  sensitiveMembers: boolean;
  onSensitiveChange: (val: boolean) => void;
  flexibleTiming: boolean;
  onFlexibleChange: (val: boolean) => void;
}

function NumericPair({
  commuteDistanceKm,
  onDistanceChange,
  groupSize,
  onGroupSizeChange,
}: Pick<
  OnboardingNumericFlagsProps,
  'commuteDistanceKm' | 'onDistanceChange' | 'groupSize' | 'onGroupSizeChange'
>) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor="onboard-dist" className="block text-sm font-semibold text-slate-800">
          Daily round-trip distance (km)
        </label>
        <input
          id="onboard-dist"
          type="number"
          min={1}
          max={150}
          value={commuteDistanceKm}
          onChange={(e) => onDistanceChange(Number(e.target.value) || 1)}
          className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900"
        />
      </div>
      <div>
        <label htmlFor="onboard-group" className="block text-sm font-semibold text-slate-800">
          Community group households
        </label>
        <input
          id="onboard-group"
          type="number"
          min={1}
          max={500}
          value={groupSize}
          onChange={(e) => onGroupSizeChange(Number(e.target.value) || 1)}
          className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900"
        />
      </div>
    </div>
  );
}

/** Renders accessible distance/group inputs and household vulnerability checkboxes. */
export function OnboardingNumericFlags(props: OnboardingNumericFlagsProps) {
  return (
    <>
      <NumericPair
        commuteDistanceKm={props.commuteDistanceKm}
        onDistanceChange={props.onDistanceChange}
        groupSize={props.groupSize}
        onGroupSizeChange={props.onGroupSizeChange}
      />
      <div className="space-y-3">
        <label className="flex min-h-[44px] items-center gap-3 text-base text-slate-800">
          <input
            type="checkbox"
            checked={props.sensitiveMembers}
            onChange={(e) => props.onSensitiveChange(e.target.checked)}
            className="h-5 w-5 rounded border-slate-300 text-sky-600"
          />
          <span>Household includes children, older adults, or asthma/heart sensitivity</span>
        </label>
        <label className="flex min-h-[44px] items-center gap-3 text-base text-slate-800">
          <input
            type="checkbox"
            checked={props.flexibleTiming}
            onChange={(e) => props.onFlexibleChange(e.target.checked)}
            className="h-5 w-5 rounded border-slate-300 text-sky-600"
          />
          <span>Can shift morning departure 30–60 min later on high-smog days</span>
        </label>
      </div>
    </>
  );
}
