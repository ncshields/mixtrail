import { NextRequest } from "next/server";
import { z } from "zod";
import { CacheCandidate, Polyline } from "@/lib/schemas";

export const runtime = "edge";

const Body = z.object({
  picks: z.array(CacheCandidate.pick({ gc_code: true, name: true, coords: true })).min(1),
  route: Polyline.optional(),
});

const XML_MAP: Record<"<" | "&" | ">" | '"', string> = {
  "<": "&lt;",
  "&": "&amp;",
  ">": "&gt;",
  '"': "&quot;",
};

function escapeXml(s: string): string {
  return s.replace(/[<&>"]/g, (c) => XML_MAP[c as keyof typeof XML_MAP]);
}

export async function POST(req: NextRequest) {
  const { picks, route } = Body.parse(await req.json());

  const wpts = picks
    .map(
      (p) => `  <wpt lat="${p.coords.lat.toFixed(6)}" lon="${p.coords.lng.toFixed(6)}">
    <name>${escapeXml(p.gc_code)}</name>
    <desc>${escapeXml(p.name)}</desc>
  </wpt>`
    )
    .join("\n");

  const rteseg = route
    ? route.points.map((pt) => `    <rtept lat="${pt.lat.toFixed(6)}" lon="${pt.lng.toFixed(6)}"/>`).join("\n")
    : "";

  const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="MixTrail" xmlns="http://www.topografix.com/GPX/1/1">
${wpts}
${route ? `<rte>\n${rteseg}\n</rte>` : ""}
</gpx>`.trim();

  return new Response(gpx, {
    status: 200,
    headers: {
      "Content-Type": "application/gpx+xml",
      "Content-Disposition": `attachment; filename="mixtrail-picks.gpx"`,
    },
  });
}
