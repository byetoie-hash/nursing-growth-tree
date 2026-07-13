'use client';
/** QR Code + คัดลอกลิงก์ — ผู้ใช้สแกนแล้วส่งคำชม/ข้อร้องเรียนได้ทันที */
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';

export default function QRShare() {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL ?? '';

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="rounded-2xl bg-white p-4 shadow-inner">
        <QRCodeSVG value={url} size={188} fgColor="#245d33" />
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        สแกนเพื่อเปิด The Nursing Growth Tree แล้วส่งคำชื่นชม ข้อเสนอแนะ หรือข้อร้องเรียนได้ทันที
      </p>
      <div className="flex w-full gap-2">
        <input readOnly value={url} className="field flex-1 text-center" aria-label="ลิงก์สำหรับแชร์" />
        <button onClick={copy} className="btn-primary !px-4">{copied ? 'คัดลอกแล้ว ✓' : 'คัดลอก'}</button>
      </div>
    </div>
  );
}
