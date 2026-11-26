'use client';

/**
 * Controlled input form configuring school/community group size, city, and trips replaced.
 */
import type { SyntheticEvent } from 'react';

interface CommunityPlanFormProps {
  groupName: string;
  onGroupNameChange: (val: string) => void;
  city: string;
  onCityChange: (val: string) => void;
  households: number;
  onHouseholdsChange: (val: number) => void;
  carTripsReplaced: number;
  onTripsChange: (val: number) => void;
  loading: boolean;
  onSubmit: (e: SyntheticEvent) => void;
}

function GroupCountsFields(
  props: Pick<
    CommunityPlanFormProps,
    'households' | 'onHouseholdsChange' | 'carTripsReplaced' | 'onTripsChange'
  >,
) {
  return (
    <>
      <div>
        <label htmlFor="comm-hh" className="block text-sm font-semibold text-slate-800">
          Households
        </label>
        <input
          id="comm-hh"
          type="number"
          min={1}
          max={2000}
          value={props.households}
          onChange={(e) => props.onHouseholdsChange(Number(e.target.value) || 1)}
          className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900"
        />
      </div>
      <div>
        <label htmlFor="comm-trips" className="block text-sm font-semibold text-slate-800">
          Car trips replaced
        </label>
        <input
          id="comm-trips"
          type="number"
          min={0}
          max={2000}
          value={props.carTripsReplaced}
          onChange={(e) => props.onTripsChange(Number(e.target.value) || 0)}
          className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900"
        />
      </div>
    </>
  );
}

/** Renders accessible numeric/text controls for collective community smog-action planning. */
export function CommunityPlanForm(props: CommunityPlanFormProps) {
  return (
    <form
      onSubmit={props.onSubmit}
      className="no-print grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-5"
    >
      <div className="sm:col-span-2">
        <label htmlFor="comm-group" className="block text-sm font-semibold text-slate-800">
          School or group name
        </label>
        <input
          id="comm-group"
          type="text"
          value={props.groupName}
          onChange={(e) => props.onGroupNameChange(e.target.value)}
          className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900"
        />
      </div>
      <div>
        <label htmlFor="comm-city" className="block text-sm font-semibold text-slate-800">
          City
        </label>
        <input
          id="comm-city"
          type="text"
          value={props.city}
          onChange={(e) => props.onCityChange(e.target.value)}
          className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900"
        />
      </div>
      <GroupCountsFields
        households={props.households}
        onHouseholdsChange={props.onHouseholdsChange}
        carTripsReplaced={props.carTripsReplaced}
        onTripsChange={props.onTripsChange}
      />
      <div className="sm:col-span-2 lg:col-span-5">
        <button
          type="submit"
          aria-disabled={props.loading}
          className="min-h-[44px] rounded-xl bg-sky-700 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-800 aria-disabled:opacity-60"
        >
          {props.loading ? 'Updating city AQI...' : 'Update City Reading & Plan'}
        </button>
      </div>
    </form>
  );
}
