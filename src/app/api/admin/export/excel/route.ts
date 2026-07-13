/** GET /api/admin/export/excel — Export ข้อร้องเรียน + คำชมเป็น .xlsx (Admin) */
import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { requireAdmin } from '@/lib/utils';
import { listComplaintsForAdmin } from '@/services/complaint.service';
import { listPublicPraises } from '@/services/praise.service';

export const dynamic = 'force-dynamic';

const STATUS_TH = { NEW: 'ร้องเรียนใหม่', IN_PROGRESS: 'กำลังดำเนินการ', RESOLVED: 'เสร็จสิ้น' } as const;

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const [complaints, praises] = await Promise.all([
    listComplaintsForAdmin({}),
    listPublicPraises(),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Ethics Tree';

  const ws1 = wb.addWorksheet('ข้อร้องเรียน');
  ws1.columns = [
    { header: 'วันที่ส่ง', key: 'createdAt', width: 20 },
    { header: 'สถานะ', key: 'status', width: 16 },
    { header: 'ผู้ส่ง', key: 'senderName', width: 20 },
    { header: 'หน่วยงาน', key: 'department', width: 22 },
    { header: 'ประเภท', key: 'category', width: 20 },
    { header: 'รายละเอียด', key: 'detail', width: 60 },
    { header: 'เบอร์โทร', key: 'phone', width: 14 },
    { header: 'LINE', key: 'line', width: 16 },
    { header: 'Email', key: 'email', width: 24 },
    { header: 'วันที่เสร็จสิ้น', key: 'resolvedAt', width: 20 },
  ];
  complaints.forEach((c) =>
    ws1.addRow({
      ...c,
      status: STATUS_TH[c.status],
      createdAt: new Date(c.createdAt).toLocaleString('th-TH'),
      resolvedAt: c.resolvedAt ? new Date(c.resolvedAt).toLocaleString('th-TH') : '-',
    }),
  );
  ws1.getRow(1).font = { bold: true };

  const ws2 = wb.addWorksheet('คำชม');
  ws2.columns = [
    { header: 'วันที่ส่ง', key: 'createdAt', width: 20 },
    { header: 'ประเภท', key: 'category', width: 24 },
    { header: 'ผู้ส่ง', key: 'senderName', width: 20 },
    { header: 'ชมเจ้าหน้าที่', key: 'staffName', width: 20 },
    { header: 'หน่วยงาน', key: 'departmentName', width: 22 },
    { header: 'ข้อความ', key: 'message', width: 60 },
  ];
  praises.forEach((p) =>
    ws2.addRow({
      ...p,
      category: p.category === 'SERVICE_BEHAVIOR' ? 'พฤติกรรมบริการ' : 'บริการทั่วไป',
      senderName: p.senderName ?? 'ไม่เปิดเผยตัวตน',
      createdAt: new Date(p.createdAt).toLocaleString('th-TH'),
    }),
  );
  ws2.getRow(1).font = { bold: true };

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="ethics-tree-${Date.now()}.xlsx"`,
    },
  });
}
