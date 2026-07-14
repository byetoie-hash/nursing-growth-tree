'use client';
/**
 * useTree — จัดการ TreeEngine + โหลด snapshot + subscribe realtime
 * ทุกเครื่องเห็นต้นไม้เดียวกัน: เมื่อมีใบใหม่/สถานะเปลี่ยน/reward ใหม่
 * Supabase Broadcast จะสั่งให้ engine อัปเดตพร้อมกันทุก client
 */
import { useEffect, useRef, useCallback } from 'react';
import { TreeEngine } from '@/components/tree/engine';
import { supabaseBrowser, TREE_CHANNEL } from '@/lib/supabase';
import type { PublicLeaf, RewardKind, TreeSnapshot } from '@/types';

/** departmentId: ระบุ = ต้นของหน่วยงานนั้น (รับเฉพาะใบของหน่วยงาน, ไม่มี rewards)
 *  ไม่ระบุ = ต้นหลักของกองการพยาบาล รวมทุกใบ */
export function useTree(onPraiseClick: (id: string) => void, theme: 'light' | 'dark', onEvent?: () => void, departmentId?: string) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<TreeEngine | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new TreeEngine(canvas);
    engineRef.current = engine;
    engine.onLeafClick = (leaf) => {
      // ข้อร้องเรียน: ผู้ใช้ทั่วไปเห็นเพียงใบไม้ เปิดอ่านไม่ได้ / คำชม: เปิดได้
      if (leaf.kind === 'PRAISE') onPraiseClick(leaf.id);
    };
    engine.start();

    // โหลดสภาพต้นไม้ปัจจุบันจากฐานข้อมูล
    fetch(departmentId ? `/api/tree?departmentId=${departmentId}` : '/api/tree')
      .then((r) => r.json())
      .then((snap: TreeSnapshot) => engine.setSnapshot(snap.leaves, snap.rewards))
      .catch(() => {});

    // Realtime — Supabase Broadcast
    const supabase = supabaseBrowser();
    const channel = supabase
      .channel(TREE_CHANNEL)
      .on('broadcast', { event: 'tree' }, ({ payload }) => {
        onEvent?.(); // ให้หน้า dashboard refresh สถิติ/feed
        if (payload.type === 'LEAF_ADDED') {
          const leaf = payload.leaf as PublicLeaf;
          // ต้นหน่วยงานรับเฉพาะใบของตัวเอง / ต้นหลักรับทุกใบ
          if (!departmentId || leaf.departmentId === departmentId) engine.addLeaf(leaf);
        }
        if (payload.type === 'LEAF_STATUS') engine.setLeafStatus(payload.id, payload.status); // ไม่มีใบนั้น = no-op
        if (payload.type === 'REWARD_ADDED' && !departmentId) {
          const r = payload.reward as { kind: RewardKind; anchor: number };
          engine.addReward(r.kind, r.anchor);
        }
        if (payload.type === 'RESET') {
          // ปิดรอบข้อมูล — ล้างต้นแล้วโหลดสภาพล่าสุดใหม่ทุกเครื่อง
          engine.clear();
          fetch(departmentId ? `/api/tree?departmentId=${departmentId}` : '/api/tree')
            .then((r) => r.json())
            .then((snap) => engine.setSnapshot(snap.leaves, snap.rewards))
            .catch(() => {});
        }
      })
      .subscribe();

    const onResize = () => engine.resize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      supabase.removeChannel(channel);
      engine.destroy();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { engineRef.current?.setTheme(theme); }, [theme]);

  /** เพิ่มใบทันทีจากฟอร์มฝั่งเรา (realtime จะซ้ำก็ไม่เป็นไร — engine กันซ้ำด้วย id) */
  const addLocalLeaf = useCallback((leaf: PublicLeaf) => {
    engineRef.current?.addLeaf(leaf);
  }, []);

  return { canvasRef, addLocalLeaf };
}
