/**
 * POST /api/upload — อัปโหลดรูป/ไฟล์แนบไป Supabase Storage (bucket: attachments)
 * จำกัดชนิดไฟล์และขนาด 5MB — คืน public URL
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'ไม่พบไฟล์' }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: 'รองรับเฉพาะรูปภาพ (JPG/PNG/WebP/GIF) และ PDF' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'ไฟล์ต้องมีขนาดไม่เกิน 5MB' }, { status: 400 });
  }

  const ext = file.name.split('.').pop() ?? 'bin';
  const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabaseAdmin()
    .storage.from('attachments')
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'อัปโหลดไม่สำเร็จ กรุณาลองใหม่' }, { status: 500 });
  }
  const { data } = supabaseAdmin().storage.from('attachments').getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
