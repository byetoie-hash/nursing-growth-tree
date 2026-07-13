/**
 * Realtime broadcast — ส่ง event ให้ทุกเครื่องเห็นต้นไม้อัปเดตพร้อมกัน
 * ใช้ Supabase Broadcast channel (ไม่ต้องเปิด replication บนตาราง)
 */
import { supabaseAdmin, TREE_CHANNEL } from '@/lib/supabase';

export type TreeEvent =
  | { type: 'LEAF_ADDED'; leaf: unknown }
  | { type: 'LEAF_STATUS'; id: string; status: string }
  | { type: 'REWARD_ADDED'; reward: unknown };

export async function broadcastTree(event: TreeEvent) {
  const client = supabaseAdmin();
  const channel = client.channel(TREE_CHANNEL);
  await channel.send({ type: 'broadcast', event: 'tree', payload: event });
  await client.removeChannel(channel);
}
