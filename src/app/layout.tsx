import type { Metadata, Viewport } from 'next';
import { Anuphan, Sarabun } from 'next/font/google';
import './globals.css';
import Providers from './providers';

// Display: Anuphan — โค้งมนอบอุ่นแบบไทยสมัยใหม่ / Body: Sarabun — อ่านง่ายระดับราชการ
const display = Anuphan({ subsets: ['thai', 'latin'], weight: ['500', '600', '700'], variable: '--font-display' });
const body = Sarabun({ subsets: ['thai', 'latin'], weight: ['300', '400', '500', '600'], variable: '--font-body' });

const HOSPITAL = process.env.NEXT_PUBLIC_HOSPITAL_NAME ?? 'โรงพยาบาล';

export const metadata: Metadata = {
  title: `The Nursing Growth Tree — ${HOSPITAL}`,
  description: 'A Living Culture Dashboard for Nursing Excellence — ต้นไม้แห่งการเติบโตของกองการพยาบาล ร่วมส่งคำชื่นชม ข้อเสนอแนะ และข้อร้องเรียน',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Nursing Growth Tree', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f4e8' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1f33' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className={`${display.variable} ${body.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
