/**
 * Strict Zod schemas validating API inputs, user profiles, AQI responses, and community plans.
 */
import { z } from 'zod';

export const PersonaSchema = z.enum(['family', 'commuter', 'community']);
export const PurifierSchema = z.enum(['hepa', 'diy-cr', 'none']);
export const CommuteModeSchema = z.enum(['car', 'bus', 'metro', 'walk', 'ebike', 'carpool']);
export const ProviderNameSchema = z.enum(['iqair', 'openweather', 'openaq', 'airnow', 'baseline']);
export const AqiBandSchema = z.enum([
  'good',
  'moderate',
  'usg',
  'unhealthy',
  'very-unhealthy',
  'hazardous',
]);

export const CityQuerySchema = z.object({
  city: z
    .string()
    .trim()
    .min(2, 'City name must be at least 2 characters')
    .max(80, 'City name must be 80 characters or fewer')
    .regex(/^[a-zA-Z0-9\s,.-]+$/, 'City contains unsupported characters'),
});

export const UserProfileSchema = z.object({
  persona: PersonaSchema,
  city: CityQuerySchema.shape.city,
  sensitiveMembers: z.boolean().default(true),
  purifier: PurifierSchema.default('none'),
  commuteMode: CommuteModeSchema.default('car'),
  commuteDistanceKm: z.number().min(0.5).max(150).default(10),
  flexibleTiming: z.boolean().default(true),
  groupSize: z.number().int().min(1).max(500).default(20),
});

const ChatMessagePartSchema = z
  .object({
    type: z.string().max(64),
    text: z.string().max(4000).optional(),
    toolCallId: z.string().max(128).optional(),
    toolName: z.string().max(64).optional(),
    state: z.string().max(64).optional(),
    input: z.unknown().optional(),
    output: z.unknown().optional(),
  })
  .strip();

export const ChatMessageInputSchema = z.object({
  id: z.string().max(128).optional(),
  role: z.enum(['user', 'assistant', 'system']),
  parts: z.array(ChatMessagePartSchema).max(20).optional(),
  content: z.string().max(4000).optional(),
});

export const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageInputSchema).min(1).max(30),
  profile: UserProfileSchema.optional(),
});

export const CommunityPlanInputSchema = z.object({
  groupName: z.string().trim().min(2).max(80),
  city: CityQuerySchema.shape.city,
  households: z.number().int().min(1).max(5000),
  carTripsReplaced: z.number().int().min(0).max(5000),
});

export const AqiReadingSchema = z.object({
  city: z.string(),
  country: z.string(),
  lat: z.number(),
  lon: z.number(),
  aqi: z.number(),
  band: AqiBandSchema,
  dominantPollutant: z.enum(['pm25', 'pm10', 'o3', 'no2']),
  pollutants: z.object({
    pm25: z.number(),
    pm10: z.number().nullable(),
    o3: z.number().nullable(),
    no2: z.number().nullable(),
  }),
  whoRatio: z.number(),
  forecast24h: z.array(
    z.object({
      hourLabel: z.string(),
      aqi: z.number(),
      pm25: z.number(),
      isLowestWindow: z.boolean(),
    }),
  ),
  forecast5d: z.array(
    z.object({
      dayLabel: z.string(),
      minAqi: z.number(),
      maxAqi: z.number(),
      avgPm25: z.number(),
    }),
  ),
  providersUsed: z.array(ProviderNameSchema),
  providersFailed: z.array(ProviderNameSchema),
  cached: z.boolean(),
  updatedAt: z.string(),
  note: z.string(),
});
