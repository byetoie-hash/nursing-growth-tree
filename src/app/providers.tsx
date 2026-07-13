'use client';
/** Providers — Session (NextAuth) + Theme (dark/light) + ลงทะเบียน Service Worker */
import { SessionProvider } from 'next-auth/react';
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({ theme: 'light', toggle: () => {} });
export const useTheme = () => useContext(ThemeCtx);

export default function Providers({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    // อ่านค่าที่ผู้ใช้เคยเลือก หรือใช้ค่าจากระบบ
    const saved = localStorage.getItem('theme') as Theme | null;
    const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const initial = saved ?? system;
    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');

    // PWA: ลงทะเบียน service worker (offline cache)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  const toggle = () => {
    setTheme((t) => {
      const next = t === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', next);
      document.documentElement.classList.toggle('dark', next === 'dark');
      return next;
    });
  };

  return (
    <SessionProvider>
      <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>
    </SessionProvider>
  );
}
