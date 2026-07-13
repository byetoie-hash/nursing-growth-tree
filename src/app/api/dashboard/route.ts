/** GET /api/dashboard?departmentId= — สถิติสาธารณะ (ไม่ระบุ = ภาพรวมกองการพยาบาล) */
import { NextRequest, NextResponse } from 'next/server';
import { getPublicDashboard } from '@/services/stats.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const departmentId = req.nextUrl.searchParams.get('departmentId') ?? undefined;
  return NextResponse.json(await getPublicDashboard(departmentId));
}
