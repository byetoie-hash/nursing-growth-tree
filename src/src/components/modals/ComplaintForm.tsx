'use client';
/**
 * ฟอร์มส่งข้อร้องเรียน — ครบตามข้อกำหนด:
 * ชื่อ(ไม่บังคับ)/ไม่เปิดเผยตัวตน, เบอร์โทร, LINE, Email, หน่วยงาน, ประเภทเรื่อง,
 * รายละเอียด, แนบรูป/ไฟล์, วันเวลาที่เกิดเหตุ, ช่องทางติดต่อกลับ, Captcha
 * หลังส่งสำเร็จ → ใบไม้สีน้ำตาลปลิวลงมาเกาะกิ่งแบบสุ่ม
 */
import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Captcha from '@/components/ui/Captcha';
import FileUpload from '@/components/ui/FileUpload';
import type { ContactChannel, PublicLeaf } from '@/types';

const COMPLAINT_CATEGORIES = [
  'พฤติกรรมการให้บริการ', 'ระยะเวลารอคอย', 'ความสะอาด/สิ่งแวดล้อม',
  'ระบบนัดหมาย/เอกสาร', 'ค่ารักษาพยาบาล', 'ความปลอดภัยผู้ป่วย', 'อื่น ๆ',
];
const SUGGESTION_CATEGORIES = [
  'การพัฒนาบริการ', 'สิ่งแวดล้อม/สถานที่', 'ระบบงาน/ขั้นตอน',
  'สวัสดิการ/ความสุขบุคลากร', 'นวัตกรรม/ไอเดียใหม่', 'อื่น ๆ',
];

interface Dept { id: string; name: string }

