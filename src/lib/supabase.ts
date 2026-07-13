/** Supabase clients — browser (realtime) และ server (storage/service role) */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** ใช้ฝั่ง browser: subscribe realtime channel เท่านั้น */
export const supabaseBrowser = () =>
  createClient(url, anonKey, { auth: { persistSession: false } });

/** ใช้ฝั่ง server เท่านั้น: อัปโหลดไฟล์ / broadcast event */
export const supabaseAdmin = () =>
  createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });

/** ชื่อ channel กลางสำหรับ realtime ของต้นไม้ */
export const TREE_CHANNEL = 'ethics-tree';
