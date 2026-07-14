'use client';
/**
 * แผงซ้าย "ร่วมสร้างต้นไม้ของพวกเรา" — การ์ดปุ่ม 3 ประเภท + QR Code
 * ตามภาพต้นแบบ: 💚 คำชื่นชม / 💡 ข้อเสนอแนะ / ❤️ ข้อร้องเรียน
 */
import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

function ActionCard({
  icon, iconBg, title, subtitle, onClick,
}: {
  icon: React.ReactNode; iconBg: string; title: string; subtitle: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-2xl border border-cream-200 bg-white/80 p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/5">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl ${iconBg}`}>{icon}</span>
      <span className="min-w-0">
        <span className="block font-display text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</span>
        <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">{subtitle}</span>
      </span>
      <span aria-hidden className="ml-auto text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-canopy-500">›</span>
    </button>
  );
}

export default function ActionPanel({
  onPraise, onSuggest, onComplaint,
}: {
  onPraise: () => void; onSuggest: () => void; onComplaint: () => void;
}) {
  // QR ชี้ไปหน้าที่กำลังเปิดอยู่จริงเสมอ (คำนวณฝั่งผู้ใช้หลังโหลด — ไม่ติดค่าจากตอน build)
  const [url, setUrl] = useState('');
  useEffect(() => { setUrl(window.location.href); }, []);

  return (
    <aside className="card flex flex-col gap-3 p-4">
      <div>
        <h2 className="card-title flex items-center gap-1.5">ร่วมสร้างต้นไม้ของพวกเรา <span aria-hidden>🍃</span></h2>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          ทุกความคิดเห็นของคุณ ทำให้กองการพยาบาลเติบโตยิ่งขึ้น
        </p>
      </div>

      <ActionCard icon="🍃" iconBg="bg-canopy-100 dark:bg-canopy-500/20"
        title="ปลูกใบไม้แห่งคำชื่นชม" subtitle="ส่งคำชื่นชมให้บุคลากรหรือหน่วยงาน"
        onClick={onPraise} />
      <ActionCard icon="💡" iconBg="bg-yellow-100 dark:bg-yellow-500/20"
        title="ให้ข้อเสนอแนะ" subtitle="ร่วมเสนอแนะเพื่อการพัฒนาที่ดียิ่งขึ้น"
        onClick={onSuggest} />
      <ActionCard icon="❤️" iconBg="bg-rose-100 dark:bg-rose-500/20"
        title="บอกเรา เพื่อช่วยกันดูแล" subtitle="แจ้งข้อร้องเรียนหรือความไม่สบายใจ"
        onClick={onComplaint} />

      {/* QR Code */}
      <div className="mt-1 flex items-center gap-3 rounded-2xl border border-dashed border-canopy-300/70 bg-canopy-50/60 p-3 dark:border-canopy-700 dark:bg-canopy-500/10">
        <div className="rounded-xl bg-white p-1.5 shadow-inner">
          {url ? <QRCodeSVG value={url} size={64} fgColor="#245d33" /> : <div style={{ width: 64, height: 64 }} />}
        </div>
        <div className="leading-tight">
          <p className="text-xs font-semibold text-canopy-800 dark:text-canopy-100">สแกน QR Code</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">เพื่อร่วมสร้างต้นไม้</p>
          <p className="mt-1 font-display text-[11px] italic text-blossom-500">Thank You ♡</p>
        </div>
      </div>
    </aside>
  );
}
