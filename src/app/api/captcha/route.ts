/** GET /api/captcha — ออกโจทย์ยืนยันตัวตนแบบง่าย (stateless HMAC) */
import { NextResponse } from 'next/server';
import { createCaptcha } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(createCaptcha());
}
