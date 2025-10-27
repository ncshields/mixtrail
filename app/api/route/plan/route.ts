import { NextRequest, NextResponse } from "next/server";
import { Polyline } from "@/lib/schemas";

export const runtime = "edge";

const PROFILE_MAP:Record<string,string>={
  drive:"driving-car", bike:"cycling-regular", walk:"foot-walking", hike:"foot-hiking"
};

export async function POST(req: NextRequest){
  const { start, end, waypoints=[], mode="drive" } = await req.json();
  if(!start||!end) return NextResponse.json({error:"Missing start/end"}, {status:400});
  const profile = PROFILE_MAP[mode] ?? PROFILE_MAP.drive;
  const coords = [start, ...waypoints, end].map((p:any)=>[p.lng,p.lat]);

  const res = await fetch(`https://api.openrouteservice.org/v2/directions/${profile}`,{
    method:"POST",
    headers:{
      "Authorization": process.env.ORS_API_KEY||"",
      "Content-Type":"application/json"
    },
    body: JSON.stringify({ coordinates: coords, elevation: true })
  });
  if(!res.ok){
    const msg = await res.text();
    return NextResponse.json({error:`ORS error: ${msg}`}, {status:500});
  }
  const data = await res.json();

  // Extract geometry (as GeoJSON LineString) and distances
  const line = data?.features?.[0]?.geometry?.coordinates || [];
  const distance_m = data?.features?.[0]?.properties?.segments?.[0]?.distance ?? 0;
  const ascent_m = data?.features?.[0]?.properties?.ascent ?? 0;

  // Build our polyline format
  const points = line.map((c:number[])=>({ lng:c[0], lat:c[1] }));
  // Build a coarse elevation profile from coords with z if present
  const elevSamples = [];
  let km=0;
  for(let i=0;i<points.length;i++){
    const p=points[i];
    const z = line[i]?.[2]; // meters
    if(i>0){
      const dx = haversineKm(points[i-1], p);
      km += dx;
    }
    elevSamples.push({ km, m: typeof z==="number"? z : 0 });
  }

  const poly = Polyline.parse({
    points,
    distance_km: (distance_m/1000),
    mode: (mode==="walk"||mode==="hike"||mode==="bike"||mode==="drive")?mode:"drive",
    elevation_gain_m: ascent_m ?? 0,
    elevation_samples: elevSamples
  });
  return NextResponse.json(poly);
}

// tiny helper (duplicate to avoid importing geo.ts in edge)
function haversineKm(a:{lat:number;lng:number}, b:{lat:number;lng:number}) {
  const R=6371, dLat=deg(b.lat-a.lat), dLon=deg(b.lng-a.lng);
  const la1=deg(a.lat), la2=deg(b.lat);
  const h=Math.sin(dLat/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}
const deg=(x:number)=>x*Math.PI/180;
