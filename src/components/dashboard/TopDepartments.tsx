'use client';
/** แถบล่าง — หน่วยงานที่ได้รับคำชื่นชมสูงสุดประจำเดือน (Top 3) + คำคมปิดท้าย */
const MEDALS = ['🥇', '🥈', '🥉'];

export default function TopDepartments({
  items,
}: {
  items: { name: string; praises: number }[];
}) {
  return (
    <section className="card flex flex-col items-stretch gap-3 p-4 lg:flex-row lg:items-center">
      <div className="flex shrink-0 items-center gap-2">
        <span aria-hidden className="text-xl">🏆</span>
        <div className="leading-tight">
          <p className="font-display text-sm font-semibold text-canopy-800 dark:text-canopy-100">หน่วยงานที่ได้รับคำชื่นชมสูงสุด</p>
          <p className="text-[11px] text-slate-400">ประจำเดือนนี้</p>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
        {items.length === 0 && (
          <p className="col-span-full py-2 text-center text-xs text-slate-400">
            เดือนนี้ยังไม่มีคำชื่นชมที่ระบุหน่วยงาน — มาเป็นกำลังใจให้ทีมกันเถอะ 💚
          </p>
        )}
        {items.map((d, i) => (
          <div key={d.name}
            className="flex items-center gap-2 rounded-2xl bg-cream-100/80 px-3 py-2 dark:bg-white/5">
            <span aria-hidden className="text-lg">{MEDALS[i] ?? '🏅'}</span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">{d.name}</p>
              <p className="text-[11px] text-canopy-600 dark:text-canopy-300">{d.praises} ใบ 🍃</p>
            </div>
          </div>
        ))}
      </div>

      <p className="shrink-0 rounded-2xl bg-canopy-50 px-4 py-2 text-center text-[11px] italic leading-relaxed text-canopy-700 dark:bg-canopy-500/10 dark:text-canopy-200 lg:max-w-[220px]">
        “เพราะคุณ คือ คนสำคัญที่ทำให้เราเติบโตไปด้วยกัน” 🌸
      </p>
    </section>
  );
}
