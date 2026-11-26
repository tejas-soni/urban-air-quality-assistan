'use client';

/**
 * Modular onboarding form fieldsets for household filtration, commute settings, and vulnerability toggles.
 */
import { OnboardingNumericFlags } from '@/components/onboarding/OnboardingNumericFlags';
import { CommuteModeSchema, PurifierSchema } from '@/lib/schemas';
import type { CommuteMode, PurifierType } from '@/lib/types';

interface OnboardingFieldsProps {
  purifier: PurifierType;
  onPurifierChange: (val: PurifierType) => void;
  commuteMode: CommuteMode;
  onCommuteModeChange: (val: CommuteMode) => void;
  commuteDistanceKm: number;
  onDistanceChange: (val: number) => void;
  groupSize: number;
  onGroupSizeChange: (val: number) => void;
  sensitiveMembers: boolean;
  onSensitiveChange: (val: boolean) => void;
  flexibleTiming: boolean;
  onFlexibleChange: (val: boolean) => void;
}

/** Renders accessible indoor purifier, commute, distance, group, and vulnerability form controls. */
export function OnboardingFields(props: OnboardingFieldsProps) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="onboard-purifier" className="block text-sm font-semibold text-slate-800">
            Indoor filtration setup
          </label>
          <select
            id="onboard-purifier"
            value={props.purifier}
            onChange={(e) => {
              const p = PurifierSchema.safeParse(e.target.value);
              if (p.success) props.onPurifierChange(p.data);
            }}
            className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900"
          >
            <option value="hepa">Commercial True HEPA purifier</option>
            <option value="diy-cr">DIY MERV-13 Corsi-Rosenthal box</option>
            <option value="none">No air purifier yet</option>
          </select>
        </div>
        <div>
          <label htmlFor="onboard-commute" className="block text-sm font-semibold text-slate-800">
            Typical commute mode
          </label>
          <select
            id="onboard-commute"
            value={props.commuteMode}
            onChange={(e) => {
              const c = CommuteModeSchema.safeParse(e.target.value);
              if (c.success) props.onCommuteModeChange(c.data);
            }}
            className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900"
          >
            <option value="car">Solo Petrol/Diesel Car</option>
            <option value="carpool">3-Person Carpool</option>
            <option value="bus">Urban Bus</option>
            <option value="metro">Electric Metro / Rail</option>
            <option value="ebike">E-Bike / Bicycle</option>
            <option value="walk">Walking</option>
          </select>
        </div>
      </div>

      <OnboardingNumericFlags
        commuteDistanceKm={props.commuteDistanceKm}
        onDistanceChange={props.onDistanceChange}
        groupSize={props.groupSize}
        onGroupSizeChange={props.onGroupSizeChange}
        sensitiveMembers={props.sensitiveMembers}
        onSensitiveChange={props.onSensitiveChange}
        flexibleTiming={props.flexibleTiming}
        onFlexibleChange={props.onFlexibleChange}
      />
    </>
  );
}
