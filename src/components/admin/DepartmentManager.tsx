'use client';
/**
 * DepartmentManager — จัดการระบบจากหน้าแอดมิน ไม่ต้องแก้โค้ด (พร้อมย้ายไปใช้องค์กรอื่น)
 *  - แก้ชื่อองค์กร/บรรทัดรอง (โชว์บน Header ทุกหน้า)
 *  - เพิ่ม/แก้ชื่อ/เปิด-ปิดหน่วยงาน + ลิงก์และ QR ต้นไม้ประจำหน่วยงาน
 */
import { useCallback, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { AdminDepartment } from '@/types';

export default function DepartmentManager() {
  const [depts, setDepts] = useState<AdminDepartment[]>([]);
  const [org, setOrg] = useState({ orgName: '', orgSub: '' });
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [qrFor, setQrFor] = useState<AdminDepartment | null>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 2500); };

  const load = useCallback(async () => {
    const [d, s] = await Promise.all([
      fetch('/api/admin/departments').then((r) => r.json()).catch(() => ({ departments: [] })),
      fetch('/api/settings').then((r) => r.json()).catch(() => ({})),
    ]);
    setDepts(d.departments ?? []);
    setOrg({ orgName: s.orgName ?? '', orgSub: s.orgSub ?? '' });
  }, []);
  useEffect(() => { load(); }, [load]);

  const saveOrg = async () => {
    setBusy(true);
    const res = await fetch('/api/admin/settings', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(org),
    });
    setBusy(false);
    flash(res.ok ? '✅ บันทึกชื่อองค์กรแล้ว' : '❌ บันทึกไม่สำเร็จ');
  };

  const addDept = async () => {
    if (!newName.trim()) return;
    setBusy(true);
    const res = await fetch('/api/admin/departments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName.trim() }),
    });
    setBusy(false);
    if (res.ok) { setNewName(''); flash('✅ เพิ่มหน่วยงานแล้ว'); load(); }
    else flash(`❌ ${(await res.json()).error ?? 'เพิ่มไม่สำเร็จ'}`);
  };

  const patch = async (id: string, data: { name?: string; active?: boolean }) => {
    setBusy(true);
    const res = await fetch(`/api/admin/departments/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    });
    setBusy(false);
    if (res.ok) { setEditing(null); load(); }
    else flash(`❌ ${(await res.json()).error ?? 'บันทึกไม่สำเร็จ'}`);
  };

  const unitUrl = (id: string) => `${window.location.origin}/unit/${id}`;
  const copy = (id: string) => {
    navigator.clipboard.writeText(unitUrl(id)).then(() => flash('📋 คัดลอกลิงก์แล้ว'));
  };

  return (
    <section className="glass space-y-4 rounded-2xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-sm font-bold text-canopy-800 dark:text-canopy-100">
          ⚙️ ตั้งค่าระบบ & หน่วยงาน <span className="font-normal text-slate-400">(แก้ได้เลย ไม่ต้องแตะโค้ด)</span>
        </h2>
        {msg && <span className="text-xs font-medium text-canopy-700 dark:text-canopy-300">{msg}</span>}
      </div>

      {/* ชื่อองค์กร */}
      <div className="grid grid-cols-1 gap-2 rounded-2xl bg-white/50 p-3 dark:bg-white/5 sm:grid-cols-[1fr_1fr_auto]">
        <div>
          <label className="label">ชื่อองค์กร (โชว์บนหัวเว็บ)</label>
          <input className="field" value={org.orgName} maxLength={120}
            onChange={(e) => setOrg((o) => ({ ...o, orgName: e.target.value }))}
            placeholder="เช่น กองการพยาบาล โรงพยาบาล..." />
        </div>
        <div>
          <label className="label">บรรทัดรอง</label>
          <input className="field" value={org.orgSub} maxLength={120}
            onChange={(e) => setOrg((o) => ({ ...o, orgSub: e.target.value }))}
            placeholder="เช่น Nursing Division" />
        </div>
        <button onClick={saveOrg} disabled={busy} className="btn btn-primary self-end">💾 บันทึก</button>
      </div>

      {/* เพิ่มหน่วยงาน */}
      <div className="flex gap-2">
        <input className="field" value={newName} maxLength={120}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addDept()}
          placeholder="➕ ชื่อหน่วยงานใหม่ เช่น หอผู้ป่วยศัลยกรรม 2" />
        <button onClick={addDept} disabled={busy || !newName.trim()} className="btn btn-primary shrink-0">เพิ่ม</button>
      </div>

      {/* ตารางหน่วยงาน */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 dark:text-slate-400">
              <th className="pb-2">หน่วยงาน</th>
              <th className="pb-2 text-center">🍃 คำชม</th>
              <th className="pb-2 text-center">❤️ เรื่องดูแล</th>
              <th className="pb-2 text-center">เปิดใช้งาน</th>
              <th className="pb-2 text-right">ต้นไม้ประจำหน่วย</th>
            </tr>
          </thead>
          <tbody>
            {depts.map((d) => (
              <tr key={d.id} className="border-t border-cream-200/70 dark:border-white/10">
                <td className="py-2 pr-2">
                  {editing?.id === d.id ? (
                    <span className="flex gap-1">
                      <input className="field !py-1" value={editing.name} autoFocus
                        onChange={(e) => setEditing({ id: d.id, name: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && patch(d.id, { name: editing.name.trim() })} />
                      <button className="btn btn-primary !px-2 !py-1" onClick={() => patch(d.id, { name: editing.name.trim() })}>✔</button>
                      <button className="btn btn-soft !px-2 !py-1" onClick={() => setEditing(null)}>✕</button>
                    </span>
                  ) : (
                    <button className="text-left hover:underline" title="คลิกเพื่อแก้ชื่อ"
                      onClick={() => setEditing({ id: d.id, name: d.name })}>
                      {d.name} <span className="text-xs text-slate-400">✏️</span>
                    </button>
                  )}
                </td>
                <td className="py-2 text-center">{d.praises}</td>
                <td className="py-2 text-center">{d.complaints}</td>
                <td className="py-2 text-center">
                  <button role="switch" aria-checked={d.active} disabled={busy}
                    onClick={() => patch(d.id, { active: !d.active })}
                    className={`h-6 w-11 rounded-full p-0.5 transition ${d.active ? 'bg-canopy-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                    <span className={`block h-5 w-5 rounded-full bg-white shadow transition ${d.active ? 'translate-x-5' : ''}`} />
                  </button>
                </td>
                <td className="py-2 text-right">
                  <span className="inline-flex gap-1">
                    <a className="btn btn-soft !px-2 !py-1 text-xs" href={`/unit/${d.id}`} target="_blank">🌳 เปิด</a>
                    <button className="btn btn-soft !px-2 !py-1 text-xs" onClick={() => copy(d.id)}>📋 ลิงก์</button>
                    <button className="btn btn-soft !px-2 !py-1 text-xs" onClick={() => setQrFor(d)}>🔳 QR</button>
                  </span>
                </td>
              </tr>
            ))}
            {depts.length === 0 && (
              <tr><td colSpan={5} className="py-6 text-center text-xs text-slate-400">ยังไม่มีหน่วยงาน — เพิ่มด้านบนได้เลย</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-slate-400">
        💡 ปิดใช้งาน = ซ่อนจาก dropdown และปิดหน้าต้นไม้ของหน่วยนั้น (ข้อมูลเดิมไม่หาย เปิดกลับได้)
        · ใบที่ปลูกบนต้นหน่วยงานจะไปรวมบนต้นหลักโดยอัตโนมัติ
      </p>

      {/* Modal QR รายหน่วยงาน */}
      {qrFor && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setQrFor(null)}>
          <div className="card w-full max-w-xs bg-white p-5 text-center dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <p className="font-display text-sm font-semibold text-canopy-800 dark:text-canopy-100">🌳 {qrFor.name}</p>
            <p className="mb-3 text-[11px] text-slate-400">สแกนเพื่อเปิดต้นไม้ของหน่วยงานนี้</p>
            <div className="mx-auto w-fit rounded-2xl bg-white p-3 shadow-inner">
              <QRCodeSVG value={unitUrl(qrFor.id)} size={190} fgColor="#245d33" />
            </div>
            <p className="mt-2 break-all text-[10px] text-slate-400">{unitUrl(qrFor.id)}</p>
            <div className="mt-3 flex justify-center gap-2">
              <button className="btn btn-soft text-xs" onClick={() => copy(qrFor.id)}>📋 คัดลอกลิงก์</button>
              <button className="btn btn-primary text-xs" onClick={() => setQrFor(null)}>ปิด</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
