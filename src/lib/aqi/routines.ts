/**
 * Persona routine dispatcher selecting family, commuter, or community action builders.
 */
import { buildCommuterRoutines } from '@/lib/aqi/routineCommuter';
import { buildCommunityRoutines } from '@/lib/aqi/routineCommunity';
import { buildFamilyRoutines } from '@/lib/aqi/routineFamily';
import type { AqiReading, Persona, RoutineRecommendation, UserProfile } from '@/lib/types';

const BUILDERS: Record<
  Persona,
  (reading: AqiReading, profile: UserProfile) => RoutineRecommendation[]
> = {
  family: buildFamilyRoutines,
  commuter: buildCommuterRoutines,
  community: buildCommunityRoutines,
};

/** Builds persona-tailored, quantified daily routines grounded in cited markdown sources. */
export function buildPersonaRoutines(
  reading: AqiReading,
  profile: UserProfile,
): RoutineRecommendation[] {
  return BUILDERS[profile.persona](reading, profile);
}
