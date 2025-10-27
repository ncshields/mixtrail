import { NextRequest, NextResponse } from "next/server";
import { mockCandidatesForRoute } from "@/lib/mock-candidates";
import { Polyline, UserPrefs } from "@/lib/schemas";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const poly = Polyline.parse(body.polyline);
  UserPrefs.parse(body.prefs);
  const candidates = mockCandidatesForRoute(poly);
  return NextResponse.json({ candidates });
}
