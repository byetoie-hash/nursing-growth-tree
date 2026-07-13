'use client';
/**
 * PraiseReadModal — เปิดอ่านคำชมรายตัวเมื่อคลิกใบไม้คำชมบนต้น
 * (ข้อร้องเรียนเปิดอ่านไม่ได้ — สิทธิ์เฉพาะ Admin)
 */
import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { formatThaiDate } from '@/lib/utils';
import type { PublicPraise } from '@/types';

const CATEGORY_LABEL: Record<string, { text: string; icon: string; cls: string }> = {
  SERVICE_BEHAVIOR: { text: 'ด้านพฤติกรรมบริการ', icon: '🌸', cls: 'bg-blossom-100 text-blossom-700 dark:bg-blossom-400/15 dark:text-blossom-300' },
  GENERAL_SERVICE: { text: 'ด้านบริการทั่วไป', icon: '🍊', cls: 'bg-canopy-100 text-canopy-700 dark:bg-canopy-500/15 dark:text-canopy-300' },
};

export default function PraiseReadModal({
  praiseId, onClose,
}: {
  praiseId: string | null;   // null = ปิด
  onClose: () => void;
}) {
  const [praise, setPraise] = useState<PublicPraise | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!praiseId) { setPraise(null); return; }
    setLoading(true);
    fetch(`/api/praises?id=${praiseId}`)
      .then((r) => r.json())
      .then((d) => setPraise(d.praise ?? null))
      .finally(() => setLoading(false));
  }, [praiseId]);

  const cat = praise ? CATEGORY_LABEL[praise.category] : null;

  return (
    <Modal open={!!praiseId} onClose={onClose} title="คำชมจากผู้รับบริการ">
      {loading || !praise ? (
        <div className="flex items-center justify-center py-10 text-sm text-slate-500">
          {loading ? 'กำลังเปิดใบไม้…' : 'ไม่พบคำชมนี้'}
        </div>
      ) : (
        <div className="space-y-4">
          {cat && (
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${cat.cls}`}>
              {cat.icon} {cat.text}
            </span>
          )}
          <blockquote className="rounded-2xl bg-white/60 p-4 text-[15px] leading-relaxed text-slate-700 shadow-inner dark:bg-white/5 dark:text-slate-200">
            “{praise.message}”
          </blockquote>
          <div className="space-y-1 text-sm text-slate-500 dark:text-slate-400">
            {praise.staffName && <p>💚 ชมถึง: <span className="font-medium text-slate-700 dark:text-slate-200">{praise.staffName}</span></p>}
            {praise.departmentName && <p>🏥 หน่วยงาน: {praise.departmentName}</p>}
            <p>✍️ โดย: {praise.senderName ?? 'ไม่เปิดเผยตัวตน'}</p>
            <p>🕊️ {formatThaiDate(praise.createdAt)}</p>
          </div>
        </div>
      )}
    </Modal>
  );
}
