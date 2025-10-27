import { NextRequest, NextResponse } from "next/server";
import { mockCandidatesForRoute } from "@/lib/mock-candidates";
import { Polyline, UserPrefs } from "@/lib/schemas";
import { z } from "zod";

export const runtime = "edge";

// Type the incoming JSON explicitly so req.json() (unknown) is parsed safely
const Body = z.object({
  polyline: Polyline,
  prefs: UserPrefs,
});

export async function POST(req: NextRequest) {
  const { polyline } = Body.parse(await req.json());
  const candidates = mockCandidatesForRoute(polyline);
  return NextResponse.json({ candidates });
}
