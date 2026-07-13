'use client';
/**
 * =====================================================================
 *  Dashboard Panels — The Nursing Growth Tree (Living Culture Dashboard)
 * =====================================================================
 *  แผงต่าง ๆ ตามแบบต้นแบบของกองการพยาบาล:
 *  - ActionPanel   : "ร่วมสร้างต้นไม้ของพวกเรา" การ์ด 3 ปุ่ม + QR
 *  - StatBubbles   : วงสถิติ ใบไม้เขียว / ดอกปีบ / ผลไม้ / ราก
 *  - CareStatus    : สถานะการดูแล (ข้อร้องเรียน) แดง-เหลือง-เขียว
 *  - GrowthBar     : ภาพรวมการเติบโต % เทียบเดือนที่แล้ว
 *  - FeedPanel     : เรื่องราวล่าสุด (realtime)
 *  - TopDepartments: หน่วยงานที่ได้รับคำชื่นชมสูงสุดประจำเดือน
 * =====================================================================
 */
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { formatThaiDate } from '@/lib/utils';
import type { PublicDashboard, FeedItem } from '@/types';

/* ---------- การ์ดปุ่มหลัก 3 ใบ + QR ---------- */
export function ActionPanel({
  onPraise, onSuggest, onComplaint,
}: {
  onPraise: () => void;
  onSuggest: () => void;
  onComplaint: () => void;
}) {
  const url = typeof window !== 'undefined' ? window.location.origin : '';
  const cards = [
    {
      icon: '💚', title: 'ปลูกใบไม้แห่งคำชื่นชม',
      sub: 'ส่งคำชื่นชมให้บุคลากรหรือหน่วยงาน',
      cls: 'border-canopy-200 bg-canopy-50/80 hover:bg-canopy-100/80 dark:border-canopy-800 dark:bg-canopy-900/30',
      onClick: onPraise,
    },
    {
      icon: '💡', title: 'ให้ข้อเสนอแนะ',
      sub: 'ร่วมเสนอแนะเพื่อการพัฒนาที่ดียิ่งขึ้น',
      cls: 'border-amber-200 bg-amber-50/80 hover:bg-amber-100/80 dark:border-amber-800 dark:bg-amber-900/20',
      onClick: onSuggest,
    },
    {
      icon: '❤️', title: 'บอกเรา เพื่อช่วยกันดูแล',
      sub: 'แจ้งข้อร้องเรียนหรือความไม่สบายใจ',
      cls: 'border-rose-200 bg-rose-50/80 hover:bg-rose-100/80 dark:border-rose-800 dark:bg-rose-900/20',
      onClick: onComplaint,
    },
  ];
  return (
    <div className="card flex h-full flex-col gap-3 p-4">
      <div>
        <h2 className="font-display text-sm font-bold text-canopy-800 dark:text-canopy-100">
          🌿 ร่วมสร้างต้นไม้ของพวกเรา
        </h2>
        <p className="mt-0.5 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
          ทุกความคิดเห็นของคุณ ทำให้กองการพยาบาลเติบโตยิ่งขึ้น
        </p>
      </div>

      {cards.map((c, i) => (
        <motion.button key={c.title} onClick={c.onClick}
          initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 + i * 0.08 }}
          className={`flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition ${c.cls}`}>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-xl shadow-sm dark:bg-slate-800">
            {c.icon}
          </span>
          <span>
            <span className="block font-display text-[13px] font-semibold text-slate-800 dark:text-slate-100">{c.title}</span>
            <span className="block text-[11px] leading-snug text-slate-500 dark:text-slate-400">{c.sub}</span>
            <span className="mt-0.5 inline-block text-[11px] font-medium text-canopy-600 dark:text-canopy-300">แตะเพื่อส่ง ›</span>
          </span>
        </motion.button>
      ))}

      {/* QR ในแผง — สแกนเพื่อร่วมสร้างต้นไม้ */}
      <div className="mt-auto flex items-center gap-3 rounded-2xl bg-white/70 p-3 dark:bg-white/5">
        <div className="rounded-lg bg-white p-1.5 shadow-inner">
          <QRCodeSVG value={url || 'https://'} size={64} fgColor="#245d33" />
        </div>
        <div className="text-[11px] leading-snug text-slate-500 dark:text-slate-400">
          <p className="font-semibold text-canopy-700 dark:text-canopy-300">สแกน QR Code</p>
          <p>เพื่อร่วมสร้างต้นไม้</p>
          <p className="mt-0.5 font-display italic text-canopy-500">Thank You ♡</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- วงสถิติ: ใบไม้เขียว / ดอกปีบ / ผลไม้ / ราก ---------- */
