'use client';
/** แผงขวา "เรื่องราวล่าสุด" — feed คำชื่นชม/ข้อเสนอแนะ/ข้อร้องเรียน realtime */
import type { ComplaintStatus, FeedItem } from '@/types';
import { formatThaiDate } from '@/lib/clientUtils';

const TYPE_META = {
  PRAISE: { icon: '🍃', label: 'คำชื่นชม', ring: 'bg-canopy-100 dark:bg-canopy-500/20' },
  SUGGESTION: { icon: '💡', label: 'ข้อเสนอแนะ', ring: 'bg-yellow-100 dark:bg-yellow-500/20' },
  COMPLAINT: { icon: '❤️', label: 'ข้อร้องเรียน', ring: 'bg-rose-100 dark:bg-rose-500/20' },
} as const;

const STATUS_CHIP: Record<ComplaintStatus, { text: string; cls: string }> = {
  NEW: { text: 'กำลังตรวจสอบ', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300' },
  IN_PROGRESS: { text: 'กำลังดำเนินการ', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300' },
  RESOLVED: { text: 'เสร็จสิ้น', cls: 'bg-canopy-100 text-canopy-700 dark:bg-canopy-500/20 dark:text-canopy-300' },
};

export default function RecentFeed({ items }: { items: FeedItem[] }) {
  return (
    <aside className="card flex min-h-0 flex-col p-4 lg:h-0 lg:min-h-full">
      <h2 className="card-title mb-2 flex items-center gap-1.5"><span aria-hidden>🍃</span> เรื่องราวล่าสุด</h2>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 max-h-[420px] lg:max-h-none">
        {items.length === 0 && (
          <p className="py-8 text-center text-xs text-slate-400">
            ยังไม่มีเรื่องราว — เป็นคนแรกที่ปลูกใบไม้ให้ต้นนี้ 🌱
          </p>
        )}
        {items.map((it) => {
          const meta = TYPE_META[it.type];
          return (
            <article key={`${it.type}-${it.id}`}
              className="rounded-2xl border border-cream-200 bg-white/70 p-2.5 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center gap-2">
                <span aria-hidden className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm ${meta.ring}`}>
                  {meta.icon}
                </span>
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">{meta.label}</p>
                  <p className="text-[10px] text-slate-400">{formatThaiDate(it.createdAt)}</p>
                </div>
                {it.status && (
                  <span className={`chip ${STATUS_CHIP[it.status].cls}`}>{STATUS_CHIP[it.status].text}</span>
                )}
              </div>
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{it.text}</p>
              <p className="mt-1 text-[10px] text-slate-400">
                {it.departmentName ?? 'ไม่ระบุหน่วยงาน'} · {it.senderName ?? 'ไม่เปิดเผยตัวตน'}
              </p>
            </article>
          );
        })}
      </div>
    </aside>
  );
}
