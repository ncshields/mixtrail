"use client";

import { useRef, useState } from "react";
import ElevationChart from "./ElevationChart";
import MapView from "./MapView";
import type { CacheCandidateT, PolylineT } from "@/lib/schemas";

type Pt = { lat: number; lng: number };
type Mode = "drive" | "bike" | "walk" | "hike";

export default function Planner() {
  const [start, setStart] = useState<Pt>({ lat: 38.9072, lng: -77.0369 }); // DC
  const [end, setEnd] = useState<Pt>({ lat: 38.2929, lng: -78.6796 }); // SNP
  const [mode, setMode] = useState<Mode>("walk");
  const [route, setRoute] = useState<PolylineT | null>(null);
  const [candidates, setCandidates] = useState<CacheCandidateT[]>([]);
  const [picks, setPicks] = useState<CacheCandidateT[]>([]);
  const [loading, setLoading] = useState(false);
  const [listUrl, setListUrl] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement | null>(null);

  async function planFromPoints(): Promise<void> {
    await plan({ start, end, mode });
  }

  async function plan(params: { start: Pt; end: Pt; mode: Mode }): Promise<void> {
    setLoading(true);
    setListUrl(null);
    try {
      const polyRes = await fetch("/api/route/plan", {
        method: "POST",
        body: JSON.stringify(params),
      });
      const poly = (await polyRes.json()) as PolylineT;
      setRoute(poly);
      await suggest(poly, params.mode);
    } finally {
      setLoading(false);
    }
  }

  async function suggest(poly: PolylineT, m: Mode): Promise<void> {
    const prefs = {
      target_caches: 8,
      max_corridor_m: m === "drive" ? 800 : m === "bike" ? 600 : 300,
      max_extra_detour_m: 1500,
      difficulty_range: [1, 4] as [number, number],
      terrain_range: [1, 4] as [number, number],
      types: ["Traditional", "Virtual", "Earthcache", "Letterbox"] as Array<
        "Traditional" | "Virtual" | "Earthcache" | "Letterbox" | "Mystery" | "Multi"
      >,
      avoid_recent_dnfs: true,
      spacing_km: 25,
    };

    const candRes = await fetch("/api/candidates", {
      method: "POST",
      body: JSON.stringify({ polyline: poly, prefs }),
    });
    const cand = (await candRes.json()) as { candidates: CacheCandidateT[] };
    setCandidates(cand.candidates);

    const selRes = await fetch("/api/route/select", {
      method: "POST",
      body: JSON.stringify({ polyline: poly, prefs, candidates: cand.candidates }),
    });
    const sel = (await selRes.json()) as {
      picks: Array<{ gc_code: string }>;
    };

    const mapped = sel.picks
      .map((p) => cand.candidates.find((c) => c.gc_code === p.gc_code))
      .filter((x): x is CacheCandidateT => Boolean(x));
    setPicks(mapped);
  }

  async function onUploadGPX(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setListUrl(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const poly = (await (await fetch("/api/gpx/import", { method: "POST", body: fd })).json()) as PolylineT;
      setMode("walk");
      setRoute(poly);
      await suggest(poly, "walk");
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function exportGPX(): Promise<void> {
    if (!picks.length) return;
    const res = await fetch("/api/export/gpx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ picks, route }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mixtrail-picks.gpx";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function createListStub(): Promise<void> {
    if (!picks.length) return;
    const res = await fetch("/api/geocaching/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listName: "My MixTrail Plan",
        picks: picks.map((p) => ({ gc_code: p.gc_code })),
      }),
    });
    const data = (await res.json()) as { listUrl: string };
    setListUrl(data.listUrl);
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Start (lat,lng)</label>
            <input
              className="mt-1 w-full border rounded p-2"
              value={`${start.lat}, ${start.lng}`}
              onChange={(e) => {
                const [la, ln] = e.target.value.split(",").map((s) => parseFloat(s.trim()));
                if (!Number.isNaN(la) && !Number.isNaN(ln)) setStart({ lat: la, lng: ln });
              }}
            />
          </div>
          <div>
            <label className="text-sm font-medium">End (lat,lng)</label>
            <input
              className="mt-1 w-full border rounded p-2"
              value={`${end.lat}, ${end.lng}`}
              onChange={(e) => {
                const [la, ln] = e.target.value.split(",").map((s) => parseFloat(s.trim()));
                if (!Number.isNaN(la) && !Number.isNaN(ln)) setEnd({ lat: la, lng: ln });
              }}
            />
          </div>

          <div className="col-span-2 flex gap-2 items-center">
            <label className="text-sm">Mode</label>
            <select className="border rounded p-2" value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
              <option value="drive">Driving</option>
              <option value="bike">Biking</option>
              <option value="walk">Walking</option>
              <option value="hike">Hiking</option>
            </select>
            <button onClick={planFromPoints} className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-60" disabled={loading}>
              {loading ? "Planning…" : "Plan Route & Suggest Caches"}
            </button>
            <input ref={fileRef} type="file" accept=".gpx" onChange={onUploadGPX} className="text-sm" />
            <span className="text-xs text-gray-500">…or upload a trail GPX</span>
          </div>
        </div>

        <div className="w-full md:w-96 border rounded p-3">
          <h3 className="font-semibold mb-2">Selected Picks</h3>
          <ol className="list-decimal ml-5 space-y-2">
            {picks.map((p) => (
              <li key={p.gc_code}>
                <div className="font-medium">
                  {p.name} <span className="text-xs text-gray-500">({p.gc_code})</span>
                </div>
                <div className="text-xs text-gray-600">
                  D/T {p.difficulty}/{p.terrain} • detour ~{Math.round(p.extra_detour_m)} m
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-3 flex flex-col gap-2">
            <button onClick={exportGPX} className="bg-emerald-600 text-white rounded px-3 py-2 disabled:opacity-60" disabled={!picks.length}>
              Export GPX
            </button>
            <button onClick={createListStub} className="bg-gray-800 text-white rounded px-3 py-2 disabled:opacity-60" disabled={!picks.length}>
              Create List (stub)
            </button>
            {listUrl && (
              <a className="text-blue-700 text-sm underline break-all" href={listUrl} target="_blank">
                Open mock list
              </a>
            )}
          </div>
        </div>
      </div>

      {route?.elevation_samples?.length ? (
        <div className="border rounded p-2">
          <div className="text-sm text-gray-700 mb-1">
            Distance: {route.distance_km.toFixed(1)} km • Elevation gain: {Math.round(route.elevation_gain_m)} m
          </div>
          <ElevationChart samples={route.elevation_samples} />
        </div>
      ) : null}

      <MapView route={route ?? undefined} candidates={candidates} picks={picks} />
    </div>
  );
}
