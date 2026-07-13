'use client';
/** Modal กลาง — glassmorphism + Framer Motion, ปิดด้วย Esc/คลิกพื้นหลัง */
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';

export default function Modal({
  open, onClose, title, children, wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
          <motion.div
            role="dialog" aria-modal aria-label={title}
            className={`glass-strong relative w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-6 sm:p-8`}
            initial={{ y: 60, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <h2 className="font-display text-xl font-semibold text-canopy-800 dark:text-canopy-100">{title}</h2>
              <button onClick={onClose} aria-label="ปิดหน้าต่าง"
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
