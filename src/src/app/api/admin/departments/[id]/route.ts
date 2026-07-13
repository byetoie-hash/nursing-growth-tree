/** PATCH /api/admin/departments/[id] — แก้ชื่อ / เปิด-ปิดการใช้งานหน่วยงาน (Admin) */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/utils';
import { logAudit } from '@/services/audit.service';

export const dynamic = 'force-dynamic';

const schema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง' }, { status: 400 });
  try {
    const dept = await prisma.department.update({ where: { id: params.id }, data: parsed.data });
    await logAudit({ action: 'DEPARTMENT_UPDATED', entity: 'Department', entityId: dept.id, detail: JSON.stringify(parsed.data) });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'ไม่พบหน่วยงาน หรือชื่อซ้ำ' }, { status: 400 });
  }
}
