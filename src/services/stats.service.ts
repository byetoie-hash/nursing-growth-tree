/** Stats Service — สถิติสำหรับ Dashboard */
import { prisma } from '@/lib/prisma';
import type { ComplaintStatus, DashboardStats, PraiseCategory, RewardKind, TreeSnapshot } from '@/types';

/** แถวข้อมูลย่อยที่ใช้ภายใน (ประกาศ type ชัดเจนเพื่อความปลอดภัยของโค้ด) */
type LeafRow = { id: string; branchIndex: number; branchT: number; createdAt: Date };
type Ranked = { name: string; complaints: number; praises: number };

/** Snapshot สาธารณะของต้นไม้ (ใบ + ราก/ดอก/ผล) — ไม่มีข้อมูลลับ
 *  departmentId: ระบุ = ต้นของหน่วยงานนั้น (เฉพาะใบ) / ไม่ระบุ = ต้นหลักรวมทุกใบ + rewards */
export async function getTreeSnapshot(departmentId?: string): Promise<TreeSnapshot> {
  const deptWhere = departmentId ? { departmentId } : {};
  const [complaints, praises, rewards] = await Promise.all([
    prisma.complaint.findMany({
      where: deptWhere,
      select: { id: true, kind: true, status: true, branchIndex: true, branchT: true, createdAt: true, departmentId: true },
      orderBy: { createdAt: 'asc' },
      take: 500,
    }),
    prisma.praise.findMany({
      where: deptWhere,
      select: { id: true, category: true, branchIndex: true, branchT: true, createdAt: true, departmentId: true },
      orderBy: { createdAt: 'asc' },
      take: 500,
    }),
    // rewards (ราก/ดอก/ผล) แสดงเฉพาะต้นหลักของกองการพยาบาล
    departmentId ? Promise.resolve([]) : prisma.treeReward.findMany({ select: { id: true, kind: true, anchor: true } }),
  ]);
  return {
    leaves: [
      ...complaints.map((c: LeafRow & { status: ComplaintStatus; kind: 'COMPLAINT' | 'SUGGESTION'; departmentId: string | null }) => ({
        id: c.id, kind: c.kind, status: c.status, departmentId: c.departmentId,
        branchIndex: c.branchIndex, branchT: c.branchT, createdAt: c.createdAt.toISOString(),
      })),
      ...praises.map((p: LeafRow & { category: PraiseCategory; departmentId: string | null }) => ({
        id: p.id, kind: 'PRAISE' as const, category: p.category, departmentId: p.departmentId,
        branchIndex: p.branchIndex, branchT: p.branchT, createdAt: p.createdAt.toISOString(),
      })),
    ],
    rewards: rewards.map((r: { id: string; kind: RewardKind; anchor: number }) => ({
      id: r.id, kind: r.kind, anchor: r.anchor,
    })),
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [byStatus, byCategory, rewards, resolved, departments] = await Promise.all([
    prisma.complaint.groupBy({ by: ['status'], _count: true }),
    prisma.praise.groupBy({ by: ['category'], _count: true }),
    prisma.treeReward.groupBy({ by: ['kind'], _count: true }),
    prisma.complaint.findMany({
      where: { resolvedAt: { not: null } },
      select: { createdAt: true, resolvedAt: true },
    }),
    prisma.department.findMany({
      include: { _count: { select: { complaints: true, praises: true } } },
    }),
  ]);

  const statusCount = { NEW: 0, IN_PROGRESS: 0, RESOLVED: 0 };
  byStatus.forEach((s: { status: ComplaintStatus; _count: number }) => { statusCount[s.status] = s._count; });
  const total = statusCount.NEW + statusCount.IN_PROGRESS + statusCount.RESOLVED;

  const catCount = { SERVICE_BEHAVIOR: 0, GENERAL_SERVICE: 0 };
  byCategory.forEach((c: { category: PraiseCategory; _count: number }) => { catCount[c.category] = c._count; });

  const rewardCount = { ROOT: 0, FLOWER: 0, FRUIT: 0 };
  rewards.forEach((r: { kind: RewardKind; _count: number }) => { rewardCount[r.kind] = r._count; });

  // เวลาตอบสนองเฉลี่ย (ชั่วโมง) = created → resolved
  const avgResponseHours = resolved.length
    ? resolved.reduce(
        (s: number, c: { createdAt: Date; resolvedAt: Date | null }) =>
          s + (c.resolvedAt!.getTime() - c.createdAt.getTime()),
        0,
      ) / resolved.length / 3_600_000
    : null;

  // ยอดรายเดือน 6 เดือนล่าสุด
  const since = new Date(); since.setMonth(since.getMonth() - 5); since.setDate(1);
  const [cMonthly, pMonthly] = await Promise.all([
    prisma.complaint.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.praise.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
  ]);
  const monthKey = (d: Date) => d.toLocaleDateString('th-TH', { month: 'short', year: '2-digit' });
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    months.push(monthKey(d));
  }
  const monthly = months.map((m) => ({
    month: m,
    complaints: cMonthly.filter((c: { createdAt: Date }) => monthKey(c.createdAt) === m).length,
    praises: pMonthly.filter((p: { createdAt: Date }) => monthKey(p.createdAt) === m).length,
  }));

  return {
    complaints: { total, ...statusCount },
    praises: { total: catCount.SERVICE_BEHAVIOR + catCount.GENERAL_SERVICE, ...catCount },
    rewards: rewardCount,
    resolvedPercent: total ? Math.round((statusCount.RESOLVED / total) * 100) : 0,
    avgResponseHours: avgResponseHours ? Math.round(avgResponseHours * 10) / 10 : null,
    departmentRanking: departments
      .map((d: { name: string; _count: { complaints: number; praises: number } }): Ranked => ({
        name: d.name, complaints: d._count.complaints, praises: d._count.praises,
      }))
      .sort((a: Ranked, b: Ranked) => b.complaints + b.praises - (a.complaints + a.praises))
      .slice(0, 10),
    monthly,
  };
}


