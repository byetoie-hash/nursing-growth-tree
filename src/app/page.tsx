'use client';
import { useState, useEffect } from 'react';
import TreeDashboard from '@/components/dashboard/TreeDashboard';

export default function HomePage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!ready) {
    return (
      <main className="grid min-h-dvh place-items-center text-sm text-slate-500">
        กำลังรดน้ำต้นไม้… 🌱
      </main>
    );
  }

  return <TreeDashboard />;
}
