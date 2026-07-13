/** GET /api/departments — รายชื่อหน่วยงานที่เปิดใช้งาน (public) */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const departments = await prisma.department.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json({ departments });
}
