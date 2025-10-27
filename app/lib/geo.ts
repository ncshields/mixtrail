export function haversineKm(a:{lat:number;lng:number}, b:{lat:number;lng:number}) {
  const R=6371, dLat=deg(b.lat-a.lat), dLon=deg(b.lng-a.lng);
  const la1=deg(a.lat), la2=deg(b.lat);
  const h=Math.sin(dLat/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}
const deg = (x:number)=>x*Math.PI/180;

export function lineDistanceKm(points:{lat:number;lng:number}[]) {
  let d=0; for(let i=1;i<points.length;i++) d+=haversineKm(points[i-1],points[i]); return d;
}

export function nearestPointIndexOnRoute(route:{lat:number;lng:number}[], p:{lat:number;lng:number}) {
  let best=Infinity, idx=0, accKm=0, bestAcc=0;
  for(let i=0;i<route.length;i++){
    const d=haversineKm(route[i],p);
    if(d<best){ best=d; idx=i; bestAcc=accKm; }
    if(i<route.length-1) accKm+=haversineKm(route[i],route[i+1]);
  }
  return { index: idx, kmMarker: bestAcc };
}
