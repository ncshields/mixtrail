import type { CacheCandidateT, UserPrefsT } from "./schemas";
const clamp01=(x:number)=>Math.max(0,Math.min(1,x));
const inRange=(v:number,[a,b]:[number,number])=>v>=a&&v<=b;

export function scoreCandidate(c:CacheCandidateT,prefs:UserPrefsT){
  const w={prox:0.25,qual:0.20,fresh:0.10,fit:0.25,detour:-0.15,dnf:-0.05};
  const prox=1-clamp01(c.distance_to_route_m/prefs.max_corridor_m);
  const qual=clamp01(c.favorite_points/200); // crude normalize
  const fresh=c.last_found_days==null?0.4:1-clamp01((c.last_found_days)/180);
  const fitDT=inRange(c.difficulty,prefs.difficulty_range)&&inRange(c.terrain,prefs.terrain_range)?1:0.3;
  const fitType=prefs.types.includes(c.type)?1:0.5;
  const fit=0.7*fitDT+0.3*fitType;
  const detour=clamp01(c.extra_detour_m/prefs.max_extra_detour_m);
  const dnf=prefs.avoid_recent_dnfs?clamp01(c.recent_dnfs/3):0;
  return w.prox*prox+w.qual*qual+w.fresh*fresh+w.fit*fit+w.detour*(-detour)+w.dnf*(-dnf);
}

export function greedySpacedPicks(scored:(CacheCandidateT&{score:number})[], prefs:UserPrefsT){
  const spacing=Math.max(1,prefs.spacing_km); const max=prefs.target_caches;
  const picks:(CacheCandidateT&{score:number})[]=[];
  let lastKm=-Infinity;
  for(const c of scored.sort((a,b)=>b.score-a.score)){
    if(picks.length>=max) break;
    if(c.route_km_marker-lastKm>=spacing*0.8){ picks.push(c); lastKm=c.route_km_marker; }
  }
  return picks;
}
