'use client';
/**
 * PraiseListModal — "ดูคำชม" ทั้งหมดในรูปแบบการ์ด (ทุกคนเปิดอ่านได้)
 */
import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { formatThaiDate } from '@/lib/utils';
import type { PublicPraise } from '@/types';

const CAT: Record<string, { icon: string; text: string }> = {
  SERVICE_BEHAVIOR: { icon: '🌸', text: 'พฤติกรรมบริการ' },
  GENERAL_SERVICE: { icon: '🍊', text: 'บริการทั่วไป' },
};

export default function PraiseListModal({
  open, onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [praises, setPraises] = useState<PublicPraise[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'SERVICE_BEHAVIOR' | 'GENERAL_SERVICE'>('ALL');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch('/api/praises')
      .then((r) => r.json())
      .then((d) => setPraises(d.praises ?? []))
      .finally(() => setLoading(false));
  }, [open]);

  const shown = filter === 'ALL' ? praises : praises.filter((p) => p.category === filter);

  return (
    <Modal open={open} onClose={onClose} title="คำชมทั้งหมด 💚" wide>
      {/* ตัวกรองด้าน */}
      <div className="mb-4 flex flex-wrap gap-2">
        {([['ALL', '🌳 ทั้งหมด'], ['SERVICE_BEHAVIOR', '🌸 พฤติกรรมบริการ'], ['GENERAL_SERVICE', '🍊 บริการทั่วไป']] as const)
          .map(([k, label]) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                filter === k
                  ? 'bg-canopy-600 text-white shadow'
                  : 'bg-white/60 text-slate-600 hover:bg-white dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/20'
              }`}>
              {label}
            </button>
          ))}
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-slate-500">กำลังเก็บใบไม้มาให้อ่าน…</p>
      ) : shown.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          ยังไม่มีคำชมในหมวดนี้ — เป็นคนแรกที่ฝากคำชมได้เลย 🌱
        </p>
      ) : (
        <ul className="grid max-h-[60vh] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
          {shown.map((p) => (
            <li key={p.id} className="rounded-2xl bg-white/60 p-4 shadow-sm dark:bg-white/5">
              <p className="text-xs font-semibold text-canopy-700 dark:text-canopy-300">
                {CAT[p.category]?.icon} {CAT[p.category]?.text}
              </p>
              <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                “{p.message}”
              </p>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                {p.staffName ? `ชมถึง ${p.staffName} · ` : ''}
                {p.departmentName ? `${p.departmentName} · ` : ''}
                {p.senderName ?? 'ไม่เปิดเผยตัวตน'} · {formatThaiDate(p.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
