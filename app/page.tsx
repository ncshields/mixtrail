'use client';

import dynamic from 'next/dynamic';

const Planner = dynamic(async () => {
  const mod = await import('@/components/Planner');
  return (mod as any).Planner ?? (mod as any).default;
}, { ssr: false });

export default function Page() {
  return (
    <main className="p-4">
      <Planner />
    </main>
  );
}
