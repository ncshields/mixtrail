"use client";
type Sample={km:number;m:number};
export default function ElevationChart({samples}:{samples:Sample[]}) {
  if(!samples?.length) return null;
  const w=800, h=140, pad=18;
  const xs=samples.map(s=>s.km), ys=samples.map(s=>s.m);
  const xmin=Math.min(...xs), xmax=Math.max(...xs)||1;
  const ymin=Math.min(...ys), ymax=Math.max(...ys)||1;
  const x=(v:number)=>pad + (w-2*pad)*( (v-xmin)/(xmax-xmin||1) );
  const y=(v:number)=>h-pad - (h-2*pad)*( (v-ymin)/(ymax-ymin||1) );
  const d = samples.map((s,i)=>`${i?"L":"M"} ${x(s.km).toFixed(1)} ${y(s.m).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-40">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" />
      <text x={pad} y={12} fontSize="10">{`Elevation (min ${Math.round(ymin)}m / max ${Math.round(ymax)}m)`}</text>
    </svg>
  );
}
