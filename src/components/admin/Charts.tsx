'use client';
/**
 * Charts — กราฟแท่งรายเดือน (ร้องเรียน vs คำชม) + จัดอันดับหน่วยงาน
 * + Average Response Time — ใช้ Recharts (responsive)
 */
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from 'recharts';
import type { DashboardStats } from '@/types';

export default function Charts({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* แนวโน้มรายเดือน 6 เดือนล่าสุด */}
      <div className="glass rounded-2xl p-4">
        <h3 className="mb-3 font-display text-sm font-semibold text-slate-700 dark:text-slate-200">
          📊 แนวโน้ม 6 เดือนล่าสุด
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.monthly} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,140,120,.2)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,.12)', fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="complaints" name="ข้อร้องเรียน" fill="#b58b5a" radius={[6, 6, 0, 0]} />
              <Bar dataKey="praises" name="คำชม" fill="#3a924e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* จัดอันดับหน่วยงาน + เวลาตอบสนองเฉลี่ย */}
      <div className="glass rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold text-slate-700 dark:text-slate-200">
            🏆 จัดอันดับหน่วยงาน (Top 10)
          </h3>
          <span className="rounded-full bg-sky2-100 px-3 py-1 text-xs font-medium text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
            ⏱️ เวลารับเรื่องเฉลี่ย: {stats.avgResponseHours == null ? '—' : `${stats.avgResponseHours} ชม.`}
          </span>
        </div>
        {stats.departmentRanking.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">ยังไม่มีข้อมูล</p>
        ) : (
          <ol className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
            {stats.departmentRanking.map((d, i) => (
              <li key={d.name}
                className="flex items-center justify-between rounded-xl bg-white/50 px-3 py-2 text-sm dark:bg-white/5">
                <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <span className="w-6 text-center font-display font-bold text-canopy-700 dark:text-canopy-300">
                    {i + 1}
                  </span>
                  {d.name}
                </span>
                <span className="flex gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span>🍂 {d.complaints}</span>
                  <span>💚 {d.praises}</span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