export default function ComplaintForm({
  open, onClose, onSubmitted, kind = 'COMPLAINT', fixedDepartmentId,
}: {
  open: boolean;
  onClose: () => void;
  onSubmitted: (leaf: PublicLeaf) => void;
  /** COMPLAINT = ข้อร้องเรียน / SUGGESTION = ข้อเสนอแนะ (ใช้ workflow เดียวกัน) */
  kind?: 'COMPLAINT' | 'SUGGESTION';
  /** หน้าเฉพาะหน่วยงาน: ล็อกหน่วยงานให้เลย ผู้ใช้ไม่ต้องเลือก */
  fixedDepartmentId?: string;
}) {
  const isSuggestion = kind === 'SUGGESTION';
  const CATEGORIES = isSuggestion ? SUGGESTION_CATEGORIES : COMPLAINT_CATEGORIES;
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [form, setForm] = useState({
    isAnonymous: false, senderName: '', phone: '', line: '', email: '',
    contactChannel: 'NONE' as ContactChannel, departmentId: '', category: '',
    detail: '', incidentDate: '', incidentTime: '',
  });
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
    const incidentAt = form.incidentDate
      ? new Date(`${form.incidentDate}T${form.incidentTime || '00:00'}`).toISOString()
      : undefined;
    const res = await fetch('/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind,
        isAnonymous: form.isAnonymous,
        senderName: form.isAnonymous ? undefined : form.senderName || undefined,
        phone: form.phone || undefined,
        line: form.line || undefined,
        email: form.email || undefined,
        contactChannel: form.contactChannel,
        departmentId: fixedDepartmentId ?? (form.departmentId || undefined),
        category: form.category,
        detail: form.detail,
        incidentAt,
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
      setForm({ isAnonymous: false, senderName: '', phone: '', line: '', email: '', contactChannel: 'NONE', departmentId: '', category: '', detail: '', incidentDate: '', incidentTime: '' });
      setAttachments([]);
    }, 1800);
  };

  return (
    <Modal open={open} onClose={onClose} title={isSuggestion ? 'ให้ข้อเสนอแนะ 💡' : 'บอกเรา เพื่อช่วยกันดูแล ❤️'} wide>
      {success ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="text-5xl">{isSuggestion ? '💡' : '🍂'}</span>
          <p className="font-display text-lg font-semibold text-canopy-800 dark:text-canopy-100">
            รับเรื่องแล้ว — ใบไม้ของคุณกำลังปลิวลงเกาะกิ่ง
          </p>
          <p className="text-sm text-slate-500">
            {isSuggestion
              ? 'ขอบคุณที่ร่วมพัฒนา — ทีมงานจะนำข้อเสนอแนะไปพิจารณา'
              : 'เราจะไม่ละเลยปัญหา — สีของใบจะเปลี่ยนตามสถานะการดูแลอย่างโปร่งใส'}
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 flex items-center gap-2 rounded-xl bg-bark-100/70 p-3 dark:bg-slate-800/60">
            <input id="anon" type="checkbox" checked={form.isAnonymous}
              onChange={(e) => set('isAnonymous', e.target.checked)}
              className="h-4 w-4 accent-canopy-600" />
            <label htmlFor="anon" className="text-sm">ไม่เปิดเผยตัวตน (ระบบจะไม่บันทึกชื่อของคุณ)</label>
          </div>

          {!form.isAnonymous && (
            <div>
              <label className="label">ชื่อ–สกุล (ไม่บังคับ)</label>
              <input className="field" value={form.senderName} onChange={(e) => set('senderName', e.target.value)} placeholder="เช่น สมชาย ใจดี" />
            </div>
          )}
          {!fixedDepartmentId && (
            <div>
              <label className="label">หน่วยงานที่เกี่ยวข้อง</label>
              <select className="field" value={form.departmentId} onChange={(e) => set('departmentId', e.target.value)}>
                <option value="">— เลือกหน่วยงาน —</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label">ประเภทเรื่อง *</label>
            <select className="field" required value={form.category} onChange={(e) => set('category', e.target.value)}>
              <option value="">— เลือกประเภท —</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">วันที่เกิดเหตุ</label>
            <input type="date" className="field" value={form.incidentDate} onChange={(e) => set('incidentDate', e.target.value)} />
          </div>
          <div>
            <label className="label">เวลาที่เกิดเหตุ</label>
            <input type="time" className="field" value={form.incidentTime} onChange={(e) => set('incidentTime', e.target.value)} />
          </div>

          <div className="sm:col-span-2">
            <label className="label">รายละเอียด *</label>
            <textarea className="field min-h-28" required minLength={10} maxLength={5000}
              value={form.detail} onChange={(e) => set('detail', e.target.value)}
              placeholder="เล่าเหตุการณ์ สถานที่ และสิ่งที่อยากให้ปรับปรุง — ข้อมูลนี้อ่านได้เฉพาะผู้ดูแลระบบ" />
          </div>

          <div className="sm:col-span-2">
            <FileUpload urls={attachments} onChange={setAttachments} />
          </div>

          <div className="sm:col-span-2 rounded-xl border border-sky2-200 bg-sky2-50/70 p-3 dark:border-slate-700 dark:bg-slate-800/50">
            <label className="label">ช่องทางติดต่อกลับ (ข้อมูลถูกเข้ารหัส เห็นได้เฉพาะผู้ดูแลระบบ)</label>
            <div className="grid gap-3 sm:grid-cols-3">
              <input className="field" placeholder="เบอร์โทร" inputMode="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
              <input className="field" placeholder="LINE ID" value={form.line} onChange={(e) => set('line', e.target.value)} />
              <input className="field" placeholder="Email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-sm">
              {(['NONE', 'PHONE', 'LINE', 'EMAIL'] as const).map((c) => (
                <label key={c} className="flex items-center gap-1.5">
                  <input type="radio" name="channel" className="accent-canopy-600"
                    checked={form.contactChannel === c} onChange={() => set('contactChannel', c)} />
                  {{ NONE: 'ไม่ต้องติดต่อกลับ', PHONE: 'โทรกลับ', LINE: 'LINE', EMAIL: 'Email' }[c]}
                </label>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2"><Captcha onChange={setCaptcha} /></div>
          {error && <p className="sm:col-span-2 text-sm text-red-500">{error}</p>}
          <div className="sm:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-soft">ยกเลิก</button>
            <button disabled={busy} className="btn-primary disabled:opacity-60">
              {busy ? 'กำลังส่ง…' : isSuggestion ? 'ส่งข้อเสนอแนะ 💡' : 'ส่งเรื่องให้เราดูแล'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
