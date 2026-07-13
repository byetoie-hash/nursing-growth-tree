/** GET /api/admin/stats — สถิติ Dashboard (Admin เท่านั้น) */
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/utils';
import { getDashboardStats } from '@/services/stats.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  return NextResponse.json(await getDashboardStats());
}
