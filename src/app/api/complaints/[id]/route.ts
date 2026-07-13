/** PATCH /api/complaints/:id — เปลี่ยนสถานะ (Admin เท่านั้น) */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/utils';
import { updateComplaintStatus } from '@/services/complaint.service';

export const dynamic = 'force-dynamic';

const schema = z.object({
  status: z.enum(['NEW', 'IN_PROGRESS', 'RESOLVED']),
  adminNote: z.string().max(2000).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireAdmin();
  if (error) return error;
  try {
    const body = schema.parse(await req.json());
    const complaint = await updateComplaintStatus(
      params.id, body.status, session!.user.id!, body.adminNote,
    );
    return NextResponse.json({ id: complaint.id, status: complaint.status });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'อัปเดตสถานะไม่สำเร็จ' }, { status: 400 });
  }
}
