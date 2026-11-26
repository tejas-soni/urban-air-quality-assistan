'use client';

/**
 * Hydration-safe external store hook synchronizing UserProfile state with localStorage.
 */
import { useSyncExternalStore } from 'react';
import {
  DEFAULT_PROFILE,
  loadStoredProfile,
  PROFILE_STORAGE_KEY,
  saveStoredProfile,
  switchStoredPersona,
} from '@/lib/storage/profile';
import type { Persona, UserProfile } from '@/lib/types';

const PROFILE_EVENT = 'breathewise-profile-change';

let lastRaw: string | null = null;
let lastSnapshot: UserProfile = DEFAULT_PROFILE;

function getSnapshot(): UserProfile {
  const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
  if (raw === lastRaw) return lastSnapshot;
  lastRaw = raw;
  lastSnapshot = loadStoredProfile();
  return lastSnapshot;
}

function getServerSnapshot(): UserProfile {
  return DEFAULT_PROFILE;
}

function subscribe(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener('storage', handler);
  window.addEventListener(PROFILE_EVENT, handler);
  return () => {
    window.removeEventListener('storage', handler);
    window.removeEventListener(PROFILE_EVENT, handler);
  };
}

/** Updates the persisted browser UserProfile and notifies subscribed components. */
export function updateAppProfile(next: UserProfile): UserProfile {
  const saved = saveStoredProfile(next);
  lastRaw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
  lastSnapshot = saved;
  window.dispatchEvent(new Event(PROFILE_EVENT));
  return saved;
}

/** Switches only the active persona in browser storage while keeping location and commute settings. */
export function switchAppPersona(persona: Persona): UserProfile {
  const saved = switchStoredPersona(persona);
  lastRaw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
  lastSnapshot = saved;
  window.dispatchEvent(new Event(PROFILE_EVENT));
  return saved;
}

/** React hook subscribing cleanly to local UserProfile changes via useSyncExternalStore. */
export function useUserProfile(): UserProfile {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
