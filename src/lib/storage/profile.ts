import { UserProfileSchema } from '@/lib/schemas';
import type { Persona, UserProfile } from '@/lib/types';

export const PROFILE_STORAGE_KEY = 'breathewise_profile_v1';

export const DEFAULT_PROFILE: UserProfile = {
  persona: 'family',
  city: 'New Delhi',
  sensitiveMembers: true,
  purifier: 'diy-cr',
  commuteMode: 'car',
  commuteDistanceKm: 10,
  flexibleTiming: true,
  groupSize: 25,
};

/** Reads the saved UserProfile from localStorage safely, falling back to DEFAULT_PROFILE. */
export function loadStoredProfile(): UserProfile {
  if (typeof window === 'undefined') return DEFAULT_PROFILE;
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = UserProfileSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

/** Validates and persists UserProfile into localStorage. */
export function saveStoredProfile(profile: UserProfile): UserProfile {
  const valid = UserProfileSchema.parse(profile);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(valid));
  }
  return valid;
}

/** Switches the active persona while retaining current location and settings. */
export function switchStoredPersona(persona: Persona): UserProfile {
  const current = loadStoredProfile();
  return saveStoredProfile({ ...current, persona });
}
