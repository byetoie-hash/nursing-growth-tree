/**
 * AES-256-GCM encryption สำหรับข้อมูลติดต่อกลับ (เบอร์โทร / LINE / Email)
 * รูปแบบที่เก็บ: base64(iv):base64(authTag):base64(ciphertext)
 * ถอดรหัสได้เฉพาะฝั่ง server ที่มี ENCRYPTION_KEY เท่านั้น
 */
import crypto from 'crypto';

const ALGO = 'aes-256-gcm';

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error('ENCRYPTION_KEY ต้องเป็น hex 64 ตัวอักษร (openssl rand -hex 32)');
  }
  return Buffer.from(hex, 'hex');
}

export function encrypt(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), enc].map((b) => b.toString('base64')).join(':');
}

export function decrypt(payload: string): string {
  const [iv, tag, data] = payload.split(':').map((p) => Buffer.from(p, 'base64'));
  const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}
