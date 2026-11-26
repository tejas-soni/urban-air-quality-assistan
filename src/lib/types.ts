/**
 * Core domain types shared across AQI providers, pure calculation engines, RAG search, and UI views.
 */
export type Persona = 'family' | 'commuter' | 'community';

export type AqiBand = 'good' | 'moderate' | 'usg' | 'unhealthy' | 'very-unhealthy' | 'hazardous';

export type PurifierType = 'hepa' | 'diy-cr' | 'none';

export type CommuteMode = 'car' | 'bus' | 'metro' | 'walk' | 'ebike' | 'carpool';

export type ProviderName = 'iqair' | 'openweather' | 'openaq' | 'airnow' | 'baseline';

export type KbCategory = 'health-guidance' | 'indoor-hacks' | 'impact-data';

export interface AqiBandInfo {
  band: AqiBand;
  label: string;
  shortLabel: string;
  severity: 1 | 2 | 3 | 4 | 5 | 6;
  iconName: 'shield-check' | 'sun' | 'alert-triangle' | 'shield-alert' | 'siren' | 'skull';
  bgClass: string;
  textClass: string;
  borderClass: string;
  hexAccent: string;
  guidance: string;
}

export interface Pollutants {
  pm25: number;
  pm10: number | null;
  o3: number | null;
  no2: number | null;
}

export interface ForecastPoint {
  hourLabel: string;
  aqi: number;
  pm25: number;
  isLowestWindow: boolean;
}

export interface AqiReading {
  city: string;
  country: string;
  lat: number;
  lon: number;
  aqi: number;
  band: AqiBand;
  dominantPollutant: 'pm25' | 'pm10' | 'o3' | 'no2';
  pollutants: Pollutants;
  whoRatio: number;
  forecast24h: ForecastPoint[];
  forecast5d: { dayLabel: string; minAqi: number; maxAqi: number; avgPm25: number }[];
  providersUsed: ProviderName[];
  providersFailed: ProviderName[];
  cached: boolean;
  updatedAt: string;
  note: string;
}

export interface UserProfile {
  persona: Persona;
  city: string;
  sensitiveMembers: boolean;
  purifier: PurifierType;
  commuteMode: CommuteMode;
  commuteDistanceKm: number;
  flexibleTiming: boolean;
  groupSize: number;
}

export interface ImpactEstimate {
  headline: string;
  reductionPercent: number;
  unitSaved: string;
  detail: string;
  sourceId: string;
}

export interface RoutineRecommendation {
  id: string;
  title: string;
  windowLabel: string;
  action: string;
  impact: ImpactEstimate;
  priority: 'high' | 'medium' | 'standard';
  sourceCitation: string;
}

export interface KbDoc {
  id: string;
  slug: string;
  title: string;
  category: KbCategory;
  personas: Persona[];
  tags: string[];
  impactMetric: string;
  body: string;
  sources: string[];
}

export interface KbCitation {
  id: string;
  title: string;
  category: KbCategory;
  impactMetric: string;
  snippet: string;
  sources: string[];
  score: number;
}

export interface CommunityActionPlan {
  groupName: string;
  city: string;
  aqi: number;
  bandLabel: string;
  households: number;
  carTripsReplaced: number;
  co2SavedKgDay: number;
  pm25DropEstimate: string;
  triggers: string[];
  checklist: string[];
  whatsappSummary: string;
  sources: string[];
}
