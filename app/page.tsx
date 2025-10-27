import Planner from "@/components/Planner";

export default function Page(){
  return (
    <main className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-3">MixTrail — Geocaches Along Any Route (Demo)</h1>
      <p className="text-sm text-gray-600 mb-4">Plan driving/biking/walking/hiking routes, see mock caches along the corridor, export GPX, and (later) export to your Geocaching list.</p>
      <Planner />
    </main>
  );
}
