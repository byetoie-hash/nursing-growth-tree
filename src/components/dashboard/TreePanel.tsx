'use client';
/**
 * แผงกลาง — ต้นไม้แห่งการเติบโต + สถิติวงกลมซ้าย + สถานะการดูแลขวา + แถบการเติบโตล่าง
 * ตามภาพต้นแบบ The Nursing Growth Tree
 */
import { forwardRef } from 'react';
import type { PublicDashboard } from '@/types';

function StatBubble({ value, label, sub, icon }: { value: number; label: string; sub?: string; icon: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-2xl bg-white/85 px-2 py-2.5 text-center shadow-sm backdrop-blur-sm dark:bg-slate-900/70">
      <span aria-hidden className="text-lg leading-none">{icon}</span>
      <span className="font-display text-xl font-bold leading-none text-canopy-700 dark:text-canopy-200">{value}</span>
      <span className="text-[10px] font-medium leading-tight text-slate-600 dark:text-slate-300">{label}</span>
      {sub && <span className="text-[9px] leading-tight text-slate-400">{sub}</span>}
    </div>
  );
}

function CareRow({ color, value, label }: { color: string; value: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span aria-hidden className="h-3 w-3 shrink-0 rounded-full" style={{ background: color }} />
      <span className="font-display text-sm font-bold text-slate-800 dark:text-slate-100">{value}</span>
      <span className="text-[11px] text-slate-500 dark:text-slate-400">{label}</span>
    </div>
  );
}

const TreePanel = forwardRef<HTMLCanvasElement, { data: PublicDashboard | null; unitName?: string }>(
  function TreePanel({ data, unitName }, canvasRef) {
    const growth = data?.growthPercent;
    return (
      <section className="card relative overflow-hidden">
        {/* หัวการ์ด */}
        <div className="flex items-center justify-between px-4 pt-3">
          <h2 className="card-title">{unitName ? `ต้นไม้แห่งการเติบโตของ ${unitName}` : 'ต้นไม้แห่งการเติบโตของกองการพยาบาล'} <span aria-hidden>ⓘ</span></h2>
          <span className="chip bg-cream-100 text-slate-500 dark:bg-white/10 dark:text-slate-300">
            🍃 ใบไม้แต่ละใบ คือหนึ่งเสียงสะท้อน
          </span>
        </div>

        {/* ฉากต้นไม้ */}
        <div className="relative mx-3 mb-3 mt-2 h-[380px] overflow-hidden rounded-2xl sm:h-[460px] lg:h-[520px]">
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none"
            role="img"
            aria-label="ต้นไม้แห่งการเติบโต — ใบเขียวอ่อนคือคำชื่นชม (กดอ่านได้) ใบแดง/เหลือง/เขียวเข้มคือสถานะการดูแลข้อร้องเรียน" />

          {/* สถิติซ้าย */}
          <div className="pointer-events-none absolute left-2 top-2 z-10 grid w-[86px] gap-1.5 sm:left-3 sm:top-3">
            <StatBubble icon="🍃" value={data?.praise.total ?? 0} label="ใบไม้เขียว" sub="คำชื่นชม" />
            <StatBubble icon="🌼" value={data?.rewards.FLOWER ?? 0} label="ดอกปีบ" sub="ครบ 10 ใบ" />
            <StatBubble icon="🍈" value={data?.rewards.FRUIT ?? 0} label="ผลไม้" sub="คุณภาพบริการ" />
            <StatBubble icon="🌱" value={data?.rewards.ROOT ?? 0} label="รากแห่งคุณค่า" sub="ทุก 10 การแก้ไข" />
          </div>

          {/* สถานะการดูแลขวา */}
          <div className="absolute right-2 top-2 z-10 w-[168px] rounded-2xl bg-white/85 p-3 shadow-sm backdrop-blur-sm dark:bg-slate-900/70 sm:right-3 sm:top-3">
            <p className="mb-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300">สถานะการดูแล (ข้อร้องเรียน)</p>
            <div className="space-y-1.5">
              <CareRow color="#d9534f" value={data?.care.NEW ?? 0} label="กำลังตรวจสอบ" />
              <CareRow color="#e3b93d" value={data?.care.IN_PROGRESS ?? 0} label="กำลังดำเนินการ" />
              <CareRow color="#2b753d" value={data?.care.RESOLVED ?? 0} label="ดำเนินการแล้ว" />
              <CareRow color="#8bcb95" value={data?.suggestionTotal ?? 0} label="ข้อเสนอแนะสะสม" />
            </div>
          </div>

          {/* Quote มุมขวาล่าง */}
          <div className="pointer-events-none absolute bottom-2 right-2 z-10 hidden w-[190px] rounded-2xl bg-white/80 p-3 text-[11px] leading-relaxed text-slate-600 shadow-sm backdrop-blur-sm dark:bg-slate-900/70 dark:text-slate-300 sm:block">
            <span aria-hidden className="font-display text-lg leading-none text-canopy-400">“</span>
            ทุกใบไม้ คือ ความใส่ใจ ทุกดอกไม้ คือ ความภาคภูมิใจ ทุกผลไม้ คือ คุณค่าที่ส่งต่อ
            <span aria-hidden className="font-display text-lg leading-none text-canopy-400">”</span>
          </div>
        </div>

        {/* แถบภาพรวมการเติบโต */}
        <div className="mx-3 mb-3 flex items-center justify-between rounded-2xl bg-cream-100/80 px-4 py-2.5 dark:bg-white/5">
          <div className="flex items-center gap-2">
            <span aria-hidden>📊</span>
            <div className="leading-tight">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">ภาพรวมการเติบโต</p>
              <p className="text-[10px] text-slate-400">เทียบกับเดือนที่ผ่านมา</p>
            </div>
          </div>
          <p className="font-display text-lg font-bold text-canopy-600 dark:text-canopy-300">
            {growth === null || growth === undefined ? '— ยังไม่มีฐานเทียบ' : `${growth >= 0 ? '↗ +' : '↘ '}${growth}%`}
          </p>
        </div>
      </section>
    );
  },
);
export default TreePanel;
