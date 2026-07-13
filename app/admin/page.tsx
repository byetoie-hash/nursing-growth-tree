'use client';
/**
 * Admin Dashboard — สถิติ + กราฟ + Kanban เปลี่ยนสถานะ + ค้นหา/Filter
 * + Export Excel / Export PDF (หน้า report สั่งพิมพ์) + Logout
 * ทุกการเปลี่ยนสถานะสะท้อนสีใบไม้บนต้น realtime ทุกเครื่อง
 */
import { useCallback, useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import StatsCards from '@/components/admin/StatsCards';
import Charts from '@/components/admin/Charts';
import ComplaintBoard from '@/components/admin/ComplaintBoard';
import ComplaintDetail from '@/components/admin/ComplaintDetail';
import DepartmentManager from '@/components/admin/DepartmentManager';
import { useTheme } from '@/app/providers';
import type { AdminComplaint, ComplaintStatus, DashboardStats } from '@/types';

export default function AdminDashboardPage() {
  const { theme, toggle } = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [complaints, setComplaints] = useState<AdminComplaint[]>([]);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | ComplaintStatus>('');
  const [detail, setDetail] = useState<AdminComplaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  /** โหลดสถิติ + รายการร้องเรียนตามตัวกรอง — ทนต่อ API ล่มชั่วคราว (ไม่ค้าง ไม่เด้ง overlay) */
  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (statusFilter) params.set('status', statusFilter);
    try {
      const [sRes, cRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch(`/api/complaints?${params}`),
      ]);
      if (!sRes.ok || !cRes.ok) throw new Error(`สถิติ: ${sRes.status} / รายการ: ${cRes.status}`);
      const [s, c] = await Promise.all([sRes.json(), cRes.json()]);
      setStats(s);
      setComplaints(c.complaints ?? []);
      setLoadError('');
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'เชื่อมต่อฐานข้อมูลไม่ได้');
    } finally {
      setLoading(false);
    }
  }, [q, statusFilter]);

  useEffect(() => {
    // หน่วงค้นหาเล็กน้อย (debounce) เพื่อไม่ยิง API ทุกตัวอักษร
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  /** เปลี่ยนสถานะ (จาก Kanban ลาก/คลิก หรือจาก Modal) — optimistic update */
  const changeStatus = useCallback(async (id: string, status: ComplaintStatus, adminNote?: string) => {
    setComplaints((list) => list.map((c) => (c.id === id ? { ...c, status } : c)));
    setDetail((d) => (d && d.id === id ? { ...d, status, adminNote: adminNote ?? d.adminNote } : d));
    const res = await fetch(`/api/complaints/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminNote }),
    });
    if (!res.ok) await load(); // ถ้าพลาด โหลดคืนค่าจริง
    else fetch('/api/admin/stats').then((r) => r.json()).then(setStats).catch(() => {});
  }, [load]);

  return (
    <main className="min-h-dvh bg-gradient-to-b from-sky2-50 to-canopy-50/60 p-4 dark:from-slate-950 dark:to-slate-900 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        {/* แถบหัว */}
        <header className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
          <div>
            <h1 className="font-display text-lg font-bold text-canopy-800 dark:text-canopy-100">
              🌳 Dashboard ผู้ดูแล — The Nursing Growth Tree
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              จัดการข้อร้องเรียน คำชม และติดตามการเติบโตของต้นไม้
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/" className="btn btn-soft">🌳 ดูต้นไม้</a>
            <a href="/api/admin/export/excel" className="btn btn-soft">📊 Export Excel</a>
            <a href="/admin/report" className="btn btn-soft">🧾 Export PDF</a>
            <button onClick={toggle} className="btn btn-soft">{theme === 'dark' ? '☀️' : '🌙'}</button>
            <button onClick={() => signOut({ callbackUrl: '/admin/login' })} className="btn btn-soft">ออกจากระบบ</button>
          </div>
        </header>

        {loading ? (
          <p className="py-16 text-center text-sm text-slate-500">กำลังรดน้ำข้อมูล…</p>
        ) : !stats ? (
          <div className="glass mx-auto max-w-md rounded-2xl p-6 text-center">
            <p className="text-3xl">🥀</p>
            <p className="mt-2 font-display text-sm font-semibold text-canopy-800 dark:text-canopy-100">
              โหลดข้อมูลไม่สำเร็จ — ฐานข้อมูลอาจกำลังตื่นหรือหลุดชั่วคราว
            </p>
            {loadError && <p className="mt-1 text-xs text-slate-400">({loadError})</p>}
            <button onClick={() => { setLoading(true); load(); }} className="btn btn-primary mt-4">🔄 ลองใหม่</button>
          </div>
        ) : (
          <>
            <StatsCards stats={stats} />
            <Charts stats={stats} />

            {/* ค้นหา + Filter */}
            <div className="glass flex flex-wrap items-center gap-3 rounded-2xl p-3">
              <input className="field max-w-xs" placeholder="🔍 ค้นหารายละเอียด/ประเภทเรื่อง…"
                value={q} onChange={(e) => setQ(e.target.value)} />
              <select className="field max-w-52" value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as '' | ComplaintStatus)}>
                <option value="">ทุกสถานะ</option>
                <option value="NEW">🍂 ร้องเรียนใหม่</option>
                <option value="IN_PROGRESS">🟡 กำลังดำเนินการ</option>
                <option value="RESOLVED">✅ เสร็จสิ้น</option>
              </select>
              <p className="ml-auto text-xs text-slate-500 dark:text-slate-400">
                ลากการ์ดข้ามคอลัมน์ หรือคลิกปุ่มบนการ์ด เพื่อเปลี่ยนสถานะ
              </p>
            </div>

            <ComplaintBoard
              complaints={complaints}
              onChangeStatus={changeStatus}
              onOpenDetail={setDetail}
            />

            {/* จัดการหน่วยงาน + ตั้งค่าองค์กร (ไม่ต้องแก้โค้ด) */}
            <DepartmentManager />
          </>
        )}
      </div>

      <ComplaintDetail complaint={detail} onClose={() => setDetail(null)} onChangeStatus={changeStatus} />
    </main>
  );
}
