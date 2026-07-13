'use client';
/**
 * ฟอร์มฝากคำชม — เลือกด้าน (พฤติกรรมบริการ = ใบเขียวอ่อน → ดอกชมพู,
 * บริการทั่วไป = ใบเขียวอ่อนอีกเฉด → ผลไม้), ระบุเจ้าหน้าที่/หน่วยงาน,
 * แนบรูปได้, Captcha — หลังส่งสำเร็จใบไม้ปลิวลงเกาะกิ่งทันที
 */
import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Captcha from '@/components/ui/Captcha';
import FileUpload from '@/components/ui/FileUpload';
import type { PraiseCategory, PublicLeaf } from '@/types';

interface Dept { id: string; name: string }

const EMPTY = {
  isAnonymous: false, senderName: '', departmentId: '',
  category: 'SERVICE_BEHAVIOR' as PraiseCategory, message: '', staffName: '',
};

export default function PraiseForm({
  open, onClose, onSubmitted, fixedDepartmentId,
}: {
  open: boolean;
  onClose: () => void;
  onSubmitted: (leaf: PublicLeaf) => void;
  /** หน้าเฉพาะหน่วยงาน: ล็อกหน่วยงานให้เลย ผู้ใช้ไม่ต้องเลือก */
  fixedDepartmentId?: string;
}) {
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [captcha, setCaptcha] = useState({ token: '', answer: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (fixedDepartmentId) return; // หน้าเฉพาะหน่วยงาน ไม่ต้องโหลด dropdown
    fetch('/api/departments')
      .then((r) => (r.ok ? r.json() : { departments: [] }))
      .then((d) => setDepartments(d.departments ?? []))
      .catch(() => setDepartments([]));
  }, [fixedDepartmentId]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    const res = await fetch('/api/praises', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        isAnonymous: form.isAnonymous,
        senderName: form.isAnonymous ? undefined : form.senderName || undefined,
        departmentId: fixedDepartmentId ?? (form.departmentId || undefined),
        category: form.category,
        message: form.message,
        staffName: form.staffName || undefined,
        attachments,
        captchaToken: captcha.token,
        captchaAnswer: captcha.answer,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setError(data.error ?? 'ส่งไม่สำเร็จ'); return; }
    setSuccess(true);
    onSubmitted(data.leaf);
    setTimeout(() => {
      setSuccess(false);
      onClose();
      setForm(EMPTY);
      setAttachments([]);
    }, 2200);
  };

  return (
    <Modal open={open} onClose={onClose} title="ปลูกใบไม้แห่งคำชื่นชม 🍃">
      {success ? (
        /* หน้าจอขอบคุณ — ใบไม้เขียวอ่อนกำลังปลิวลงเกาะกิ่ง */
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="animate-bounce text-5xl">🍃</span>
          <p className="font-display text-lg font-semibold text-canopy-700 dark:text-canopy-200">
            ขอบคุณสำหรับคำชื่นชม!
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            ใบไม้ของคุณกำลังปลิวลงเกาะบน The Nursing Growth Tree 🌳
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {/* เลือกด้านของคำชม */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => set('category', 'SERVICE_BEHAVIOR')}
              className={`rounded-2xl border-2 p-3 text-left transition ${
                form.category === 'SERVICE_BEHAVIOR'
                  ? 'border-blossom-400 bg-blossom-50 dark:bg-blossom-400/10'
                  : 'border-transparent bg-white/50 hover:bg-white/80 dark:bg-white/5 dark:hover:bg-white/10'
              }`}>
              <p className="font-display text-sm font-semibold">🌼 ด้านพฤติกรรมบริการ</p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                ครบ 10 ใบ ดอกปีบสีขาวจะค่อย ๆ บาน 1 ดอก
              </p>
            </button>
            <button type="button" onClick={() => set('category', 'GENERAL_SERVICE')}
              className={`rounded-2xl border-2 p-3 text-left transition ${
                form.category === 'GENERAL_SERVICE'
                  ? 'border-canopy-500 bg-canopy-50 dark:bg-canopy-500/10'
                  : 'border-transparent bg-white/50 hover:bg-white/80 dark:bg-white/5 dark:hover:bg-white/10'
              }`}>
              <p className="font-display text-sm font-semibold">🍈 ด้านคุณภาพการบริการ</p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                ครบ 10 ใบ ผลไม้จะค่อย ๆ โต 1 ผล
              </p>
            </button>
          </div>

          {/* ผู้ส่ง */}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isAnonymous}
              onChange={(e) => set('isAnonymous', e.target.checked)}
              className="h-4 w-4 rounded accent-canopy-600" />
            ไม่เปิดเผยตัวตน
          </label>
          {!form.isAnonymous && (
            <div>
              <label className="label">ชื่อผู้ส่งคำชื่นชม (ไม่บังคับ)</label>
              <input className="field" value={form.senderName}
                onChange={(e) => set('senderName', e.target.value)}
                placeholder="เช่น คุณสมหญิง ใจดี" maxLength={120} />
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">เจ้าหน้าที่/ทีมที่ต้องการชม (ไม่บังคับ)</label>
              <input className="field" value={form.staffName}
                onChange={(e) => set('staffName', e.target.value)}
                placeholder="เช่น พยาบาลวิชาชีพ ก." maxLength={120} />
            </div>
            {!fixedDepartmentId && (
              <div>
                <label className="label">หน่วยงาน (ไม่บังคับ)</label>
                <select className="field" value={form.departmentId}
                  onChange={(e) => set('departmentId', e.target.value)}>
                  <option value="">— ไม่ระบุ —</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="label">ข้อความคำชม *</label>
            <textarea className="field min-h-28" required minLength={5} maxLength={2000}
              value={form.message} onChange={(e) => set('message', e.target.value)}
              placeholder="เล่าประสบการณ์ดี ๆ ที่ได้รับ เพื่อเป็นกำลังใจให้ทีมงาน…" />
          </div>

          <div>
            <label className="label">แนบรูปภาพ (ไม่บังคับ สูงสุด 3 ไฟล์)</label>
            <FileUpload urls={attachments} onChange={setAttachments} max={3} />
          </div>

          <Captcha onChange={setCaptcha} />

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn btn-soft">ยกเลิก</button>
            <button type="submit" disabled={busy} className="btn btn-pink">
              {busy ? 'กำลังส่ง…' : 'ส่งคำชื่นชม 🍃'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