export function StatBubbles({ data }: { data: PublicDashboard | null }) {
  const items = [
    { icon: '🍃', value: data?.praiseLeaves, label: 'ใบไม้สีเขียว', sub: 'คำชื่นชม', ring: 'ring-canopy-200 dark:ring-canopy-800' },
    { icon: '🌼', value: data?.flowers, label: 'ดอกปีบ', sub: 'ครบ 10 ใบ', ring: 'ring-slate-200 dark:ring-slate-700' },
    { icon: '🍈', value: data?.fruits, label: 'ผลไม้', sub: 'คุณภาพบริการ', ring: 'ring-lime-200 dark:ring-lime-800' },
    { icon: '🌱', value: data?.roots, label: 'รากแห่งคุณค่า', sub: 'วัฒนธรรมองค์กร', ring: 'ring-bark-200 dark:ring-amber-900' },
  ];
  return (
    <div className="flex flex-row justify-around gap-2 lg:flex-col lg:justify-start lg:gap-3">
      {items.map((it, i) => (
        <motion.div key={it.label}
          initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 + i * 0.08 }}
          className={`flex flex-col items-center rounded-2xl bg-white/85 px-2 py-2.5 text-center shadow-sm ring-2 dark:bg-slate-800/80 ${it.ring} lg:w-[92px]`}>
          <span className="text-lg leading-none">{it.icon}</span>
          <span className="mt-1 font-display text-xl font-bold leading-none text-canopy-800 dark:text-canopy-100">
            {data ? it.value : '–'}
          </span>
          <span className="mt-1 text-[10px] font-semibold leading-tight text-slate-600 dark:text-slate-300">{it.label}</span>
          <span className="text-[9px] leading-tight text-slate-400">{it.sub}</span>
        </motion.div>
      ))}
    </div>
  );
}

