/**
 * Deterministic seasonal city telemetry baselines for 12 global urban air-quality profiles.
 */
export { DIURNAL_SLOTS } from '@/lib/aqi/diurnalSlots';

export interface CitySeed {
  city: string;
  country: string;
  lat: number;
  lon: number;
  pm25: number;
  pm10: number;
  no2: number;
  o3: number;
}

const RAW_CITIES: readonly [string, string, number, number, number, number, number, number][] = [
  ['New Delhi', 'IN', 28.6139, 77.209, 138, 230, 58, 42],
  ['Lahore', 'PK', 31.5204, 74.3587, 152, 255, 54, 39],
  ['Beijing', 'CN', 39.9042, 116.4074, 62, 108, 44, 52],
  ['Salt Lake City', 'US', 40.7608, -111.891, 42, 66, 34, 48],
  ['Los Angeles', 'US', 34.0522, -118.2437, 29, 49, 38, 68],
  ['London', 'GB', 51.5072, -0.1276, 19, 31, 32, 44],
  ['Milan', 'IT', 45.4642, 9.19, 48, 76, 45, 38],
  ['Krakow', 'PL', 50.0647, 19.945, 58, 88, 40, 34],
  ['Ulaanbaatar', 'MN', 47.8864, 106.9057, 115, 185, 49, 30],
  ['Mexico City', 'MX', 19.4326, -99.1332, 37, 68, 46, 82],
  ['New York', 'US', 40.7128, -74.006, 14, 25, 28, 46],
  ['Toronto', 'CA', 43.6532, -79.3832, 11, 20, 22, 45],
];

export const CITY_SEEDS: readonly CitySeed[] = RAW_CITIES.map(
  ([city, country, lat, lon, pm25, pm10, no2, o3]) => ({
    city,
    country,
    lat,
    lon,
    pm25,
    pm10,
    no2,
    o3,
  }),
);
