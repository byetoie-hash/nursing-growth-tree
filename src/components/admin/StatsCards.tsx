'use client';
/**
 * StatsCards — สรุปตัวเลขสำคัญบน Dashboard:
 * ร้องเรียนใหม่ / กำลังดำเนินการ / เสร็จสิ้น / คำชม / ราก / ดอก / ผล / % สำเร็จ
 */
import { motion } from 'framer-motion';
import type { DashboardStats } from '@/types';

export default function StatsCards({ stats }: { stats: DashboardStats }) {
  const cards = [
    { label: 'ร้องเรียนใหม่', value: stats.complaints.NEW, icon: '🍂', tone: 'text-amber-700 dark:text-amber-300' },
    { label: 'กำลังดำเนินการ', value: stats.complaints.IN_PROGRESS, icon: '🟡', tone: 'text-yellow-600 dark:text-yellow-300' },
    { label: 'เสร็จสิ้น', value: stats.complaints.RESOLVED, icon: '✅', tone: 'text-canopy-700 dark:text-canopy-300' },
    { label: 'คำชมทั้งหมด', value: stats.praises.total, icon: '💚', tone: 'text-emerald-600 dark:text-emerald-300' },
    { label: 'ราก (Root)', value: stats.rewards.ROOT, icon: '🌱', tone: 'text-bark-700 dark:text-bark-300' },
    { label: 'ดอกไม้ (Flower)', value: stats.rewards.FLOWER, icon: '🌸', tone: 'text-blossom-600 dark:text-blossom-300' },
    { label: 'ผลไม้ (Fruit)', value: stats.rewards.FRUIT, icon: '🍊', tone: 'text-orange-600 dark:text-orange-300' },
    { label: 'ดำเนินงานสำเร็จ', value: `${stats.resolvedPercent}%`, icon: '📈', tone: 'text-sky-600 dark:text-sky-300' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((c, i) => (
        <motion.div key={c.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.4 }}
          className="glass rounded-2xl p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">{c.icon} {c.label}</p>
          <p className={`mt-1 font-display text-2xl font-bold ${c.tone}`}>{c.value}</p>
        </motion.div>
      ))}
    </div>
  );
}
