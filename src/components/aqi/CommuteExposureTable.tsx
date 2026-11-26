'use client';

import { Bike, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { compareCommuteModes } from '@/lib/aqi/commuteCompare';

interface CommuteExposureTableProps {
  pm25: number;
  aqi: number;
  initialDistanceKm?: number;
}

/** Semantic accessible comparison of inhaled PM2.5 (µg) and CO2e across 6 transit modes. */
export function CommuteExposureTable({
  pm25,
  aqi,
  initialDistanceKm = 8,
}: CommuteExposureTableProps) {
  const [distanceKm, setDistanceKm] = useState(initialDistanceKm);
  const rows = compareCommuteModes(distanceKm, pm25, aqi);

  return (
    <section
      aria-labelledby="commute-table-heading"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bike className="h-5 w-5 text-sky-700" aria-hidden="true" />
            <h2 id="commute-table-heading" className="text-xl font-bold text-slate-900">
              Multi-Modal Commute Dose &amp; Emission Comparison
            </h2>
          </div>
          <p className="mt-1 text-sm text-slate-700">
            Inhaled PM2.5 computed via US EPA Table 6-2 breathing rates; emissions via UK DEFRA 2024
            factors.
          </p>
        </div>

        <div>
          <label
            htmlFor="commute-table-dist"
            className="block text-sm font-semibold text-slate-800"
          >
            One-way trip (km)
          </label>
          <input
            id="commute-table-dist"
            type="number"
            min={0.5}
            max={100}
            step={0.5}
            value={distanceKm}
            onChange={(e) => setDistanceKm(Number(e.target.value) || 8)}
            className="mt-1 min-h-[44px] w-28 rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900"
          />
        </div>
      </div>

      <div
        role="region"
        aria-label="Commute exposure comparison table"
        tabIndex={0}
        className="mt-4 overflow-x-auto rounded-xl"
      >
        <table className="w-full min-w-[600px] border-collapse text-left text-sm">
          <caption className="sr-only">
            Commute comparison across transit modes showing duration, inhaled PM2.5 dose in
            micrograms, CO2 emissions, and exposure risk.
          </caption>
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-600">
              <th scope="col" className="py-2.5 pr-3 font-semibold">
                Mode
              </th>
              <th scope="col" className="py-2.5 px-3 font-semibold">
                Time
              </th>
              <th scope="col" className="py-2.5 px-3 font-semibold">
                Inhaled PM2.5
              </th>
              <th scope="col" className="py-2.5 px-3 font-semibold">
                CO2e
              </th>
              <th scope="col" className="py-2.5 px-3 font-semibold">
                Exposure Risk
              </th>
              <th scope="col" className="py-2.5 pl-3 font-semibold">
                Guidance
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.mode} className={row.recommended ? 'bg-sky-50/70' : 'bg-white'}>
                <th scope="row" className="py-3 pr-3 font-semibold text-slate-900">
                  <span className="inline-flex items-center gap-1.5">
                    {row.recommended && (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-sky-700" aria-hidden="true" />
                    )}
                    <span>{row.label}</span>
                  </span>
                </th>
                <td className="py-3 px-3 text-slate-700">{row.durationMinutes} min</td>
                <td className="py-3 px-3 font-semibold text-slate-900">{row.inhaledPm25Ug} µg</td>
                <td className="py-3 px-3 text-slate-700">{row.co2Kg} kg</td>
                <td className="py-3 px-3">
                  <span className="inline-block rounded-full border border-slate-300 bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-800">
                    {row.riskTier}
                  </span>
                </td>
                <td className="py-3 pl-3 text-xs text-slate-700">{row.advisory}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
