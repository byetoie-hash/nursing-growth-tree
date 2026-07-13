import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/** รวม class แบบง่าย */
export const cn = (...cls: (string | false | null | undefined)[]) =>
  cls.filter(Boolean).join(' ');

/** ตรวจว่าเป็น Admin หรือไม่ — ใช้ใน API route ทุกเส้นที่เป็นข้อมูลลับ */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return { session: null, error: NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 }) };
  }
  return { session, error: null };
}

/** สุ่มตำแหน่งใบไม้บนต้น (กิ่ง 0..7, ตำแหน่งบนกิ่ง 0.25..0.95) */
export function randomLeafSpot() {
  return {
    branchIndex: Math.floor(Math.random() * 8),
    branchT: 0.25 + Math.random() * 0.7,
  };
}

export const formatThaiDate = (d: string | Date) =>
  new Date(d).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });

/**
 * Captcha โจทย์เลขอย่างง่าย ตรวจฝั่ง server แบบ stateless:
 * token = base64("a+b=answer:expiry") + HMAC ด้วย NEXTAUTH_SECRET
 */
import crypto from 'crypto';

const capKey = () => process.env.NEXTAUTH_SECRET ?? 'dev-secret';

export function createCaptcha() {
  const a = 1 + Math.floor(Math.random() * 9);
  const b = 1 + Math.floor(Math.random() * 9);
  const exp = Date.now() + 10 * 60 * 1000;
  // token เก็บเฉพาะ HMAC ของคำตอบ ไม่เปิดเผยคำตอบใน token
  const sig = crypto.createHmac('sha256', capKey()).update(`${a + b}:${exp}`).digest('hex');
  return { question: `${a} + ${b} = ?`, token: Buffer.from(`${exp}:${sig}`).toString('base64') };
}

export function verifyCaptcha(token: string, answer: string): boolean {
  try {
    const [exp, sig] = Buffer.from(token, 'base64').toString('utf8').split(':');
    const expected = crypto
      .createHmac('sha256', capKey())
      .update(`${answer.trim()}:${exp}`)
      .digest('hex');
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)) && Number(exp) > Date.now();
  } catch {
    return false;
  }
}
