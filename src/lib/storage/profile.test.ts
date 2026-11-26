import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_PROFILE,
  PROFILE_STORAGE_KEY,
  loadStoredProfile,
  saveStoredProfile,
  switchStoredPersona,
} from './profile';

describe('localStorage profile helpers', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns DEFAULT_PROFILE when storage is empty or corrupted', () => {
    expect(loadStoredProfile()).toEqual(DEFAULT_PROFILE);
    window.localStorage.setItem(PROFILE_STORAGE_KEY, '{bad-json');
    expect(loadStoredProfile()).toEqual(DEFAULT_PROFILE);
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ persona: 'invalid' }));
    expect(loadStoredProfile()).toEqual(DEFAULT_PROFILE);
  });

  it('saves, loads, and switches persona cleanly', () => {
    saveStoredProfile({ ...DEFAULT_PROFILE, city: 'London', persona: 'commuter' });
    expect(loadStoredProfile().city).toBe('London');
    const switched = switchStoredPersona('community');
    expect(switched.persona).toBe('community');
    expect(loadStoredProfile().city).toBe('London');
  });
});
