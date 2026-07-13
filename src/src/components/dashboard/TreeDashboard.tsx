'use client';
/**
 * TreeDashboard — หน้า Living Culture Dashboard (ใช้ร่วมกัน 2 โหมด)
 *  - โหมดต้นหลัก (ไม่ส่ง departmentId): รวมใบของทุกหน่วยงาน + rewards + Top หน่วยงาน
 *  - โหมดต้นหน่วยงาน (ส่ง departmentId + departmentName): เฉพาะใบของหน่วยงานนั้น
 *    ฟอร์มล็อกหน่วยงานอัตโนมัติ ผู้ใช้สแกน QR แล้วส่งได้เลยไม่ต้องเลือก
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from '@/app/providers';
import { useTree } from '@/hooks/useTree';
import { useSound } from '@/hooks/useSound';
import Header from '@/components/Header';
import Modal from '@/components/ui/Modal';
import QRShare from '@/components/ui/QRShare';
import ComplaintForm from '@/components/modals/ComplaintForm';
import PraiseForm from '@/components/modals/PraiseForm';
import PraiseReadModal from '@/components/modals/PraiseReadModal';
import ActionPanel from '@/components/dashboard/ActionPanel';
import TreePanel from '@/components/dashboard/TreePanel';
import RecentFeed from '@/components/dashboard/RecentFeed';
import TopDepartments from '@/components/dashboard/TopDepartments';
import type { PublicDashboard, PublicLeaf } from '@/types';

export default function TreeDashboard({
  departmentId, departmentName,
}: {
  departmentId?: string;
  departmentName?: string;
}) {
  const { theme } = useTheme();
  const isUnit = !!departmentId;

  // Modals
  const [praiseOpen, setPraiseOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [readPraiseId, setReadPraiseId] = useState<string | null>(null);

  // ชื่อองค์กร (แอดมินแก้ได้จากหน้าเว็บ)
  const [org, setOrg] = useState<{ orgName?: string; orgSub?: string }>({});
  useEffect(() => {
    fetch('/api/settings').then((r) => (r.ok ? r.json() : {})).then(setOrg).catch(() => {});
  }, []);

  // สถิติ + feed
  const [dash, setDash] = useState<PublicDashboard | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadDash = useCallback(() => {
    const url = departmentId ? `/api/dashboard?departmentId=${departmentId}` : '/api/dashboard';
    fetch(url).then((r) => r.json()).then(setDash).catch(() => {});
  }, [departmentId]);
  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(loadDash, 600);
  }, [loadDash]);

  useEffect(() => {
    loadDash();
    const t = setInterval(loadDash, 60_000);
    return () => { clearInterval(t); if (refreshTimer.current) clearTimeout(refreshTimer.current); };
  }, [loadDash]);

  // ต้นไม้ + realtime (กรองใบตามหน่วยงานอัตโนมัติใน useTree)
  const { canvasRef, addLocalLeaf } = useTree((id) => setReadPraiseId(id), theme, scheduleRefresh, departmentId);
  const { enabled: soundOn, toggle: toggleSound } = useSound();

  const onSubmitted = (leaf: PublicLeaf) => { addLocalLeaf(leaf); scheduleRefresh(); };

  return (
    <main className="min-h-dvh w-full p-3 sm:p-4">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-3">
        <Header onShare={() => setShareOpen(true)} soundOn={soundOn} onToggleSound={toggleSound}
          orgName={org.orgName} orgSub={org.orgSub} unitName={departmentName} />

        {/* ป้ายบอกว่าเป็นต้นของหน่วยงานไหน + ลิงก์กลับต้นหลัก */}
        {isUnit && (
          <div className="flex flex-wrap items-center justify-center gap-2 text-center">
            <span className="chip bg-canopy-600 text-white">🌿 ต้นไม้ของ {departmentName}</span>
            <a href="/" className="chip bg-white/70 text-canopy-700 underline-offset-2 hover:underline dark:bg-white/10 dark:text-canopy-200">
              ← ดูต้นหลักของทั้งองค์กร
            </a>
          </div>
        )}

        {/* ชื่อระบบบนมือถือ */}
        <div className="text-center md:hidden">
          <h1 className="font-display text-2xl font-bold text-canopy-700 dark:text-canopy-100">
            The Nursing Growth Tree 🌿
          </h1>
          <p className="text-[11px] text-slate-500">A Living Culture Dashboard for Nursing Excellence</p>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[260px_minmax(0,1fr)_280px]">
          <ActionPanel
            onPraise={() => setPraiseOpen(true)}
            onSuggest={() => setSuggestOpen(true)}
            onComplaint={() => setComplaintOpen(true)}
          />
          <TreePanel ref={canvasRef} data={dash} unitName={departmentName} />
          <RecentFeed items={dash?.feed ?? []} />
        </div>

        {/* Top หน่วยงาน — เฉพาะต้นหลัก */}
        {!isUnit && <TopDepartments items={dash?.topDepartments ?? []} />}

        <footer className="pb-2 text-center text-[11px] text-slate-400">
          The Nursing Growth Tree · Growing Together, Caring Together
        </footer>
      </div>

      {/* ─── Modals ─── */}
      <PraiseForm open={praiseOpen} onClose={() => setPraiseOpen(false)} onSubmitted={onSubmitted}
        fixedDepartmentId={departmentId} />
      <ComplaintForm kind="SUGGESTION" open={suggestOpen} onClose={() => setSuggestOpen(false)} onSubmitted={onSubmitted}
        fixedDepartmentId={departmentId} />
      <ComplaintForm kind="COMPLAINT" open={complaintOpen} onClose={() => setComplaintOpen(false)} onSubmitted={onSubmitted}
        fixedDepartmentId={departmentId} />
      <PraiseReadModal praiseId={readPraiseId} onClose={() => setReadPraiseId(null)} />
      <Modal open={shareOpen} onClose={() => setShareOpen(false)} title="แชร์ The Nursing Growth Tree">
        <QRShare />
      </Modal>
    </main>
  );
}
