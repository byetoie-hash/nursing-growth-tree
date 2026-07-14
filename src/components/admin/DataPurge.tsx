'use client';
/**
 * 🗂️ ปิดรอบข้อมูล — เคลียร์ข้อมูลเก่าเพื่อเริ่มรอบใหม่ (เช่น ปีงบประมาณใหม่)
 * ขั้นตอนบังคับ: 1) Export Excel สำรอง  2) ติ๊กยืนยันว่าสำรองแล้ว
 * 3) พิมพ์คำว่า "ปิดรอบข้อมูล"  4) กดลบ — ระบบลบข้อมูล + ไฟล์แนบ + แจ้งทุกเครื่องโหลดใหม่
 */
import { useState } from 'react';

export default function DataPurge({ onPurged }: { onPurged: () => void }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'ALL' | 'BEFORE'>('BEFORE');
  const [before, setBefore] = useState('');
  const [resetRewards, setResetRewards] = useState(false);
  const [backedUp, setBackedUp] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState('');

  const ready = backedUp && confirmText === 'ปิดรอบข้อมูล' && (mode === 'ALL' || !!before);

  const run = async () => {
    if (!ready || busy) return;
    setBusy(true); setResult('');
    try {
      const res = await fetch('/api/admin/purge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          before: mode === 'BEFORE' ? before : '',
          resetRewards,
          confirm: confirmText,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? 'ลบไม่สำเร็จ');
      setResult(`✅ ปิดรอบสำเร็จ — ลบคำชม ${d.praises} · เรื่องดูแล ${d.complaints} · รางวัล ${d.rewards} · ไฟล์แนบ ${d.files}`);
      setConfirmText(''); setBackedUp(false);
      onPurged();
    } catch (e) {
      setResult(`❌ ${e instanceof Error ? e.message : 'เกิดข้อผิดพลาด'}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="glass rounded-2xl p-4">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between text-left">
        <span className="font-display text-sm font-bold text-canopy-800 dark:text-canopy-100">
          🗂️ ปิดรอบข้อมูล <span className="font-normal text-slate-400">(เคลียร์ข้อมูลเก่า เริ่มฤดูกาลใหม่)</span>
        </span>
        <span aria-hidden className="text-slate-400">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-4 rounded-2xl border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-500/30 dark:bg-rose-500/5">
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            การปิดรอบจะ<b>ลบคำชื่นชม ข้อเสนอแนะ ข้อร้องเรียน และไฟล์แนบ</b>ตามช่วงที่เลือกอย่างถาวร
            ต้นไม้ทุกเครื่องจะรีเฟรชอัตโนมัติ — <b>กู้คืนไม่ได้</b> โปรดทำตามขั้นตอนให้ครบ
          </p>

          {/* ขั้น 1: สำรองข้อมูล */}
          <div className="rounded-xl bg-white/70 p-3 dark:bg-white/5">
            <p className="text-xs font-semibold">ขั้นที่ 1 — สำรองข้อมูลก่อน (บังคับ)</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <a href="/api/admin/export/excel" className="btn btn-soft text-xs">📊 ดาวน์โหลด Excel สำรอง</a>
              <label className="flex items-center gap-1.5 text-xs">
                <input type="checkbox" checked={backedUp} onChange={(e) => setBackedUp(e.target.checked)} />
                ฉันได้ดาวน์โหลดและเปิดตรวจไฟล์สำรองแล้ว
              </label>
            </div>
          </div>

          {/* ขั้น 2: เลือกช่วง */}
          <div className="rounded-xl bg-white/70 p-3 dark:bg-white/5">
            <p className="text-xs font-semibold">ขั้นที่ 2 — เลือกช่วงข้อมูลที่จะลบ</p>
            <div className="mt-2 space-y-1.5 text-xs">
              <label className="flex items-center gap-1.5">
                <input type="radio" checked={mode === 'BEFORE'} onChange={() => setMode('BEFORE')} />
                ลบเฉพาะข้อมูลที่เก่ากว่าวันที่:
                <input type="date" className="field !w-auto !py-1" value={before}
                  onChange={(e) => setBefore(e.target.value)} disabled={mode !== 'BEFORE'} />
              </label>
              <label className="flex items-center gap-1.5">
                <input type="radio" checked={mode === 'ALL'} onChange={() => setMode('ALL')} />
                ลบทั้งหมด (เริ่มต้นใหม่ทั้งต้น)
              </label>
              <label className="mt-1 flex items-center gap-1.5">
                <input type="checkbox" checked={resetRewards} onChange={(e) => setResetRewards(e.target.checked)} />
                รีเซ็ตดอกปีบ / ผลไม้ / ราก สะสมด้วย
              </label>
            </div>
          </div>

          {/* ขั้น 3: ยืนยัน */}
          <div className="rounded-xl bg-white/70 p-3 dark:bg-white/5">
            <p className="text-xs font-semibold">ขั้นที่ 3 — พิมพ์คำว่า <b>ปิดรอบข้อมูล</b> เพื่อยืนยัน</p>
            <div className="mt-2 flex gap-2">
              <input className="field flex-1 !py-1.5 text-sm" value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)} placeholder="ปิดรอบข้อมูล" />
              <button onClick={run} disabled={!ready || busy}
                className="shrink-0 rounded-xl bg-rose-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-40">
                {busy ? 'กำลังลบ…' : '🗑️ ลบข้อมูล'}
              </button>
            </div>
          </div>

          {result && <p className="text-xs font-medium">{result}</p>}
        </div>
      )}
    </section>
  );
}
