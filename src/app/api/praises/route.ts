/**
 * POST /api/praises — ส่งคำชม (public + captcha)
 * GET  /api/praises — รายการคำชมสาธารณะ / GET ?id= อ่านรายตัว
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createPraise, getPublicPraise, listPublicPraises } from '@/services/praise.service';
import { verifyCaptcha } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const praiseSchema = z.object({
  isAnonymous: z.boolean(),
  senderName: z.string().max(120).optional(),
  departmentId: z.string().optional(),
  category: z.enum(['SERVICE_BEHAVIOR', 'GENERAL_SERVICE']),
  message: z.string().min(5, 'กรุณาเขียนคำชมอย่างน้อย 5 ตัวอักษร').max(2000),
  staffName: z.string().max(120).optional(),
  attachments: z.array(z.string().url()).max(3).default([]),
  captchaToken: z.string(),
  captchaAnswer: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = praiseSchema.parse(await req.json());
    if (!verifyCaptcha(body.captchaToken, body.captchaAnswer)) {
      return NextResponse.json({ error: 'คำตอบยืนยันไม่ถูกต้อง กรุณาลองใหม่' }, { status: 400 });
    }
    const leaf = await createPraise(body);
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
  const id = new URL(req.url).searchParams.get('id');
  if (id) {
    const praise = await getPublicPraise(id);
    return praise
      ? NextResponse.json({ praise })
      : NextResponse.json({ error: 'ไม่พบคำชมนี้' }, { status: 404 });
  }
  return NextResponse.json({ praises: await listPublicPraises() });
}
