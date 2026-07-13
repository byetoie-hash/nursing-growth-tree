/**
 * Seed — สร้างผู้ดูแลระบบเริ่มต้น + หน่วยงานของกองการพยาบาล
 * รัน: npm run db:seed  (รันซ้ำได้ ไม่สร้างข้อมูลซ้ำ)
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe!2026', 12);

  await prisma.user.upsert({
    where: { email: 'admin@hospital.go.th' },
    update: { passwordHash },
    create: {
      name: 'ผู้ดูแลระบบ',
      email: 'admin@hospital.go.th',
      passwordHash,
      role: 'ADMIN',
    },
  });

  // หน่วยงานภายใต้กองการพยาบาล — แก้ไข/เพิ่มได้ตามโครงสร้างจริง
  const departments = [
    'หอผู้ป่วยอายุรกรรม 1', 'หอผู้ป่วยอายุรกรรม 2', 'หอผู้ป่วยศัลยกรรม',
    'หอผู้ป่วยกุมารเวชกรรม', 'หอผู้ป่วยสูติ-นรีเวชกรรม', 'หอผู้ป่วยหนัก (ICU)',
    'ห้องอุบัติเหตุ-ฉุกเฉิน (ER)', 'ห้องผ่าตัด (OR)', 'ห้องคลอด (LR)',
    'ผู้ป่วยนอก (OPD)', 'หน่วยไตเทียม', 'หน่วยจ่ายกลาง (CSSD)', 'อื่น ๆ',
  ];
  for (const name of departments) {
    await prisma.department.upsert({ where: { name }, update: {}, create: { name } });
  }
  console.log('✅ Seed เสร็จสมบูรณ์ — admin@hospital.go.th + หน่วยงานกองการพยาบาล');
}

main().finally(() => prisma.$disconnect());
