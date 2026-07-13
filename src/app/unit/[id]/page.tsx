'use client';
/**
 * /unit/[id] — ต้นไม้เฉพาะหน่วยงาน (1 หน้า 1 ต้น เหมือนต้นหลัก)
 * ผู้ใช้สแกน QR ของหน่วยงาน → ส่งคำชม/เสนอแนะ/ร้องเรียนได้เลย ไม่ต้องเลือกหน่วยงาน
 * ใบที่ปลูกที่นี่จะไปโผล่บนต้นหลักของกองการพยาบาลด้วยแบบ realtime
 */
import { useEffect, useState } from 'react';
import TreeDashboard from '@/components/dashboard/TreeDashboard';

export default function UnitTreePage({ params }: { params: { id: string } }) {
  const [name, setName] = useState<string | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'notfound'>('loading');

  useEffect(() => {
    fetch('/api/departments')
      .then((r) => (r.ok ? r.json() : { departments: [] }))
      .then((d: { departments: { id: string; name: string }[] }) => {
        const found = d.departments.find((x) => x.id === params.id);
        if (found) { setName(found.name); setState('ok'); }
        else setState('notfound');
      })
      .catch(() => setState('notfound'));
  }, [params.id]);

  if (state === 'loading') {
    return <main className="grid min-h-dvh place-items-center text-sm text-slate-500">กำลังรดน้ำต้นไม้… 🌱</main>;
  }
  if (state === 'notfound') {
    return (
      <main className="grid min-h-dvh place-items-center p-6 text-center">
        <div className="card max-w-sm p-6">
          <p className="text-3xl">🍂</p>
          <p className="mt-2 font-display font-semibold text-canopy-800 dark:text-canopy-100">ไม่พบหน่วยงานนี้ หรือถูกปิดใช้งาน</p>
          <p className="mt-1 text-xs text-slate-500">ลิงก์/QR อาจเก่าแล้ว — สอบถามผู้ดูแลระบบได้ครับ</p>
          <a href="/" className="btn btn-primary mt-4 inline-block">🌳 ไปที่ต้นหลักขององค์กร</a>
        </div>
      </main>
    );
  }
  return <TreeDashboard departmentId={params.id} departmentName={name ?? undefined} />;
}
