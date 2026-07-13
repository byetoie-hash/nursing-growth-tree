/**
 * POST /api/complaints — สร้างข้อร้องเรียน (public + captcha)
 * GET  /api/complaints — รายการสำหรับ Admin เท่านั้น (ถอดรหัสข้อมูลติดต่อ)
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createComplaint, listComplaintsForAdmin } from '@/services/complaint.service';
import { requireAdmin, verifyCaptcha } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const complaintSchema = z.object({
  kind: z.enum(['COMPLAINT', 'SUGGESTION']).default('COMPLAINT'),
  isAnonymous: z.boolean(),
  senderName: z.string().max(120).optional(),
  phone: z.string().max(20).optional(),
  line: z.string().max(120).optional(),
  email: z.string().email().optional().or(z.literal('')),
  contactChannel: z.enum(['NONE', 'PHONE', 'LINE', 'EMAIL']),
  departmentId: z.string().optional(),
  category: z.string().min(1, 'กรุณาเลือกประเภทเรื่อง').max(120),
  detail: z.string().min(10, 'กรุณาระบุรายละเอียดอย่างน้อย 10 ตัวอักษร').max(5000),
  incidentAt: z.string().optional(),
  attachments: z.array(z.string().url()).max(5).default([]),
  captchaToken: z.string(),
  captchaAnswer: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = complaintSchema.parse(await req.json());
    if (!verifyCaptcha(body.captchaToken, body.captchaAnswer)) {
      return NextResponse.json({ error: 'คำตอบยืนยันไม่ถูกต้อง กรุณาลองใหม่' }, { status: 400 });
    }
    const leaf = await createComplaint({ ...body, email: body.email || undefined });
    return NextResponse.json({ leaf }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message ?? 'ข้อมูลไม่ถูกต้อง' }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: 'บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') as 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | null;
  const q = searchParams.get('q') ?? undefined;
  const complaints = await listComplaintsForAdmin({ status: status ?? undefined, q });
  return NextResponse.json({ complaints });
}
