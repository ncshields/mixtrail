import { NextRequest, NextResponse } from "next/server";
import { Polyline } from "@/lib/schemas";

export const runtime = "edge";

type Pt = { lat: number; lng: number };

const PROFILE_MAP: Record<"drive" | "bike" | "walk" | "hike", string> = {
  drive: "driving-car",
  bike: "cycling-regular",
  walk: "foot-walking",
  hike: "foot-hiking",
};

function haversineKm(a: Pt, b: Pt): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    start: Pt;
    end: Pt;
    waypoints?: Pt[];
    mode?: "drive" | "bike" | "walk" | "hike";
  };

  const { start, end, waypoints = [], mode = "drive" } = body;
  if (!start || !end) {
    return NextResponse.json({ error: "Missing start/end" }, { status: 400 });
  }

  const profile = PROFILE_MAP[mode] ?? PROFILE_MAP.drive;
  const coords: [number, number][] = [start, ...waypoints, end].map((p) => [p.lng, p.lat]);

  const res = await fetch(`https://api.openrouteservice.org/v2/directions/${profile}`, {
    method: "POST",
    headers: {
      Authorization: process.env.ORS_API_KEY || "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ coordinates: coords, elevation: true }),
  });

  if (!res.ok) {
    const msg = await res.text();
    return NextResponse.json({ error: `ORS error: ${msg}` }, { status: 500 });
  }

  const data: {
    features: Array<{
      geometry: { coordinates: Array<[number, number, number?]> };
      properties: { segments: Array<{ distance: number }>; ascent?: number };
    }>;
  } = await res.json();

  const line = data?.features?.[0]?.geometry?.coordinates ?? [];
  const distance_m = data?.features?.[0]?.properties?.segments?.[0]?.distance ?? 0;
  const ascent_m = data?.features?.[0]?.properties?.ascent ?? 0;

  const points: Pt[] = line.map((c) => ({ lng: c[0], lat: c[1] }));

  const elevation_samples: { km: number; m: number }[] = [];
  let km = 0;
  for (let i = 0; i < points.length; i++) {
    const p = points[i]!;
    const z = line[i]?.[2];
    if (i > 0) {
      const dx = haversineKm(points[i - 1]!, p);
      km += dx;
    }
    elevation_samples.push({ km, m: typeof z === "number" ? z : 0 });
  }

  const poly = Polyline.parse({
    points,
    distance_km: distance_m / 1000,
    mode,
    elevation_gain_m: ascent_m ?? 0,
    elevation_samples,
  });

  return NextResponse.json(poly);
}
