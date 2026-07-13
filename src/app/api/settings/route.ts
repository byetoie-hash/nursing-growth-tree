/** GET /api/settings — ค่าตั้งระบบสาธารณะ (ชื่อองค์กร ฯลฯ) แก้ได้จากหน้าแอดมิน */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const rows = await prisma.setting.findMany();
  const map = Object.fromEntries(rows.map((r: { key: string; value: string }) => [r.key, r.value]));
  return NextResponse.json({
    orgName: map.orgName ?? process.env.NEXT_PUBLIC_HOSPITAL_NAME ?? 'กองการพยาบาล',
    orgSub: map.orgSub ?? 'Nursing Division',
  });
}
