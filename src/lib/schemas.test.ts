import { describe, it, expect } from 'vitest';
import {
  CityQuerySchema,
  UserProfileSchema,
  ChatRequestSchema,
  CommunityPlanInputSchema,
} from './schemas';

describe('Zod validation schemas', () => {
  it('validates valid city names and rejects invalid characters or short names', () => {
    expect(CityQuerySchema.parse({ city: 'New Delhi' })).toEqual({ city: 'New Delhi' });
    expect(() => CityQuerySchema.parse({ city: 'A' })).toThrow();
    expect(() => CityQuerySchema.parse({ city: 'Delhi<script>' })).toThrow();
  });

  it('parses UserProfile with defaults and rejects out-of-range distance', () => {
    const parsed = UserProfileSchema.parse({ persona: 'family', city: 'London' });
    expect(parsed.purifier).toBe('none');
    expect(parsed.commuteDistanceKm).toBe(10);
    expect(() =>
      UserProfileSchema.parse({ persona: 'commuter', city: 'London', commuteDistanceKm: 500 }),
    ).toThrow();
  });

  it('validates ChatRequest and rejects empty message list', () => {
    const ok = ChatRequestSchema.safeParse({
      messages: [{ role: 'user', parts: [{ type: 'text', text: 'When should I ventilate?' }] }],
    });
    expect(ok.success).toBe(true);
    expect(ChatRequestSchema.safeParse({ messages: [] }).success).toBe(false);
  });

  it('validates CommunityPlanInput bounds', () => {
    const valid = CommunityPlanInputSchema.parse({
      groupName: 'Oakridge Elementary PTA',
      city: 'Salt Lake City',
      households: 40,
      carTripsReplaced: 25,
    });
    expect(valid.households).toBe(40);
    expect(() =>
      CommunityPlanInputSchema.parse({
        groupName: 'X',
        city: 'LA',
        households: 0,
        carTripsReplaced: 0,
      }),
    ).toThrow();
  });
});
