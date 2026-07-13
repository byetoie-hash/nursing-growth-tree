/** Audit Log — บันทึกทุกการกระทำสำคัญของระบบ */
import { prisma } from '@/lib/prisma';

export async function logAudit(params: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId: string;
  detail?: string;
}) {
  await prisma.auditLog.create({
    data: {
      userId: params.userId ?? null,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      detail: params.detail,
    },
  });
}
