'use client';
/**
 * ComplaintBoard — Kanban 3 คอลัมน์ (ใหม่ / กำลังดำเนินการ / เสร็จสิ้น)
 * เปลี่ยนสถานะได้ 2 วิธี:
 *   1) ลากการ์ดข้ามคอลัมน์ (HTML5 Drag & Drop)
 *   2) คลิกปุ่มลูกศรบนการ์ดครั้งเดียว
 * ทุกการเปลี่ยนสถานะ → ใบไม้บนต้นเปลี่ยนสี realtime ทุกเครื่อง
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import type { AdminComplaint, ComplaintStatus } from '@/types';

const COLUMNS: { key: ComplaintStatus; title: string; icon: string; head: string }[] = [
  { key: 'NEW', title: 'กำลังตรวจสอบ', icon: '🔴', head: 'border-rose-400/60' },
  { key: 'IN_PROGRESS', title: 'กำลังดำเนินการ', icon: '🟡', head: 'border-yellow-400/60' },
  { key: 'RESOLVED', title: 'เสร็จสิ้น', icon: '✅', head: 'border-canopy-500/60' },
];

export default function ComplaintBoard({
  complaints, onChangeStatus, onOpenDetail,
}: {
  complaints: AdminComplaint[];
  onChangeStatus: (id: string, status: ComplaintStatus) => void;
  onOpenDetail: (c: AdminComplaint) => void;
}) {
  const [overCol, setOverCol] = useState<ComplaintStatus | null>(null);

  const drop = (e: React.DragEvent, status: ComplaintStatus) => {
    e.preventDefault();
    setOverCol(null);
    const id = e.dataTransfer.getData('text/plain');
    if (id) onChangeStatus(id, status);
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {COLUMNS.map((col) => {
        const items = complaints.filter((c) => c.status === col.key);
        return (
          <div key={col.key}
            onDragOver={(e) => { e.preventDefault(); setOverCol(col.key); }}
            onDragLeave={() => setOverCol((v) => (v === col.key ? null : v))}
            onDrop={(e) => drop(e, col.key)}
            className={`glass rounded-2xl border-t-4 p-3 transition ${col.head} ${
              overCol === col.key ? 'ring-2 ring-canopy-400/60' : ''
            }`}>
            <h3 className="mb-2 flex items-center justify-between px-1 font-display text-sm font-semibold text-slate-700 dark:text-slate-200">
              <span>{col.icon} {col.title}</span>
              <span className="rounded-full bg-white/60 px-2 py-0.5 text-xs dark:bg-white/10">{items.length}</span>
            </h3>

            <div className="max-h-[52vh] space-y-2 overflow-y-auto pr-1">
              {items.length === 0 && (
                <p className="py-6 text-center text-xs text-slate-400">— ว่าง —</p>
              )}
              {items.map((c) => (
                <motion.div key={c.id} layout
                  draggable
                  onDragStart={(e) => (e as unknown as React.DragEvent).dataTransfer?.setData('text/plain', c.id)}
                  onClick={() => onOpenDetail(c)}
                  className="cursor-pointer rounded-xl bg-white/70 p-3 shadow-sm transition hover:shadow-md active:cursor-grabbing dark:bg-white/10">
                  <p className="text-xs font-semibold text-canopy-800 dark:text-canopy-200">
                    {c.kind === 'SUGGESTION' && <span className="mr-1 rounded bg-yellow-100 px-1 py-px text-[10px] text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300">💡 เสนอแนะ</span>}
                    {c.category}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">{c.detail}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {c.department} · {new Date(c.createdAt).toLocaleDateString('th-TH')}
                    </span>
                    {/* คลิกครั้งเดียวเพื่อเลื่อนสถานะถัดไป */}
                    {col.key !== 'RESOLVED' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onChangeStatus(c.id, col.key === 'NEW' ? 'IN_PROGRESS' : 'RESOLVED');
                        }}
                        className="rounded-full bg-canopy-100 px-2 py-0.5 text-[11px] font-medium text-canopy-700 transition hover:bg-canopy-200 dark:bg-canopy-500/20 dark:text-canopy-300"
                        title={col.key === 'NEW' ? 'รับเรื่อง → กำลังดำเนินการ' : 'ปิดเรื่อง → เสร็จสิ้น'}>
                        {col.key === 'NEW' ? 'รับเรื่อง →' : 'เสร็จสิ้น →'}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
