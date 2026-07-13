'use client';
/** ผืนผ้าใบเต็มจอของฉากต้นไม้ — engine ทำงานภายใน useTree */
import { forwardRef } from 'react';

const TreeCanvas = forwardRef<HTMLCanvasElement>(function TreeCanvas(_, ref) {
  return (
    <canvas
      ref={ref}
      className="absolute inset-0 h-full w-full touch-none"
      aria-label="ต้นไม้จริยธรรม — ใบไม้แต่ละใบคือหนึ่งความคิดเห็น ใบสีอ่อนคือคำชม กดเพื่ออ่านได้"
      role="img"
    />
  );
});
export default TreeCanvas;
