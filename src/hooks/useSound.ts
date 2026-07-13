'use client';
/**
 * useSound — เสียงธรรมชาติ (ลม + นกร้อง) สังเคราะห์ด้วย Web Audio API
 * ไม่ต้องพึ่งไฟล์เสียงภายนอก · เปิด/ปิดได้ · เริ่มเมื่อผู้ใช้กดเท่านั้น
 */
import { useCallback, useRef, useState } from 'react';

export function useSound() {
  const [enabled, setEnabled] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<AudioNode[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    nodesRef.current.forEach((n) => { try { (n as OscillatorNode).stop?.(); } catch {} n.disconnect(); });
    nodesRef.current = [];
    ctxRef.current?.close();
    ctxRef.current = null;
  }, []);

  const start = useCallback(() => {
    const ctx = new AudioContext();
    ctxRef.current = ctx;

    // --- เสียงลม: filtered noise เบา ๆ ---
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer; noise.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 420; filter.Q.value = 0.6;
    const windGain = ctx.createGain(); windGain.gain.value = 0.05;
    // แรงลมขึ้นลงช้า ๆ
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.025;
    lfo.connect(lfoGain); lfoGain.connect(windGain.gain);
    noise.connect(filter); filter.connect(windGain); windGain.connect(ctx.destination);
    noise.start(); lfo.start();
    nodesRef.current.push(noise, filter, windGain, lfo, lfoGain);

    // --- นกร้องสุ่มเป็นระยะ ---
    const chirp = () => {
      if (!ctxRef.current) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      const f0 = 1800 + Math.random() * 1400;
      osc.frequency.setValueAtTime(f0, t);
      osc.frequency.exponentialRampToValueAtTime(f0 * 1.4, t + 0.08);
      osc.frequency.exponentialRampToValueAtTime(f0 * 0.9, t + 0.18);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.05, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.3);
    };
    timerRef.current = setInterval(() => { if (Math.random() < 0.5) chirp(); }, 2600);
  }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      if (prev) stop(); else start();
      return !prev;
    });
  }, [start, stop]);

  return { enabled, toggle };
}
