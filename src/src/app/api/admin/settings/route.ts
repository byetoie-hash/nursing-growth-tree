/** PUT /api/admin/settings — บันทึกค่าตั้งระบบ (Admin) เช่น { orgName, orgSub } */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const schema = z.object({
  orgName: z.string().trim().min(1).max(120).optional(),
  orgSub: z.string().trim().max(120).optional(),
});

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง' }, { status: 400 });
  const entries = Object.entries(parsed.data).filter(([, v]) => v !== undefined) as [string, string][];
  for (const [key, value] of entries) {
    await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }
  return NextResponse.json({ ok: true });
}
