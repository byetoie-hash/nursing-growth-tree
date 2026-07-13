# 🌳 The Nursing Growth Tree
**A Living Culture Dashboard for Nursing Excellence** — พัฒนาต่อยอดจากระบบต้นไม้จริยธรรม (Ethics Tree)

ระบบรับฟังเสียงสะท้อนของโรงพยาบาล — ผู้รับบริการ ญาติ และบุคลากร ส่ง **ข้อร้องเรียน ข้อเสนอแนะ และคำชม** ผ่านหน้าเว็บ Interactive ที่ทุกความคิดเห็นกลายเป็น **ใบไม้บนต้นไม้ต้นเดียวกันแบบ Realtime**

> "ทุกความคิดเห็น คือพลังในการเติบโตขององค์กร"

## ✨ ฟีเจอร์หลัก

- 🌾 ฉากธรรมชาติ 60FPS บน HTML5 Canvas — ทุ่งหญ้าไหวตามลม เมฆเคลื่อน แดดอ่อน sun rays นกบิน ผีเสื้อ ใบไม้ปลิว + เสียงธรรมชาติสังเคราะห์เปิด/ปิดได้
- 🍂 ส่งข้อร้องเรียน → ใบไม้สีน้ำตาลปลิวลงเกาะกิ่งแบบสุ่ม / รับเรื่อง → เหลือง / เสร็จ → เขียว (animate สีนุ่มนวล)
- 💚 คำชม 2 ด้าน: พฤติกรรมบริการ (เขียวอ่อน) และบริการทั่วไป (เขียวอ่อนอีกเฉด) — ทุกคนกดใบไม้เพื่ออ่านได้
- 🎁 Reward: เขียวครบ 10 → **รากงอก**, ชมพฤติกรรมครบ 10 → **ดอกชมพูบาน**, ชมบริการครบ 10 → **ผลไม้โต**
- 🔒 ข้อร้องเรียนอ่านได้เฉพาะ Admin (ข้อมูลติดต่อกลับเข้ารหัส AES-256-GCM)
- ⚡ Realtime ผ่าน Supabase — ทุกเครื่องเห็นต้นเดียวกัน
- 🧑‍💼 Admin: Dashboard สถิติ/กราฟ/Avg Response Time/Department Ranking, Kanban เปลี่ยนสถานะ (ลาก & คลิกเดียว), ค้นหา/Filter, Export Excel + PDF
- 📱 PWA + Offline Cache, Dark/Light Mode, QR Share, Push/Email/LINE แจ้งเตือน, Audit Log

## 🛠️ เทคโนโลยี

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Framer Motion · GSAP · HTML5 Canvas · Prisma + PostgreSQL (Supabase) · Supabase Realtime + Storage · NextAuth · ExcelJS

## 🚀 ติดตั้ง

### 1) เตรียม Supabase

1. สร้างโปรเจกต์ที่ [supabase.com](https://supabase.com)
2. **Storage** → สร้าง bucket ชื่อ `attachments` และตั้งเป็น **Public**
3. จดค่า: `Project URL`, `anon key`, `service_role key`, และ Connection string ของ Postgres (แบบ pooled + direct)

### 2) ตั้งค่า Environment

```bash
cp .env.example .env
```

กรอกค่าใน `.env` — สร้าง secret ได้ด้วย:

```bash
openssl rand -base64 32   # NEXTAUTH_SECRET
openssl rand -hex 32      # ENCRYPTION_KEY (hex 64 ตัวอักษร)
```

### 3) ติดตั้งและเตรียมฐานข้อมูล

```bash
npm install
npm run db:push    # สร้างตารางตาม prisma/schema.prisma
npm run db:seed    # สร้าง Admin + 11 หน่วยงานตัวอย่าง
```

บัญชีเริ่มต้น: `admin@hospital.go.th` / รหัสจาก `SEED_ADMIN_PASSWORD` (ค่าเริ่มต้น `ChangeMe!2026` — **เปลี่ยนทันทีหลังใช้งานจริง**)

### 4) รัน

```bash
npm run dev        # http://localhost:3000
```

- หน้าหลัก: `/` — ต้นไม้จริยธรรม
- ผู้ดูแล: `/admin/login` → `/admin`
- รายงาน PDF: `/admin/report` → ปุ่ม "บันทึกเป็น PDF"

## ☁️ Deploy บน Vercel

1. Push โค้ดขึ้น GitHub แล้ว Import ใน [vercel.com](https://vercel.com)
2. ตั้ง Environment Variables ทั้งหมดตาม `.env.example` (อย่าลืม `NEXT_PUBLIC_APP_URL` เป็นโดเมนจริง)
3. Deploy — `postinstall` จะรัน `prisma generate` ให้อัตโนมัติ
4. รัน seed ครั้งแรกจากเครื่องตัวเอง: `npm run db:seed` (ชี้ `DATABASE_URL` ไป production)

## 📁 โครงสร้างโปรเจกต์

```
ethics-tree/
├── prisma/               # schema + seed
├── public/
│   ├── icons/            # ไอคอน PWA
│   └── sw.js             # Service Worker (offline cache + push)
├── src/
│   ├── app/
│   │   ├── page.tsx      # หน้าหลัก (ต้นไม้)
│   │   ├── admin/        # login / dashboard / report
│   │   └── api/          # complaints, praises, tree, captcha, upload, admin/*
│   ├── components/
│   │   ├── tree/engine.ts    # Canvas engine (ฉากธรรมชาติ + ใบไม้ + rewards)
│   │   ├── modals/           # ฟอร์มร้องเรียน/คำชม, อ่านคำชม
│   │   ├── admin/            # StatsCards, Charts, Kanban, Detail
│   │   └── ui/               # Modal, Captcha, FileUpload, QRShare
│   ├── hooks/            # useTree (realtime), useSound (Web Audio)
│   ├── lib/              # prisma, supabase, crypto, auth, utils
│   ├── services/         # complaint, praise, stats, notify, realtime, audit
│   └── types/            # Shared types
└── middleware.ts         # ป้องกันเส้นทาง /admin
```

## 🔔 การแจ้งเตือน (ไม่บังคับ)

- **LINE**: ตั้ง `LINE_CHANNEL_ACCESS_TOKEN` + `LINE_ADMIN_USER_ID` (LINE Messaging API)
- **Email**: ตั้ง `RESEND_API_KEY` + `NOTIFY_EMAIL_TO` ([resend.com](https://resend.com))
- ไม่ตั้งค่า = ระบบข้ามการแจ้งเตือนโดยไม่ error

## 🔐 ความปลอดภัย

- เบอร์โทร/LINE/Email ผู้ร้องเรียน เข้ารหัส AES-256-GCM ก่อนบันทึก — ถอดรหัสเฉพาะฝั่ง Admin
- Captcha แบบ stateless (HMAC) กันสแปม, Zod validate ทุก API, Security headers, Audit Log ทุกการกระทำสำคัญ
