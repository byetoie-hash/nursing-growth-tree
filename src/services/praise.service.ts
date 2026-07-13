/** Praise Service — คำชม + สร้างดอกไม้/ผลไม้เมื่อครบ 10 ใบ */
import { prisma } from '@/lib/prisma';
import { randomLeafSpot } from '@/lib/utils';
import { logAudit } from '@/services/audit.service';
import { broadcastTree } from '@/services/realtime.service';
import type { PraiseCategory, PraiseInput, PublicLeaf, PublicPraise } from '@/types';

export async function createPraise(input: PraiseInput): Promise<PublicLeaf> {
  const spot = randomLeafSpot();
  const praise = await prisma.praise.create({
    data: {
      isAnonymous: input.isAnonymous,
      senderName: input.isAnonymous ? null : input.senderName?.trim() || null,
      departmentId: input.departmentId || null,
      category: input.category,
      message: input.message,
      staffName: input.staffName?.trim() || null,
      attachments: input.attachments ?? [],
      ...spot,
    },
  });

  const leaf: PublicLeaf = {
    id: praise.id,
    kind: 'PRAISE',
    departmentId: praise.departmentId,
    category: praise.category,
    branchIndex: praise.branchIndex,
    branchT: praise.branchT,
    createdAt: praise.createdAt.toISOString(),
  };
  await broadcastTree({ type: 'LEAF_ADDED', leaf });
  await logAudit({ action: 'PRAISE_CREATED', entity: 'Praise', entityId: praise.id });

  // Reward: พฤติกรรมบริการครบ 10 → ดอกชมพู / บริการทั่วไปครบ 10 → ผลไม้
  const count = await prisma.praise.count({ where: { category: praise.category } });
  const kind = praise.category === 'SERVICE_BEHAVIOR' ? 'FLOWER' : 'FRUIT';
  const rewardCount = await prisma.treeReward.count({ where: { kind } });
  if (Math.floor(count / 10) > rewardCount) {
    const reward = await prisma.treeReward.create({
      data: { kind, anchor: 0.2 + Math.random() * 0.6 },
    });
    await broadcastTree({ type: 'REWARD_ADDED', reward: { id: reward.id, kind, anchor: reward.anchor } });
  }
  return leaf;
}

/** อ่านคำชมสาธารณะ — ทุกคนเปิดอ่านได้ */
export async function getPublicPraise(id: string): Promise<PublicPraise | null> {
  const p = await prisma.praise.findUnique({ where: { id }, include: { department: true } });
  if (!p) return null;
  return {
    id: p.id,
    category: p.category,
    message: p.message,
    senderName: p.isAnonymous ? null : p.senderName,
    staffName: p.staffName,
    departmentName: p.department?.name ?? null,
    createdAt: p.createdAt.toISOString(),
  };
}

export async function listPublicPraises(): Promise<PublicPraise[]> {
  const list = await prisma.praise.findMany({
    include: { department: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return list.map((p: {
    id: string; category: PraiseCategory; message: string; isAnonymous: boolean;
    senderName: string | null; staffName: string | null;
    department: { name: string } | null; createdAt: Date;
  }) => ({
    id: p.id,
    category: p.category,
    message: p.message,
    senderName: p.isAnonymous ? null : p.senderName,
    staffName: p.staffName,
    departmentName: p.department?.name ?? null,
    createdAt: p.createdAt.toISOString(),
  }));
}
