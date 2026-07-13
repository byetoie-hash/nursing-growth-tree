'use client';
/**
 * หน้าเข้าสู่ระบบผู้ดูแล — NextAuth Credentials (Email + Password)
 */
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    const res = await signIn('credentials', { email, password, redirect: false });
    setBusy(false);
    if (res?.error) { setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง'); return; }
    router.push('/admin');
    router.refresh();
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-sky2-100 to-canopy-50 p-4 dark:from-slate-900 dark:to-slate-950">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 22 }}
        className="glass-strong w-full max-w-sm rounded-3xl p-8"
      >
        <div className="mb-6 text-center">
          <span className="text-4xl">🌳</span>
          <h1 className="mt-2 font-display text-xl font-bold text-canopy-800 dark:text-canopy-100">
            ผู้ดูแลระบบ — ต้นไม้จริยธรรม
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            เข้าสู่ระบบเพื่อจัดการข้อร้องเรียนและคำชม
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">อีเมล</label>
            <input type="email" className="field" required autoComplete="username"
              value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@hospital.go.th" />
          </div>
          <div>
            <label className="label">รหัสผ่าน</label>
            <input type="password" className="field" required autoComplete="current-password"
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" />
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className="btn btn-primary w-full">
            {busy ? 'กำลังตรวจสอบ…' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <a href="/" className="mt-5 block text-center text-sm text-canopy-700 underline-offset-2 hover:underline dark:text-canopy-300">
          ← กลับไปดูต้นไม้
        </a>
      </motion.div>
    </main>
  );
}
