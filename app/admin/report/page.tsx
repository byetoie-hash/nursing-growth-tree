'use client';
/**
 * รายงานสรุป (Export PDF) — หน้า print-optimized:
 * กดปุ่ม "บันทึกเป็น PDF" → window.print() → เลือก Save as PDF
 * วิธีนี้รองรับฟอนต์ภาษาไทยสมบูรณ์ 100% (ต่างจาก server-side PDF)
 */
import { useEffect, useState } from 'react';
import { formatThaiDate } from '@/lib/utils';
import type { AdminComplaint, DashboardStats } from '@/types';

export default function AdminReportPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [complaints, setComplaints] = useState<AdminComplaint[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/stats').then((r) => r.json()),
      fetch('/api/complaints').then((r) => r.json()),
    ]).then(([s, c]) => { setStats(s); setComplaints(c.complaints ?? []); });
  }, []);

  if (!stats) return <p className="p-10 text-center text-sm text-slate-500">กำลังจัดเตรียมรายงาน…</p>;

  const STATUS_TH: Record<string, string> = { NEW: 'ใหม่', IN_PROGRESS: 'กำลังดำเนินการ', RESOLVED: 'เสร็จสิ้น' };

  return (
    <main className="mx-auto max-w-3xl bg-white p-8 text-slate-800 print:p-0">
      {/* แถบเครื่องมือ — ซ่อนตอนพิมพ์ */}
      <div className="mb-6 flex justify-between gap-2 print:hidden">
        <a href="/admin" className="btn btn-soft">← กลับ Dashboard</a>
        <button onClick={() => window.print()} className="btn btn-primary">🖨️ บันทึกเป็น PDF</button>
      </div>

      {/* หัวรายงาน */}
      <header className="mb-6 border-b-2 border-canopy-600 pb-4 text-center">
        <h1 className="font-display text-2xl font-bold text-canopy-800">รายงานต้นไม้จริยธรรม (Ethics Tree)</h1>
        <p className="mt-1 text-sm text-slate-500">
          {process.env.NEXT_PUBLIC_HOSPITAL_NAME ?? 'โรงพยาบาล'} · ออกรายงานเมื่อ {formatThaiDate(new Date().toISOString())}
        </p>
      </header>

      {/* สรุปตัวเลข */}
      <section className="mb-6">
        <h2 className="mb-2 font-display text-base font-semibold">1. สรุปภาพรวม</h2>
        <table className="w-full border-collapse text-sm">
          <tbody>
            <tr className="border-b"><td className="py-1.5">ข้อร้องเรียนทั้งหมด</td><td className="text-right font-semibold">{stats.complaints.total}</td></tr>
            <tr className="border-b"><td className="py-1.5 pl-4">— ใหม่ / กำลังดำเนินการ / เสร็จสิ้น</td>
              <td className="text-right">{stats.complaints.NEW} / {stats.complaints.IN_PROGRESS} / {stats.complaints.RESOLVED}</td></tr>
            <tr className="border-b"><td className="py-1.5">คำชมทั้งหมด (พฤติกรรมบริการ / บริการทั่วไป)</td>
              <td className="text-right font-semibold">{stats.praises.total} ({stats.praises.SERVICE_BEHAVIOR} / {stats.praises.GENERAL_SERVICE})</td></tr>
            <tr className="border-b"><td className="py-1.5">รางวัลบนต้นไม้ (ราก / ดอก / ผล)</td>
              <td className="text-right">{stats.rewards.ROOT} / {stats.rewards.FLOWER} / {stats.rewards.FRUIT}</td></tr>
            <tr className="border-b"><td className="py-1.5">เปอร์เซ็นต์การดำเนินงานสำเร็จ</td><td className="text-right font-semibold">{stats.resolvedPercent}%</td></tr>
            <tr><td className="py-1.5">เวลารับเรื่องเฉลี่ย (Average Response Time)</td>
              <td className="text-right">{stats.avgResponseHours == null ? '—' : `${stats.avgResponseHours} ชั่วโมง`}</td></tr>
          </tbody>
        </table>
      </section>

      {/* จัดอันดับหน่วยงาน */}
      <section className="mb-6">
        <h2 className="mb-2 font-display text-base font-semibold">2. จัดอันดับหน่วยงาน</h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-slate-300 text-left">
              <th className="py-1.5">อันดับ</th><th>หน่วยงาน</th>
              <th className="text-right">ร้องเรียน</th><th className="text-right">คำชม</th>
            </tr>
          </thead>
          <tbody>
            {stats.departmentRanking.map((d, i) => (
              <tr key={d.name} className="border-b border-slate-100">
                <td className="py-1.5">{i + 1}</td><td>{d.name}</td>
                <td className="text-right">{d.complaints}</td><td className="text-right">{d.praises}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* รายการร้องเรียนล่าสุด */}
      <section>
        <h2 className="mb-2 font-display text-base font-semibold">3. ข้อร้องเรียนล่าสุด ({complaints.length} รายการ)</h2>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b-2 border-slate-300 text-left">
              <th className="py-1.5">วันที่</th><th>ประเภท</th><th>หน่วยงาน</th><th>รายละเอียด</th><th>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {complaints.map((c) => (
              <tr key={c.id} className="break-inside-avoid border-b border-slate-100 align-top">
                <td className="py-1.5 whitespace-nowrap">{new Date(c.createdAt).toLocaleDateString('th-TH')}</td>
                <td>{c.category}</td>
                <td>{c.department}</td>
                <td className="max-w-64 pr-2">{c.detail.slice(0, 120)}{c.detail.length > 120 ? '…' : ''}</td>
                <td className="whitespace-nowrap">{STATUS_TH[c.status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer className="mt-8 border-t pt-3 text-center text-[11px] text-slate-400">
        เอกสารภายใน — ข้อมูลผู้ร้องเรียนถูกปกปิดตามนโยบายความเป็นส่วนตัว · สร้างโดยระบบต้นไม้จริยธรรม
      </footer>
    </main>
  );
}
