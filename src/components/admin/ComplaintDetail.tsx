'use client';
/**
 * ComplaintDetail — รายละเอียดข้อร้องเรียนฉบับเต็ม (Admin เท่านั้น)
 * แสดงข้อมูลติดต่อกลับที่ถอดรหัสแล้ว + ไฟล์แนบ + ปุ่มเปลี่ยนสถานะ + บันทึกโน้ต
 */
import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { formatThaiDate } from '@/lib/utils';
import type { AdminComplaint, ComplaintStatus } from '@/types';

const STATUS_LABEL: Record<ComplaintStatus, { text: string; cls: string }> = {
  NEW: { text: '🍂 ร้องเรียนใหม่', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' },
  IN_PROGRESS: { text: '🟡 กำลังดำเนินการ', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300' },
  RESOLVED: { text: '✅ เสร็จสิ้น', cls: 'bg-canopy-100 text-canopy-700 dark:bg-canopy-500/15 dark:text-canopy-300' },
};

const CHANNEL_LABEL: Record<string, string> = {
  NONE: 'ไม่ประสงค์ให้ติดต่อกลับ', PHONE: 'โทรศัพท์', LINE: 'LINE', EMAIL: 'อีเมล',
};

export default function ComplaintDetail({
  complaint, onClose, onChangeStatus,
}: {
  complaint: AdminComplaint | null;
  onClose: () => void;
  onChangeStatus: (id: string, status: ComplaintStatus, adminNote?: string) => Promise<void> | void;
}) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { setNote(complaint?.adminNote ?? ''); }, [complaint]);
  if (!complaint) return null;
  const s = STATUS_LABEL[complaint.status];

  const change = async (status: ComplaintStatus) => {
    setBusy(true);
    await onChangeStatus(complaint.id, status, note || undefined);
    setBusy(false);
  };

  return (
    <Modal open={!!complaint} onClose={onClose} title="รายละเอียดข้อร้องเรียน" wide>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${s.cls}`}>{s.text}</span>
          <span className="rounded-full bg-white/60 px-3 py-1 text-xs text-slate-600 dark:bg-white/10 dark:text-slate-300">
            {complaint.category}
          </span>
          <span className="rounded-full bg-white/60 px-3 py-1 text-xs text-slate-600 dark:bg-white/10 dark:text-slate-300">
            🏥 {complaint.department}
          </span>
        </div>

        {/* รายละเอียดเรื่อง */}
        <div className="rounded-2xl bg-white/60 p-4 text-sm leading-relaxed text-slate-700 dark:bg-white/5 dark:text-slate-200">
          {complaint.detail}
        </div>

        {/* ข้อมูลผู้ส่ง + ช่องทางติดต่อกลับ (ถอดรหัสแล้ว — เห็นเฉพาะ Admin) */}
        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-2xl bg-white/50 p-3 dark:bg-white/5">
            <p className="mb-1 text-xs font-semibold text-slate-500 dark:text-slate-400">🔐 ข้อมูลผู้ส่ง (ความลับ)</p>
            <p>ผู้ส่ง: <b>{complaint.senderName}</b></p>
            <p>ช่องทางติดต่อกลับ: {CHANNEL_LABEL[complaint.contactChannel]}</p>
            {complaint.phone && <p>📞 {complaint.phone}</p>}
            {complaint.line && <p>💬 LINE: {complaint.line}</p>}
            {complaint.email && <p>✉️ {complaint.email}</p>}
          </div>
          <div className="rounded-2xl bg-white/50 p-3 dark:bg-white/5">
            <p className="mb-1 text-xs font-semibold text-slate-500 dark:text-slate-400">🕒 เส้นเวลา</p>
            <p>ส่งเมื่อ: {formatThaiDate(complaint.createdAt)}</p>
            {complaint.incidentAt && <p>เกิดเหตุ: {formatThaiDate(complaint.incidentAt)}</p>}
            {complaint.acknowledgedAt && <p>รับเรื่อง: {formatThaiDate(complaint.acknowledgedAt)}</p>}
            {complaint.resolvedAt && <p>ปิดเรื่อง: {formatThaiDate(complaint.resolvedAt)}</p>}
          </div>
        </div>

        {/* ไฟล์แนบ */}
        {complaint.attachments.length > 0 && (
          <div>
            <p className="label">ไฟล์แนบ ({complaint.attachments.length})</p>
            <div className="flex flex-wrap gap-2">
              {complaint.attachments.map((url, i) => (
                <a key={url} href={url} target="_blank" rel="noreferrer"
                  className="rounded-xl bg-sky2-100 px-3 py-1.5 text-xs font-medium text-sky-700 transition hover:bg-sky2-200 dark:bg-sky-500/15 dark:text-sky-300">
                  📎 ไฟล์แนบ {i + 1}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* โน้ตผู้ดูแล */}
        <div>
          <label className="label">บันทึกการดำเนินการ (Admin Note)</label>
          <textarea className="field min-h-20" maxLength={2000} value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="เช่น ประสานหัวหน้าหน่วยงานแล้ว นัดติดตามผลวันศุกร์…" />
        </div>

        {/* ปุ่มเปลี่ยนสถานะ — คลิกครั้งเดียว */}
        <div className="flex flex-wrap justify-end gap-2 pt-1">
          {complaint.status !== 'NEW' && (
            <button disabled={busy} onClick={() => change('NEW')} className="btn btn-soft">🍂 ตีกลับเป็นใหม่</button>
          )}
          {complaint.status !== 'IN_PROGRESS' && (
            <button disabled={busy} onClick={() => change('IN_PROGRESS')} className="btn btn-soft">🟡 รับเรื่อง/ดำเนินการ</button>
          )}
          {complaint.status !== 'RESOLVED' && (
            <button disabled={busy} onClick={() => change('RESOLVED')} className="btn btn-primary">✅ ปิดเรื่อง (เสร็จสิ้น)</button>
          )}
          {complaint.status === 'RESOLVED' && (
            <button disabled={busy} onClick={() => change('RESOLVED')} className="btn btn-primary">💾 บันทึกโน้ต</button>
          )}
        </div>
      </div>
    </Modal>
  );
}