/** ---------- Dashboard สาธารณะของ The Nursing Growth Tree ---------- */
import type { FeedItem, PublicDashboard } from '@/types';

export async function getPublicDashboard(departmentId?: string): Promise<PublicDashboard> {
  const dept = departmentId ? { departmentId } : {};
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const prevStart = new Date(monthStart); prevStart.setMonth(prevStart.getMonth() - 1);

  const [praiseByCat, careByStatus, rewards, suggestionTotal,
    thisMonthC, thisMonthP, prevMonthC, prevMonthP,
    topPraises, recentPraises, recentFeedback] = await Promise.all([
    prisma.praise.groupBy({ by: ['category'], _count: true, where: dept }),
    prisma.complaint.groupBy({ by: ['status'], _count: true, where: { kind: 'COMPLAINT', ...dept } }),
    prisma.treeReward.groupBy({ by: ['kind'], _count: true }),
    prisma.complaint.count({ where: { kind: 'SUGGESTION', ...dept } }),
    prisma.complaint.count({ where: { createdAt: { gte: monthStart }, ...dept } }),
    prisma.praise.count({ where: { createdAt: { gte: monthStart }, ...dept } }),
    prisma.complaint.count({ where: { createdAt: { gte: prevStart, lt: monthStart }, ...dept } }),
    prisma.praise.count({ where: { createdAt: { gte: prevStart, lt: monthStart }, ...dept } }),
    departmentId ? Promise.resolve([]) : prisma.praise.groupBy({
      by: ['departmentId'], _count: true,
      where: { createdAt: { gte: monthStart }, departmentId: { not: null } },
      orderBy: { _count: { departmentId: 'desc' } }, take: 3,
    }),
    prisma.praise.findMany({
      where: dept, include: { department: true }, orderBy: { createdAt: 'desc' }, take: 6,
    }),
    prisma.complaint.findMany({
      where: dept,
      select: {
        id: true, kind: true, category: true, status: true, isAnonymous: true,
        senderName: true, createdAt: true, department: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' }, take: 6,
    }),
  ]);

  const praise = { total: 0, SERVICE_BEHAVIOR: 0, GENERAL_SERVICE: 0 };
  praiseByCat.forEach((c: { category: PraiseCategory; _count: number }) => {
    praise[c.category] = c._count; praise.total += c._count;
  });

  const care = { NEW: 0, IN_PROGRESS: 0, RESOLVED: 0, total: 0 };
  careByStatus.forEach((s: { status: ComplaintStatus; _count: number }) => {
    care[s.status] = s._count; care.total += s._count;
  });

  const rewardCount = { FLOWER: 0, FRUIT: 0, ROOT: 0 };
  rewards.forEach((r: { kind: RewardKind; _count: number }) => { rewardCount[r.kind] = r._count; });

  const thisMonth = thisMonthC + thisMonthP;
  const prevMonth = prevMonthC + prevMonthP;
  const growthPercent = prevMonth > 0 ? Math.round(((thisMonth - prevMonth) / prevMonth) * 100) : null;

  // ชื่อหน่วยงาน Top 3
  const deptIds = topPraises.map((t: { departmentId: string | null }) => t.departmentId!).filter(Boolean);
  const depts = deptIds.length
    ? await prisma.department.findMany({ where: { id: { in: deptIds } } })
    : [];
  const topDepartments = topPraises.map((t: { departmentId: string | null; _count: number }) => ({
    name: depts.find((d: { id: string; name: string }) => d.id === t.departmentId)?.name ?? '-',
    praises: t._count,
  }));

  // Feed รวม (คำชม = ข้อความจริง / ร้องเรียน+เสนอแนะ = เฉพาะประเภทเรื่อง)
  type PraiseRow = { id: string; message: string; isAnonymous: boolean; senderName: string | null; createdAt: Date; department: { name: string } | null };
  type FbRow = { id: string; kind: 'COMPLAINT' | 'SUGGESTION'; category: string; status: ComplaintStatus; isAnonymous: boolean; senderName: string | null; createdAt: Date; department: { name: string } | null };
  const feed: FeedItem[] = [
    ...recentPraises.map((p: PraiseRow): FeedItem => ({
      id: p.id, type: 'PRAISE', text: p.message,
      departmentName: p.department?.name ?? null,
      senderName: p.isAnonymous ? null : p.senderName,
      createdAt: p.createdAt.toISOString(),
    })),
    ...recentFeedback.map((c: FbRow): FeedItem => ({
      id: c.id, type: c.kind, text: `เรื่อง: ${c.category}`, status: c.status,
      departmentName: c.department?.name ?? null,
      senderName: c.isAnonymous ? null : c.senderName,
      createdAt: c.createdAt.toISOString(),
    })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);

  return { praise, rewards: rewardCount, care, suggestionTotal, growthPercent, topDepartments, feed };
}
