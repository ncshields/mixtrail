import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CacheCandidate, Polyline, UserPrefs } from "@/lib/schemas";
import { greedySpacedPicks, scoreCandidate } from "@/lib/scoring";

export const runtime = "edge";

// Validate and type the incoming body
const Body = z.object({
  polyline: Polyline,
  prefs: UserPrefs,
  candidates: z.array(CacheCandidate),
});

export async function POST(req: NextRequest) {
  const { polyline: _poly, prefs, candidates } = Body.parse(await req.json());

  const scored = candidates
    .map((c) => ({ ...c, score: scoreCandidate(c, prefs) }))
    .sort((a, b) => b.score - a.score);

  const picks = greedySpacedPicks(scored, prefs);

  return NextResponse.json({
    picks: picks.map((p) => ({
      gc_code: p.gc_code,
      name: p.name,
      reason: "Heuristic pick",
      route_km_marker: p.route_km_marker,
      extra_detour_m: p.extra_detour_m,
    })),
    shortlist: scored.slice(0, Math.min(scored.length, prefs.target_caches * 2)),
  });
}