/* ---------- สถานะการดูแล (ข้อร้องเรียน) ---------- */
export function CareStatus({ data }: { data: PublicDashboard | null }) {
  const rows = [
    { key: 'NEW' as const, label: 'รอการดูแล', dot: 'bg-amber-700', chip: 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200' },
    { key: 'IN_PROGRESS' as const, label: 'กำลังดำเนินการ', dot: 'bg-yellow-400', chip: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-200' },
    { key: 'RESOLVED' as const, label: 'ดำเนินการแล้ว', dot: 'bg-canopy-500', chip: 'bg-canopy-50 text-canopy-700 dark:bg-canopy-900/40 dark:text-canopy-200' },
  ];
  return (
    <div className="rounded-2xl bg-white/85 p-3 shadow-sm dark:bg-slate-800/80 lg:w-[168px]">
      <p className="font-display text-[11px] font-bold text-slate-600 dark:text-slate-300">
        สถานะการดูแล <span className="font-normal text-slate-400">(ข้อร้องเรียน)</span>
      </p>
      <ul className="mt-2 space-y-1.5">
        {rows.map((r) => (
          <li key={r.key} className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 text-[11px] font-medium ${r.chip}`}>
            <span className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${r.dot}`} aria-hidden />
              {r.label}
            </span>
            <span className="font-display text-sm font-bold">{data ? data.care[r.key] : '–'}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-center text-[10px] leading-snug text-slate-400">
        ทุกใบเหลืองคือคำมั่นว่า<br />“เราจะไม่ละเลยปัญหา”
      </p>
    </div>
  );
}

/* ---------- ภาพรวมการเติบโต ---------- */
export function GrowthBar({ data }: { data: PublicDashboard | null }) {
  const g = data?.growthPercent;
  return (
    <div className="card flex items-center justify-between gap-4 px-4 py-3">
      <div className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-canopy-50 text-lg dark:bg-canopy-900/40">📊</span>
        <div>
          <p className="font-display text-sm font-bold text-slate-700 dark:text-slate-200">ภาพรวมการเติบโต</p>
          <p className="text-[11px] text-slate-400">คำชื่นชมเทียบกับเดือนที่แล้ว</p>
        </div>
      </div>
      <div className="text-right">
        {g === null || g === undefined ? (
          <p className="text-xs text-slate-400">ยังไม่มีข้อมูลเดือนก่อนหน้าให้เทียบ</p>
        ) : (
          <>
            <p className={`font-display text-xl font-bold ${g >= 0 ? 'text-canopy-600' : 'text-rose-500'}`}>
              {g >= 0 ? '↗' : '↘'} {Math.abs(g)}%
            </p>
            <p className="text-[11px] text-slate-400">จากเดือนที่แล้ว</p>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- เรื่องราวล่าสุด ---------- */
const FEED_META: Record<FeedItem['kind'], { icon: string; label: string; tone: string }> = {
  PRAISE: { icon: '💚', label: 'คำชื่นชม', tone: 'text-canopy-600 dark:text-canopy-300' },
  SUGGESTION: { icon: '💡', label: 'ข้อเสนอแนะ', tone: 'text-amber-600 dark:text-amber-300' },
  COMPLAINT: { icon: '❤️', label: 'ข้อร้องเรียน', tone: 'text-rose-500 dark:text-rose-300' },
};
const STATUS_CHIP: Record<string, { text: string; cls: string }> = {
  NEW: { text: 'รอการดูแล', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200' },
  IN_PROGRESS: { text: 'กำลังดำเนินการ', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-200' },
  RESOLVED: { text: 'เสร็จสิ้น ✓', cls: 'bg-canopy-100 text-canopy-700 dark:bg-canopy-900/50 dark:text-canopy-200' },
};

export function FeedPanel({ data }: { data: PublicDashboard | null }) {
  return (
    <div className="card flex h-full flex-col p-4">
      <h2 className="font-display text-sm font-bold text-canopy-800 dark:text-canopy-100">
        🍃 เรื่องราวล่าสุด
      </h2>
      <div className="mt-3 flex-1 space-y-2.5 overflow-y-auto pr-1">
        {!data ? (
          <p className="py-6 text-center text-xs text-slate-400">กำลังโหลด…</p>
        ) : data.feed.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">
            ยังไม่มีเรื่องราว — เป็นคนแรกที่ปลูกใบไม้ได้เลย 🌱
          </p>
        ) : (
          data.feed.map((f) => {
            const meta = FEED_META[f.kind];
            return (
              <div key={f.id} className="rounded-2xl bg-white/75 p-3 shadow-sm dark:bg-white/5">
                <div className="flex items-center justify-between">
                  <p className={`text-[11px] font-bold ${meta.tone}`}>{meta.icon} {meta.label}</p>
                  <p className="text-[10px] text-slate-400">{timeAgo(f.createdAt)}</p>
                </div>
                {f.kind === 'PRAISE' && f.message && (
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">“{f.message}”</p>
                )}
                {f.kind !== 'PRAISE' && (
                  <p className="mt-1.5 text-xs text-slate-400">
                    รายละเอียดเปิดอ่านได้เฉพาะผู้ดูแล เพื่อคุ้มครองผู้แจ้ง
                  </p>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-[10px] text-slate-400">{f.departmentName ?? 'ไม่ระบุหน่วยงาน'}</p>
                  {f.status && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_CHIP[f.status].cls}`}>
                      {STATUS_CHIP[f.status].text}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ---------- หน่วยงานที่ได้รับคำชื่นชมสูงสุดประจำเดือน ---------- */
const MEDALS = ['🥇', '🥈', '🥉'];
export function TopDepartments({ data }: { data: PublicDashboard | null }) {
  return (
    <div className="card flex flex-col items-stretch gap-3 px-4 py-3 sm:flex-row sm:items-center">
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-xl">🏆</span>
        <div className="leading-tight">
          <p className="font-display text-sm font-bold text-slate-700 dark:text-slate-200">หน่วยงานที่ได้รับคำชื่นชมสูงสุด</p>
          <p className="text-[11px] text-slate-400">ประจำเดือนนี้</p>
        </div>
      </div>
      <div className="flex flex-1 flex-wrap items-center justify-center gap-2.5 sm:justify-start">
        {!data || data.topDepartments.length === 0 ? (
          <p className="text-xs text-slate-400">ยังไม่มีคำชื่นชมในเดือนนี้ — มาเป็นคนแรกกันเถอะ 💚</p>
        ) : (
          data.topDepartments.map((d, i) => (
            <div key={d.name}
              className="flex items-center gap-2 rounded-full bg-white/80 py-1.5 pl-2 pr-3.5 shadow-sm dark:bg-white/5">
              <span className="text-base">{MEDALS[i] ?? '🌿'}</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{d.name}</span>
              <span className="text-[11px] text-canopy-600 dark:text-canopy-300">{d.praises} ใบ 🍃</span>
            </div>
          ))
        )}
      </div>
      <p className="hidden shrink-0 border-l border-canopy-100 pl-4 text-right font-display text-[11px] italic leading-snug text-canopy-600 dark:border-canopy-800 dark:text-canopy-300 lg:block">
        “เพราะคุณ คือคนสำคัญ<br />ที่ทำให้เราเติบโตไปด้วยกัน” 💚
      </p>
    </div>
  );
}

/* ---------- helper: เวลาแบบ "x นาทีที่แล้ว" ---------- */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'เมื่อสักครู่';
  if (min < 60) return `${min} นาทีที่แล้ว`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ชั่วโมงที่แล้ว`;
  return formatThaiDate(iso).split(' ')[0] ?? formatThaiDate(iso);
}
