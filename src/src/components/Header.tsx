'use client';
/**
 * Header แถบบนแบบ Dashboard — โลโก้กองการพยาบาล + ชื่อระบบกลาง + ปุ่มตั้งค่า
 * ตามภาพต้นแบบ The Nursing Growth Tree
 */
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useTheme } from '@/app/providers';

const HOSPITAL_FALLBACK = process.env.NEXT_PUBLIC_HOSPITAL_NAME ?? 'กองการพยาบาล';

export default function Header({
  onShare, soundOn, onToggleSound, orgName, orgSub, unitName,
}: {
  onShare: () => void;
  soundOn: boolean;
  onToggleSound: () => void;
  orgName?: string;
  orgSub?: string;
  /** ชื่อหน่วยงานเมื่ออยู่หน้าต้นไม้เฉพาะหน่วย */
  unitName?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const { theme, toggle } = useTheme();

  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('[data-hero]',
        { y: -16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, stagger: 0.1, ease: 'power3.out', delay: 0.1 });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <header ref={ref} className="card mx-auto flex w-full max-w-[1400px] items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
      {/* โลโก้ + หน่วยงาน */}
      <div data-hero className="flex min-w-0 items-center gap-2.5">
        <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden className="shrink-0">
          <circle cx="18" cy="18" r="17" fill="#fdeef4" stroke="#ec9cba" strokeWidth="1.5" />
          <path d="M18 26v-9" stroke="#dd6f9b" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M18 15c-3.4 0-5.4-2.2-5.4-5 2.2-.4 5 .4 5.4 3 .4-2.6 3.2-3.4 5.4-3 0 2.8-2 5-5.4 5Z" fill="#3a924e" />
          <path d="M15.4 22.5h5.2M18 20v5" stroke="#dd6f9b" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <div className="min-w-0 leading-tight">
          <p className="truncate font-display text-sm font-semibold text-canopy-800 dark:text-canopy-100">{orgName ?? HOSPITAL_FALLBACK}</p>
          <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{unitName ?? orgSub ?? 'Nursing Division'}</p>
        </div>
      </div>

      {/* ชื่อระบบ (กลาง) */}
      <div data-hero className="hidden flex-col items-center text-center md:flex">
        <h1 className="font-display text-2xl font-bold tracking-tight text-canopy-700 dark:text-canopy-100 lg:text-3xl">
          The Nursing Growth Tree <span aria-hidden>🌿</span>
        </h1>
        <span className="mt-0.5 rounded-full bg-canopy-600 px-3 py-0.5 text-[11px] font-medium text-white">
          A Living Culture Dashboard for Nursing Excellence
        </span>
      </div>

      {/* ปุ่มตั้งค่า */}
      <div data-hero className="flex shrink-0 gap-1.5">
        <button onClick={onToggleSound} aria-label={soundOn ? 'ปิดเสียงธรรมชาติ' : 'เปิดเสียงธรรมชาติ'}
          className="rounded-full bg-cream-100 p-2 text-base leading-none transition hover:scale-105 dark:bg-white/10">
          {soundOn ? '🔊' : '🔇'}
        </button>
        <button onClick={toggle} aria-label={theme === 'dark' ? 'โหมดสว่าง' : 'โหมดมืด'}
          className="rounded-full bg-cream-100 p-2 text-base leading-none transition hover:scale-105 dark:bg-white/10">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button onClick={onShare} aria-label="แชร์ / QR Code"
          className="rounded-full bg-cream-100 p-2 text-base leading-none transition hover:scale-105 dark:bg-white/10">⛶</button>
      </div>
    </header>
  );
}
