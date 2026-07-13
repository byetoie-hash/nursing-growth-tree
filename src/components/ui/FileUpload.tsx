'use client';
/** แนบรูป/ไฟล์ — อัปโหลดไป /api/upload (Supabase Storage) พร้อมพรีวิว */
import { useRef, useState } from 'react';

export default function FileUpload({
  urls, onChange, max = 5,
}: {
  urls: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true); setError('');
    const next = [...urls];
    for (const file of Array.from(files).slice(0, max - urls.length)) {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok) next.push(data.url);
      else setError(data.error ?? 'อัปโหลดไม่สำเร็จ');
    }
    onChange(next);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <label className="label">แนบรูปภาพ / ไฟล์ (ไม่เกิน {max} ไฟล์, ไฟล์ละ 5MB)</label>
      <input
        ref={inputRef} type="file" multiple accept="image/*,.pdf"
        onChange={(e) => upload(e.target.files)}
        className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-full file:border-0 file:bg-canopy-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-canopy-800 hover:file:bg-canopy-200 dark:file:bg-canopy-900 dark:file:text-canopy-100"
      />
      {busy && <p className="mt-1 text-xs text-slate-500">กำลังอัปโหลด…</p>}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {urls.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2">
          {urls.map((u, i) => (
            <li key={u} className="group relative">
              {/\.(png|jpe?g|webp|gif)$/i.test(u) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={u} alt={`ไฟล์แนบ ${i + 1}`} className="h-16 w-16 rounded-lg object-cover ring-1 ring-slate-200" />
              ) : (
                <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100 text-xs dark:bg-slate-800">PDF</span>
              )}
              <button type="button" aria-label="ลบไฟล์แนบ"
                onClick={() => onChange(urls.filter((x) => x !== u))}
                className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 rounded-full bg-red-500 text-[10px] text-white group-hover:block">✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
