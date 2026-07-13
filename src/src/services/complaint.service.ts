/** Complaint Service — สร้าง/อ่าน/เปลี่ยนสถานะข้อร้องเรียน + สร้างรากเมื่อครบ 10 */
import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/crypto';
import { randomLeafSpot } from '@/lib/utils';
import { logAudit } from '@/services/audit.service';
import { broadcastTree } from '@/services/realtime.service';
import { notifyLine, notifyEmail } from '@/services/notify.service';
import type { AdminComplaint, ComplaintInput, ComplaintStatus, ContactChannel, PublicLeaf } from '@/types';

/** สร้างข้อร้องเรียนใหม่ — เข้ารหัสข้อมูลติดต่อกลับก่อนบันทึกเสมอ */
export async function createComplaint(input: ComplaintInput): Promise<PublicLeaf> {
  const spot = randomLeafSpot();
  const complaint = await prisma.complaint.create({
    data: {
      kind: input.kind,
      isAnonymous: input.isAnonymous,
      senderName: input.isAnonymous ? null : input.senderName?.trim() || null,
      phoneEnc: input.phone ? encrypt(input.phone) : null,
      lineEnc: input.line ? encrypt(input.line) : null,
      emailEnc: input.email ? encrypt(input.email) : null,
      contactChannel: input.contactChannel,
      departmentId: input.departmentId || null,
      category: input.category,
      detail: input.detail,
      incidentAt: input.incidentAt ? new Date(input.incidentAt) : null,
      attachments: input.attachments ?? [],
      ...spot,
    },
  });

  const leaf: PublicLeaf = {
    id: complaint.id,
    kind: complaint.kind as 'COMPLAINT' | 'SUGGESTION',
    departmentId: complaint.departmentId,
    status: complaint.status,
    branchIndex: complaint.branchIndex,
    branchT: complaint.branchT,
    createdAt: complaint.createdAt.toISOString(),
  };

  // แจ้งทุกเครื่อง + แจ้ง Admin (ไม่ block การตอบกลับ)
  await broadcastTree({ type: 'LEAF_ADDED', leaf });
  const kindLabel = complaint.kind === 'SUGGESTION' ? 'ข้อเสนอแนะ' : 'ข้อร้องเรียน';
  void notifyLine(`🌱 มี${kindLabel}ใหม่ (${complaint.category}) — เปิด Dashboard เพื่อรับเรื่อง`);
  void notifyEmail(`มี${kindLabel}ใหม่ — The Nursing Growth Tree`,
    `<p>ประเภท: ${complaint.category}</p><p>กรุณาเข้าสู่ระบบเพื่ออ่านรายละเอียด</p>`);
  await logAudit({ action: 'COMPLAINT_CREATED', entity: 'Complaint', entityId: complaint.id });
  return leaf;
}

/** เปลี่ยนสถานะ (Admin) — คืน reward ใหม่ถ้าเขียวครบทุก 10 ใบ */
export async function updateComplaintStatus(id: string, status: ComplaintStatus, adminId: string, adminNote?: string) {
  const now = new Date();
  const complaint = await prisma.complaint.update({
    where: { id },
    data: {
      status,
      adminNote: adminNote ?? undefined,
      acknowledgedAt: status !== 'NEW' ? now : null,
      resolvedAt: status === 'RESOLVED' ? now : null,
    },
  });

  await logAudit({
    userId: adminId, action: 'COMPLAINT_STATUS_CHANGED',
    entity: 'Complaint', entityId: id, detail: `→ ${status}`,
  });
  await broadcastTree({ type: 'LEAF_STATUS', id, status });

  // Reward: ทุก ๆ 10 ใบเขียว งอกราก 1 ราก
  if (status === 'RESOLVED') {
    const resolvedCount = await prisma.complaint.count({ where: { status: 'RESOLVED' } });
    const rootCount = await prisma.treeReward.count({ where: { kind: 'ROOT' } });
    if (Math.floor(resolvedCount / 10) > rootCount) {
      const reward = await prisma.treeReward.create({
        data: { kind: 'ROOT', anchor: 0.15 + Math.random() * 0.7 },
      });
      await broadcastTree({ type: 'REWARD_ADDED', reward: { id: reward.id, kind: 'ROOT', anchor: reward.anchor } });
    }
  }
  return complaint;
}

/** แถวข้อร้องเรียนจากฐานข้อมูล (ระบุ type ชัดเจน) */
type ComplaintRow = {
  id: string; kind: 'COMPLAINT' | 'SUGGESTION'; isAnonymous: boolean; senderName: string | null;
  phoneEnc: string | null; lineEnc: string | null; emailEnc: string | null;
  contactChannel: ContactChannel; department: { name: string } | null;
  category: string; detail: string; incidentAt: Date | null;
  attachments: string[]; status: ComplaintStatus; adminNote: string | null;
  createdAt: Date; acknowledgedAt: Date | null; resolvedAt: Date | null;
};

/** อ่านรายละเอียดสำหรับ Admin — ถอดรหัสข้อมูลติดต่อกลับ */
export async function listComplaintsForAdmin(
  filter: { status?: ComplaintStatus; q?: string },
): Promise<AdminComplaint[]> {
  const complaints = await prisma.complaint.findMany({
    where: {
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.q
        ? { OR: [{ detail: { contains: filter.q, mode: 'insensitive' } }, { category: { contains: filter.q, mode: 'insensitive' } }] }
        : {}),
    },
    include: { department: true },
    orderBy: { createdAt: 'desc' },
    take: 300,
  });
  return complaints.map((c: ComplaintRow) => ({
    id: c.id,
    kind: c.kind,
    isAnonymous: c.isAnonymous,
    senderName: c.isAnonymous ? 'ไม่เปิดเผยตัวตน' : c.senderName ?? '-',
    phone: safeDecrypt(c.phoneEnc),
    line: safeDecrypt(c.lineEnc),
    email: safeDecrypt(c.emailEnc),
    contactChannel: c.contactChannel,
    department: c.department?.name ?? '-',
    category: c.category,
    detail: c.detail,
    incidentAt: c.incidentAt?.toISOString() ?? null,
    attachments: c.attachments,
    status: c.status,
    adminNote: c.adminNote,
    createdAt: c.createdAt.toISOString(),
    acknowledgedAt: c.acknowledgedAt?.toISOString() ?? null,
    resolvedAt: c.resolvedAt?.toISOString() ?? null,
  }));
}

const safeDecrypt = (v: string | null) => {
  if (!v) return null;
  try { return decrypt(v); } catch { return '(ถอดรหัสไม่ได้)'; }
};
