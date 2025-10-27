import { z } from "zod";

export const LatLng = z.object({ lat: z.number(), lng: z.number() });

export const Polyline = z.object({
  points: z.array(LatLng).min(2),
  distance_km: z.number().nonnegative(),
  mode: z.enum(["drive","bike","walk","hike"]),
  elevation_gain_m: z.number().default(0),
  elevation_samples: z.array(z.object({ km: z.number(), m: z.number() })).default([]),
});

export const UserPrefs = z.object({
  target_caches: z.number().min(1).max(200).default(8),
  max_corridor_m: z.number().min(50).max(5000).default(800),
  max_extra_detour_m: z.number().min(0).max(20000).default(1500),
  difficulty_range: z.tuple([z.number().min(1).max(5), z.number().min(1).max(5)]).default([1,4]),
  terrain_range: z.tuple([z.number().min(1).max(5), z.number().min(1).max(5)]).default([1,4]),
  types: z.array(z.enum(["Traditional","Mystery","Multi","Letterbox","Earthcache","Virtual"])).default(["Traditional","Virtual","Earthcache"]),
  avoid_recent_dnfs: z.boolean().default(true),
  spacing_km: z.number().min(0).default(25),
});

export const CacheCandidate = z.object({
  gc_code: z.string(),
  name: z.string(),
  coords: LatLng,
  type: z.enum(["Traditional","Mystery","Multi","Letterbox","Earthcache","Virtual"]),
  difficulty: z.number().min(1).max(5),
  terrain: z.number().min(1).max(5),
  size: z.enum(["Micro","Small","Regular","Large","Other"]).optional(),
  favorite_points: z.number().int().nonnegative().default(0),
  last_found_days: z.number().int().nullable().optional(),
  recent_dnfs: z.number().int().nonnegative().default(0),
  on_trail_hint: z.boolean().default(false),
  distance_to_route_m: z.number(),
  extra_detour_m: z.number(),
  route_km_marker: z.number().nonnegative(),
});

export type PolylineT = z.infer<typeof Polyline>;
export type UserPrefsT = z.infer<typeof UserPrefs>;
export type CacheCandidateT = z.infer<typeof CacheCandidate>;