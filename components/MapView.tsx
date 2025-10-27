"use client";
import { useEffect, useRef } from "react";
import maplibregl, { Map } from "maplibre-gl";

type Pt={lat:number;lng:number};
type Props={ route?:{points:Pt[]}; candidates?:{coords:Pt;name:string;gc_code:string}[]; picks?:{coords:Pt;gc_code:string}[]; };

export default function MapView({route,candidates=[],picks=[]}:Props){
  const divRef=useRef<HTMLDivElement>(null); const mapRef=useRef<Map|null>(null);

  useEffect(()=>{
    if(!divRef.current || mapRef.current) return;
    const map=new maplibregl.Map({
      container:divRef.current,
      style:"https://demotiles.maplibre.org/style.json",
      center:[-77.0369,38.9072], zoom:7
    });
    map.addControl(new maplibregl.NavigationControl(),"top-right");
    mapRef.current=map;
  },[]);

  useEffect(()=>{
    const map=mapRef.current; if(!map) return;

    ["route","route-line","candidates","picks"].forEach(id=>{
      if(map.getLayer(id)) map.removeLayer(id);
      if(map.getSource(id)) map.removeSource(id);
    });

    if(route){
      const coords=route.points.map(p=>[p.lng,p.lat]);
      map.addSource("route",{type:"geojson",data:{type:"Feature",geometry:{type:"LineString",coordinates:coords}}});
      map.addLayer({id:"route-line",type:"line",source:"route",paint:{"line-color":"#2563eb","line-width":4}});
      const b=new maplibregl.LngLatBounds(); coords.forEach((c:any)=>b.extend(c)); map.fitBounds(b,{padding:48,duration:0});
    }

    if(candidates.length){
      map.addSource("candidates",{type:"geojson",data:{type:"FeatureCollection",features:candidates.map(c=>({
        type:"Feature", properties:{title:c.name,gc:c.gc_code}, geometry:{type:"Point",coordinates:[c.coords.lng,c.coords.lat]}
      }))}});
      map.addLayer({id:"candidates",type:"circle",source:"candidates",paint:{"circle-radius":5,"circle-color":"#10b981"}});
    }

    if(picks.length){
      map.addSource("picks",{type:"geojson",data:{type:"FeatureCollection",features:picks.map(c=>({
        type:"Feature",properties:{gc:c.gc_code},geometry:{type:"Point",coordinates:[c.coords.lng,c.coords.lat]}
      }))}});
      map.addLayer({id:"picks",type:"circle",source:"picks",paint:{"circle-radius":7,"circle-color":"#ef4444"}});
    }
  },[route,candidates,picks]);

  return <div ref={divRef} className="h-[520px] w-full rounded border" />;
}
