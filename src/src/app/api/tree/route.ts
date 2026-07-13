/** GET /api/tree?departmentId= — Snapshot ต้นไม้ (ไม่ระบุ = ต้นหลักรวมทุกหน่วยงาน) */
import { NextRequest, NextResponse } from 'next/server';
import { getTreeSnapshot } from '@/services/stats.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const departmentId = req.nextUrl.searchParams.get('departmentId') ?? undefined;
  return NextResponse.json(await getTreeSnapshot(departmentId));
}
