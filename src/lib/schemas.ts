import { z } from 'zod';

export const PersonaSchema = z.enum(['family', 'commuter', 'community']);

export const PurifierSchema = z.enum(['hepa', 'diy-cr', 'none']);

export const CommuteModeSchema = z.enum(['car', 'bus', 'metro', 'walk', 'ebike', 'carpool']);

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

export const ChatMessageInputSchema = z.object({
  id: z.string().optional(),
  role: z.enum(['user', 'assistant', 'system']),
  parts: z
    .array(
      z
        .object({
          type: z.string(),
          text: z.string().optional(),
        })
        .passthrough(),
    )
    .optional(),
  content: z.string().optional(),
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
