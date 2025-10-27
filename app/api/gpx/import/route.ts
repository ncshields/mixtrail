import { XMLParser } from "fast-xml-parser";
import { NextRequest, NextResponse } from "next/server";
import { lineDistanceKm } from "@/lib/geo";
import { Polyline } from "@/lib/schemas";

export const runtime = "edge";

function arr<T>(x: T | T[] | undefined): T[] {
  if (!x) return [];
  return Array.isArray(x) ? x : [x];
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Upload GPX file (field 'file')" }, { status: 400 });
  }

  const xml = await file.text();
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });
  const g = parser.parse(xml);

  const pts: { lat: number; lng: number }[] = [];

  // Tracks
  for (const trk of arr(g?.gpx?.trk)) {
    for (const seg of arr(trk?.trkseg)) {
      for (const p of arr(seg?.trkpt)) {
        const lat = parseFloat(p?.lat);
        const lng = parseFloat(p?.lon ?? p?.lng);
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) pts.push({ lat, lng });
      }
    }
  }

  // Routes
  if (pts.length < 2) {
    for (const rte of arr(g?.gpx?.rte)) {
      for (const p of arr(rte?.rtept)) {
        const lat = parseFloat(p?.lat);
        const lng = parseFloat(p?.lon ?? p?.lng);
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) pts.push({ lat, lng });
      }
    }
  }

  // Waypoints
  if (pts.length < 2) {
    for (const p of arr(g?.gpx?.wpt)) {
      const lat = parseFloat(p?.lat);
      const lng = parseFloat(p?.lon ?? p?.lng);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) pts.push({ lat, lng });
    }
  }

  if (pts.length < 2) {
    return NextResponse.json({ error: "No track/route/waypoints found" }, { status: 400 });
  }

  const poly = Polyline.parse({
    points: pts,
    distance_km: lineDistanceKm(pts),
    mode: "walk",
    elevation_gain_m: 0,
    elevation_samples: [],
  });
  return NextResponse.json(poly);
}
