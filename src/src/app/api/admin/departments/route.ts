/** จัดการหน่วยงาน (Admin) — GET รายการทั้งหมดพร้อมยอด / POST เพิ่มหน่วยงานใหม่ */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/utils';
import { logAudit } from '@/services/audit.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const rows = await prisma.department.findMany({
    include: { _count: { select: { praises: true, complaints: true } } },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json({
    departments: rows.map((d: { id: string; name: string; active: boolean; _count: { praises: number; complaints: number } }) => ({
      id: d.id, name: d.name, active: d.active,
      praises: d._count.praises, complaints: d._count.complaints,
    })),
  });
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const parsed = z.object({ name: z.string().trim().min(1).max(120) }).safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'กรุณาระบุชื่อหน่วยงาน' }, { status: 400 });
  const exists = await prisma.department.findUnique({ where: { name: parsed.data.name } });
  if (exists) return NextResponse.json({ error: 'มีหน่วยงานชื่อนี้อยู่แล้ว' }, { status: 409 });
  const dept = await prisma.department.create({ data: { name: parsed.data.name } });
  await logAudit({ action: 'DEPARTMENT_CREATED', entity: 'Department', entityId: dept.id, detail: dept.name });
  return NextResponse.json({ department: { id: dept.id, name: dept.name, active: dept.active, praises: 0, complaints: 0 } });
}
