/**
 * POST /api/admin/purge — ปิดรอบข้อมูล (Admin เท่านั้น)
 * body: { before?: 'YYYY-MM-DD', resetRewards: boolean, confirm: 'ปิดรอบข้อมูล' }
 * - before ระบุ  = ลบคำชม/ข้อร้องเรียน/ข้อเสนอแนะที่สร้าง "ก่อน" วันนั้น
 * - before ว่าง  = ลบทั้งหมด
 * - ลบไฟล์แนบใน Storage ของรายการที่ถูกลบด้วย
 * - resetRewards = ล้างดอกปีบ/ผลไม้/ราก สะสม
 * - บันทึก Audit Log + broadcast ให้ทุกเครื่องโหลดต้นไม้ใหม่
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/utils';
import { supabaseAdmin } from '@/lib/supabase';
import { logAudit } from '@/services/audit.service';
import { broadcastTree } from '@/services/realtime.service';

export const dynamic = 'force-dynamic';

const schema = z.object({
  before: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  resetRewards: z.boolean(),
  confirm: z.literal('ปิดรอบข้อมูล'),
});

/** แปลง public URL ของ Storage เป็น path ภายใน bucket */
const toStoragePath = (url: string) => {
  const m = url.split('/attachments/');
  return m.length > 1 ? decodeURIComponent(m[1]) : null;
};

export async function POST(req: NextRequest) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'ข้อมูลยืนยันไม่ถูกต้อง' }, { status: 400 });
  }
  const { before, resetRewards } = parsed.data;
  const where = before ? { createdAt: { lt: new Date(`${before}T00:00:00`) } } : {};

  // 1) รวบรวมไฟล์แนบของรายการที่จะลบ (ยิงทีละคำสั่ง — ปลอดภัยกับ pool เล็ก)
  const complaintFiles = await prisma.complaint.findMany({ where, select: { attachments: true } });
  const praiseFiles = await prisma.praise.findMany({ where, select: { attachments: true } });
  const paths = [...complaintFiles, ...praiseFiles]
    .flatMap((r: { attachments: string[] }) => r.attachments)
    .map(toStoragePath)
    .filter((p): p is string => !!p);

  // 2) ลบไฟล์ใน Storage (ล็อตละ 100 — ถ้าลบไฟล์พลาดบางไฟล์ ไม่ถือว่าล้มทั้งงาน)
  let filesDeleted = 0;
  const storage = supabaseAdmin().storage.from('attachments');
  for (let i = 0; i < paths.length; i += 100) {
    const { error: se } = await storage.remove(paths.slice(i, i + 100));
    if (!se) filesDeleted += Math.min(100, paths.length - i);
  }

  // 3) ลบข้อมูลในฐานข้อมูล
  const delComplaints = await prisma.complaint.deleteMany({ where });
  const delPraises = await prisma.praise.deleteMany({ where });
  let rewardsDeleted = 0;
  if (resetRewards) {
    const r = await prisma.treeReward.deleteMany({});
    rewardsDeleted = r.count;
  }

  // 4) Audit + ให้ทุกเครื่องโหลดต้นไม้ใหม่
  await logAudit({
    action: 'DATA_PURGED',
    entity: 'System',
    entityId: session!.user!.email ?? 'admin',
    detail: JSON.stringify({ before: before || 'ALL', complaints: delComplaints.count, praises: delPraises.count, rewards: rewardsDeleted, files: filesDeleted }),
  });
  void broadcastTree({ type: 'RESET' });

  return NextResponse.json({
    ok: true,
    complaints: delComplaints.count,
    praises: delPraises.count,
    rewards: rewardsDeleted,
    files: filesDeleted,
  });
}
