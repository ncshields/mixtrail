import type { CacheCandidateT } from "./schemas";
import { nearestPointIndexOnRoute, haversineKm } from "./geo";

export function mockCandidatesForRoute(poly:{points:{lat:number;lng:number}[]}): CacheCandidateT[] {
  const pts=[
    { gc_code:"GC10001", name:"Blue Ridge Vista", type:"Traditional", coords:{lat:38.9,lng:-77.2}, difficulty:2, terrain:2.5, favorite_points:80, last_found_days:7, recent_dnfs:0 },
    { gc_code:"GC10002", name:"Historic Marker Virtual", type:"Virtual", coords:{lat:38.7,lng:-77.6}, difficulty:1.5, terrain:1.5, favorite_points:65, last_found_days:3, recent_dnfs:0 },
    { gc_code:"GC10003", name:"Skyline Geology", type:"Earthcache", coords:{lat:38.55,lng:-78.3}, difficulty:2.5, terrain:2, favorite_points:120, last_found_days:10, recent_dnfs:1 },
    { gc_code:"GC10004", name:"Wayside Traditional", type:"Traditional", coords:{lat:38.44,lng:-78.55}, difficulty:2, terrain:2, favorite_points:40, last_found_days:20, recent_dnfs:0 },
    { gc_code:"GC10005", name:"Trail Letterbox", type:"Letterbox", coords:{lat:38.62,lng:-78.0}, difficulty:2, terrain:3, favorite_points:25, last_found_days:2, recent_dnfs:0 },
  ];
  const out:CacheCandidateT[]=[];
  for(const p of pts as any[]){
    const near=nearestPointIndexOnRoute(poly.points,p.coords);
    const d=haversineKm(poly.points[near.index],p.coords)*1000;
    out.push({
      ...p, size:"Small", on_trail_hint:false,
      distance_to_route_m:d, extra_detour_m:d*2, route_km_marker:near.kmMarker
    } as CacheCandidateT);
  }
  return out;
}
