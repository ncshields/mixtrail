import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Polyline, UserPrefs } from "@/lib/schemas";
import { mockCandidatesForRoute } from "@/lib/mock-candidates";

export const runtime = "edge";

const Body = z.object({
  polyline: Polyline,
  prefs: UserPrefs,
});

export async function POST(req: NextRequest) {
  const { polyline } = Body.parse(await req.json());
  const candidates = mockCandidatesForRoute(polyline);
  return NextResponse.json({ candidates });
}
