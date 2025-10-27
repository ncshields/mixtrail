import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Polyline, UserPrefs, CacheCandidate } from "@/lib/schemas";
import { scoreCandidate, greedySpacedPicks } from "@/lib/scoring";
export const runtime = "edge";

export async function POST(req: NextRequest){
  const b = await req.json();
  const poly = Polyline.parse(b.polyline);
  const prefs = UserPrefs.parse(b.prefs);
  const candidates = z.array(CacheCandidate).parse(b.candidates);

  const scored = candidates.map(c=>({ ...c, score: scoreCandidate(c, prefs) }))
                           .sort((a,b)=>b.score-a.score);
  const picks = greedySpacedPicks(scored, prefs);
  return NextResponse.json({
    picks: picks.map(p=>({
      gc_code:p.gc_code, name:p.name, reason:"Heuristic pick",
      route_km_marker:p.route_km_marker, extra_detour_m:p.extra_detour_m
    })),
    shortlist: scored.slice(0, Math.min(scored.length, prefs.target_caches*2))
  });
}
