import { NextRequest, NextResponse } from "next/server";
import { Polyline, UserPrefs } from "@/lib/schemas";
import { mockCandidatesForRoute } from "@/lib/mock-candidates";
export const runtime = "edge";

export async function POST(req: NextRequest){
  const b = await req.json();
  const poly = Polyline.parse(b.polyline);
  UserPrefs.parse(b.prefs);
  const candidates = mockCandidatesForRoute(poly);
  return NextResponse.json({ candidates });
}
