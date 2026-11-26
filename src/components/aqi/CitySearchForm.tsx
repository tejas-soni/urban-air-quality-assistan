'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { POPULAR_CITIES } from '@/lib/aqi/baseline';

interface CitySearchFormProps {
  initialCity: string;
  onSelectCity: (city: string) => void;
  loading?: boolean;
}

export function CitySearchForm({
  initialCity,
  onSelectCity,
  loading = false,
}: CitySearchFormProps) {
  const [cityInput, setCityInput] = useState(initialCity);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    const trimmed = cityInput.trim();
    if (trimmed.length >= 2) {
      onSelectCity(trimmed);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex-1">
          <label
            htmlFor="city-search-input"
            className="mb-1 block text-sm font-semibold text-slate-800"
          >
            City or urban area
          </label>
          <input
            id="city-search-input"
            type="text"
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            placeholder="e.g. New Delhi, London, Salt Lake City"
            className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-base text-slate-900 placeholder:text-slate-400"
            minLength={2}
            maxLength={80}
            required
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            aria-disabled={loading}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-sky-700 px-5 py-2.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-sky-800 aria-disabled:opacity-60 sm:w-auto"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            <span>{loading ? 'Checking...' : 'Check Air Quality'}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2" aria-label="Quick city examples">
        <span className="text-xs font-medium text-slate-600">Try:</span>
        {POPULAR_CITIES.slice(0, 6).map((city) => (
          <button
            key={city}
            type="button"
            onClick={() => {
              setCityInput(city);
              onSelectCity(city);
            }}
            className="min-h-[44px] rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800"
          >
            {city}
          </button>
        ))}
      </div>
    </form>
  );
}
