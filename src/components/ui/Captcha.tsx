'use client';
/** Captcha โจทย์เลขง่าย ๆ — โหลดโจทย์จาก /api/captcha, ตรวจฝั่ง server ด้วย HMAC */
import { useCallback, useEffect, useState } from 'react';

export default function Captcha({
  onChange,
}: {
  onChange: (v: { token: string; answer: string }) => void;
}) {
  const [question, setQuestion] = useState('…');
  const [token, setToken] = useState('');
  const [answer, setAnswer] = useState('');

  const load = useCallback(async () => {
    setAnswer('');
    const res = await fetch('/api/captcha');
    const data = await res.json();
    setQuestion(data.question);
    setToken(data.token);
    onChange({ token: data.token, answer: '' });
  }, [onChange]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div>
      <label className="label">ยืนยันว่าไม่ใช่บอท: {question}</label>
      <div className="flex gap-2">
        <input
          className="field flex-1" inputMode="numeric" placeholder="คำตอบ" value={answer} required
          onChange={(e) => { setAnswer(e.target.value); onChange({ token, answer: e.target.value }); }}
        />
        <button type="button" onClick={load} className="btn-soft !px-4" aria-label="สุ่มโจทย์ใหม่">↻</button>
      </div>
    </div>
  );
}
