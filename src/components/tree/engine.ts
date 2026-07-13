/**
 * =====================================================================
 *  The Nursing Growth Tree Engine — HTML5 Canvas 2D, 60 FPS (Painterly)
 * =====================================================================
 *  ต้นไม้สไตล์ภาพวาดมีปริมาตรแบบ mockup:
 *  - กิ่งก้านโปร่ง มองเห็นใบไม้เสียงสะท้อนชัดทุกใบ (มีกิ่งแขนงเล็กประกอบ)
 *  - ลำต้นทรงเรียวโค้ง มีเงาเปลือกไม้ + โคนรากแผ่ + เงาบนพื้น
 *  - ท้องฟ้า แดด (ฝั่งซ้าย) เมฆ นก ผีเสื้อ หญ้าไหว
 *  - ใบไม้เสียงสะท้อนเกาะบนพุ่ม (ขอบขาวให้เด่นจากพื้นหลัง) เปลี่ยนสีตามสถานะ
 *  - Reward: รากงอก / ดอกปีบบาน / ผลไม้โต   รองรับ reduced-motion, DPR, resize
 * =====================================================================
 */
import type { PublicLeaf, RewardKind } from '@/types';

// ---------- สีของใบไม้ตามสถานะ/ประเภท ----------
export const LEAF_COLORS: Record<string, string> = {
  NEW: '#d9534f',              // แดง — รับเรื่องแล้ว/กำลังตรวจสอบ
  IN_PROGRESS: '#e3b93d',      // เหลือง — กำลังดำเนินการ/ติดตาม (รวมข้อจำกัดเชิงระบบ)
  RESOLVED: '#2b753d',         // เขียวเข้ม — ดำเนินการแก้ไขแล้วเสร็จ
  SERVICE_BEHAVIOR: '#b9e8b0', // เขียวอ่อน — ชื่นชมด้านพฤติกรรมบริการ
  GENERAL_SERVICE: '#d3edaa',  // เขียวอ่อนอีกเฉด — ชื่นชมด้านคุณภาพการบริการ
};

interface EngineLeaf {
  id: string;
  kind: 'COMPLAINT' | 'SUGGESTION' | 'PRAISE';
  branchIndex: number;
  branchT: number;
  color: string;
  targetColor: string;
  x: number; y: number;
  size: number;
  phase: number;
  falling: boolean;
  fx: number; fy: number; fvy: number; frot: number; fsway: number;
  born: number;
}

interface Reward { kind: RewardKind; anchor: number; progress: number }
interface Cloud { x: number; y: number; scale: number; speed: number; puffs: { dx: number; dy: number; r: number }[] }
interface Butterfly { x: number; y: number; t: number; speed: number; hue: number }
interface Bird { x: number; y: number; vx: number; flap: number }
interface DriftLeaf { x: number; y: number; vx: number; rot: number; vr: number; color: string }

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const hexToRgb = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const lerpColor = (a: string, b: string, t: number) => {
  const [r1, g1, b1] = hexToRgb(a); const [r2, g2, b2] = hexToRgb(b);
  return `rgb(${Math.round(lerp(r1, r2, t))},${Math.round(lerp(g1, g2, t))},${Math.round(lerp(b1, b2, t))})`;
};

export class TreeEngine {
  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private time = 0;
  private w = 0; private h = 0; private dpr = 1;
  private reducedMotion = false;
  private theme: 'light' | 'dark' = 'light';

  private leaves = new Map<string, EngineLeaf>();
  private rewards: Reward[] = [];
  private clouds: Cloud[] = [];
  private butterflies: Butterfly[] = [];
  private birds: Bird[] = [];
  private drifting: DriftLeaf[] = [];
  private grassSeeds: number[] = [];

  private pointer = { x: 0.5, y: 0.5 };
  private cam = { x: 0, y: 0 };
  private hoverId: string | null = null;

  onLeafClick: (leaf: { id: string; kind: 'COMPLAINT' | 'SUGGESTION' | 'PRAISE' }) => void = () => {};

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.resize();
    for (let i = 0; i < 900; i++) this.grassSeeds.push(Math.random());
    for (let i = 0; i < 5; i++) {
      this.clouds.push({
        x: Math.random(), y: 0.06 + Math.random() * 0.16,
        scale: 0.6 + Math.random() * 0.9, speed: 0.004 + Math.random() * 0.006,
        puffs: Array.from({ length: 5 }, () => ({
          dx: (Math.random() - 0.5) * 90, dy: (Math.random() - 0.5) * 22, r: 22 + Math.random() * 26,
        })),
      });
    }
    for (let i = 0; i < 3; i++) {
      this.butterflies.push({ x: Math.random(), y: 0.45 + Math.random() * 0.25, t: Math.random() * 100, speed: 0.5 + Math.random() * 0.5, hue: [28, 330, 200][i] });
    }
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('click', this.onClick);
  }

  setTheme(theme: 'light' | 'dark') { this.theme = theme; }

  setSnapshot(leaves: PublicLeaf[], rewards: { kind: RewardKind; anchor: number }[]) {
    leaves.forEach((l) => this.upsertLeaf(l, false));
    this.rewards = rewards.map((r) => ({ ...r, progress: 1 }));
  }

  addLeaf(l: PublicLeaf) { this.upsertLeaf(l, true); }

  setLeafStatus(id: string, status: string) {
    const leaf = this.leaves.get(id);
    if (leaf) leaf.targetColor = LEAF_COLORS[status] ?? leaf.targetColor;
  }

  addReward(kind: RewardKind, anchor: number) {
    this.rewards.push({ kind, anchor, progress: 0 });
  }

  private upsertLeaf(l: PublicLeaf, animateFall: boolean) {
    const key = l.status ?? l.category ?? 'RESOLVED';
    const color = LEAF_COLORS[key] ?? '#2b753d';
    const existing = this.leaves.get(l.id);
    if (existing) { existing.targetColor = color; return; }
    const spot = this.leafSpot(l.branchIndex, l.branchT);
    this.leaves.set(l.id, {
      id: l.id, kind: l.kind, branchIndex: l.branchIndex, branchT: l.branchT,
      color, targetColor: color,
      x: spot.x, y: spot.y,
      size: 9.5 + Math.random() * 4,
      phase: Math.random() * Math.PI * 2,
      falling: animateFall && !this.reducedMotion,
      fx: spot.x + (Math.random() - 0.5) * this.w * 0.3,
      fy: -30, fvy: 0, frot: Math.random() * Math.PI * 2,
      fsway: Math.random() * Math.PI * 2,
      born: this.time,
    });
  }

  // ---------- เรขาคณิตของต้นไม้ ----------
  private base() { return { x: this.w * 0.5, y: this.h * 0.84 }; }
  private trunkTop() { const b = this.base(); return { x: b.x, y: b.y - this.h * 0.34 }; }

  /** กิ่ง 8 กิ่ง — quadratic bezier จากยอดลำต้นแผ่ออก (จุดยึดตำแหน่งใบ) */
  private branch(i: number) {
    const start = this.trunkTop();
    const spread = Math.min(this.w * 0.44, this.h * 0.46);
    const ang = -Math.PI / 2 + (i - 3.5) * 0.40;
    const len = spread * (0.78 + (i % 3) * 0.14);
    const end = { x: start.x + Math.cos(ang) * len, y: start.y + Math.sin(ang) * len * 0.85 };
    const ctrl = { x: start.x + Math.cos(ang) * len * 0.45, y: start.y + Math.sin(ang) * len * 0.30 - 20 };
    return { start, ctrl, end };
  }

  private leafSpot(i: number, t: number) {
    const { start, ctrl, end } = this.branch(i % 8);
    const x = (1 - t) ** 2 * start.x + 2 * (1 - t) * t * ctrl.x + t * t * end.x;
    const y = (1 - t) ** 2 * start.y + 2 * (1 - t) * t * ctrl.y + t * t * end.y;
    return { x, y };
  }

  // ---------- Interaction ----------
  private onPointerMove = (e: PointerEvent) => {
    const r = this.canvas.getBoundingClientRect();
    this.pointer.x = (e.clientX - r.left) / r.width;
    this.pointer.y = (e.clientY - r.top) / r.height;
    const hit = this.hitTest(e.clientX - r.left, e.clientY - r.top);
    this.hoverId = hit?.kind === 'PRAISE' ? hit.id : null;
    this.canvas.style.cursor = this.hoverId ? 'pointer' : 'default';
  };

  private onClick = (e: MouseEvent) => {
    const r = this.canvas.getBoundingClientRect();
    const hit = this.hitTest(e.clientX - r.left, e.clientY - r.top);
    if (hit) this.onLeafClick(hit);
  };

  private hitTest(px: number, py: number): { id: string; kind: 'COMPLAINT' | 'SUGGESTION' | 'PRAISE' } | null {
    let found: { id: string; kind: 'COMPLAINT' | 'SUGGESTION' | 'PRAISE' } | null = null;
    this.leaves.forEach((l) => {
      if (l.falling) return;
      const dx = px - (l.x + this.cam.x); const dy = py - (l.y + this.cam.y);
      if (dx * dx + dy * dy < (l.size + 6) ** 2) found = { id: l.id, kind: l.kind };
    });
    return found;
  }

  // ---------- Lifecycle ----------
  resize = () => {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = this.canvas.getBoundingClientRect();
    this.w = r.width; this.h = r.height;
    this.canvas.width = r.width * this.dpr;
    this.canvas.height = r.height * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.leaves.forEach((l) => {
      const s = this.leafSpot(l.branchIndex, l.branchT);
      l.x = s.x; l.y = s.y;
    });
  };

  start() {
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      this.time += dt;
      this.update(dt);
      this.render();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('click', this.onClick);
  }

  // ---------- Update ----------
  private update(dt: number) {
    const targetX = (0.5 - this.pointer.x) * 18;
    const targetY = (0.5 - this.pointer.y) * 8;
    this.cam.x = lerp(this.cam.x, this.reducedMotion ? 0 : targetX, dt * 2);
    this.cam.y = lerp(this.cam.y, this.reducedMotion ? 0 : targetY, dt * 2);

    this.clouds.forEach((c) => { c.x += c.speed * dt; if (c.x > 1.2) c.x = -0.25; });

    if (!this.reducedMotion && this.birds.length < 3 && Math.random() < dt * 0.06) {
      const ltr = Math.random() > 0.5;
      this.birds.push({ x: ltr ? -40 : this.w + 40, y: this.h * (0.08 + Math.random() * 0.15), vx: (ltr ? 1 : -1) * (40 + Math.random() * 40), flap: 0 });
    }
    this.birds = this.birds.filter((b) => b.x > -60 && b.x < this.w + 60);
    this.birds.forEach((b) => { b.x += b.vx * dt; b.flap += dt * 10; });

    this.butterflies.forEach((bf) => {
      bf.t += dt * bf.speed;
      bf.x = 0.5 + 0.38 * Math.sin(bf.t * 0.4 + bf.hue);
      bf.y = 0.55 + 0.14 * Math.sin(bf.t * 0.9) * Math.cos(bf.t * 0.33);
    });

    if (!this.reducedMotion && this.drifting.length < 6 && Math.random() < dt * 0.5) {
      this.drifting.push({
        x: this.w + 20, y: this.h * (0.3 + Math.random() * 0.35),
        vx: -(30 + Math.random() * 50), rot: Math.random() * 6, vr: 1 + Math.random() * 2,
        color: ['#8bcb95', '#c4e59a', '#e3b93d'][Math.floor(Math.random() * 3)],
      });
    }
    this.drifting = this.drifting.filter((d) => d.x > -30);
    this.drifting.forEach((d) => {
      d.x += d.vx * dt; d.y += Math.sin(this.time * 2 + d.rot) * 16 * dt; d.rot += d.vr * dt;
    });

    this.leaves.forEach((l) => {
      if (!l.falling) return;
      l.fvy = Math.min(l.fvy + 60 * dt, 95);
      l.fy += l.fvy * dt;
      l.fsway += dt * 3;
      l.fx += Math.sin(l.fsway) * 32 * dt;
      l.fx = lerp(l.fx, l.x, dt * 1.4);
      l.frot += dt * 2.4;
      if (l.fy >= l.y) { l.falling = false; }
    });

    this.leaves.forEach((l) => {
      if (l.color !== l.targetColor) l.color = lerpColor(rgbSafe(l.color), rgbSafe(l.targetColor), Math.min(dt * 2.5, 1));
      if (nearColor(l.color, l.targetColor)) l.color = l.targetColor;
    });

    this.rewards.forEach((r) => { r.progress = Math.min(r.progress + dt / 2.5, 1); });
  }

  // ---------- Render ----------
  private render() {
    const { ctx, w, h } = this;
    const dark = this.theme === 'dark';
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(this.cam.x, this.cam.y);

    // --- ท้องฟ้า ---
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.85);
    if (dark) { sky.addColorStop(0, '#0b1f33'); sky.addColorStop(1, '#173a52'); }
    else { sky.addColorStop(0, '#9ed8f0'); sky.addColorStop(0.55, '#c8e9f5'); sky.addColorStop(1, '#eef8fb'); }
    ctx.fillStyle = sky;
    ctx.fillRect(-40, -40, w + 80, h * 0.86 + 40);

    // --- พระอาทิตย์ ---
    const sx = w * 0.18, sy = h * 0.13;
    const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 150);
    glow.addColorStop(0, dark ? 'rgba(240,235,200,0.85)' : 'rgba(255,246,200,0.95)');
    glow.addColorStop(1, 'rgba(255,246,200,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(sx, sy, 150, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.translate(sx, sy); ctx.rotate(this.time * 0.02);
    ctx.strokeStyle = dark ? 'rgba(240,235,200,0.10)' : 'rgba(255,240,170,0.35)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 10; i++) { ctx.rotate(Math.PI / 5); ctx.beginPath(); ctx.moveTo(46, 0); ctx.lineTo(78, 0); ctx.stroke(); }
    ctx.restore();
    ctx.fillStyle = dark ? '#f2ecc0' : '#fff3ae';
    ctx.beginPath(); ctx.arc(sx, sy, 34, 0, Math.PI * 2); ctx.fill();

    // --- เมฆ ---
    ctx.fillStyle = dark ? 'rgba(200,215,230,0.22)' : 'rgba(255,255,255,0.92)';
    this.clouds.forEach((c) => {
      const cx = c.x * (w + 200) - 100, cy = c.y * h;
      c.puffs.forEach((p) => {
        ctx.beginPath();
        ctx.arc(cx + p.dx * c.scale, cy + p.dy * c.scale, p.r * c.scale, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    // --- นก ---
    ctx.strokeStyle = dark ? 'rgba(220,230,240,0.7)' : 'rgba(60,80,90,0.65)';
    ctx.lineWidth = 2;
    this.birds.forEach((b) => {
      const wing = Math.sin(b.flap) * 6;
      ctx.beginPath();
      ctx.moveTo(b.x - 9, b.y - wing);
      ctx.quadraticCurveTo(b.x, b.y + 3, b.x, b.y);
      ctx.quadraticCurveTo(b.x, b.y + 3, b.x + 9, b.y - wing);
      ctx.stroke();
    });

    // --- พื้นหญ้า (เนิน 2 ชั้นให้มีมิติ) ---
    const b = this.base();
    const grassBack = ctx.createLinearGradient(0, h * 0.70, 0, h);
    if (dark) { grassBack.addColorStop(0, '#20402a'); grassBack.addColorStop(1, '#142c1d'); }
    else { grassBack.addColorStop(0, '#9fd6a2'); grassBack.addColorStop(1, '#6cb87a'); }
    ctx.fillStyle = grassBack;
    ctx.beginPath();
    ctx.moveTo(-40, h * 0.80);
    ctx.quadraticCurveTo(w * 0.3, h * 0.75, w * 0.55, h * 0.775);
    ctx.quadraticCurveTo(w * 0.8, h * 0.79, w + 40, h * 0.762);
    ctx.lineTo(w + 40, h + 40); ctx.lineTo(-40, h + 40);
    ctx.closePath(); ctx.fill();
    const grassFront = ctx.createLinearGradient(0, h * 0.86, 0, h);
    if (dark) { grassFront.addColorStop(0, '#1a3623'); grassFront.addColorStop(1, '#102518'); }
    else { grassFront.addColorStop(0, '#8ccb92'); grassFront.addColorStop(1, '#5aad6a'); }
    ctx.fillStyle = grassFront;
    ctx.beginPath();
    ctx.moveTo(-40, h * 0.92);
    ctx.quadraticCurveTo(w * 0.35, h * 0.88, w * 0.7, h * 0.915);
    ctx.quadraticCurveTo(w * 0.9, h * 0.93, w + 40, h * 0.905);
    ctx.lineTo(w + 40, h + 40); ctx.lineTo(-40, h + 40);
    ctx.closePath(); ctx.fill();

    // --- เงาต้นไม้บนพื้น ---
    ctx.fillStyle = dark ? 'rgba(0,0,0,0.30)' : 'rgba(40,80,50,0.16)';
    ctx.beginPath();
    ctx.ellipse(b.x, b.y + 10, Math.min(w * 0.26, 260), 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // --- ราก (reward) — งอกจากโคน ---
    this.rewards.filter((r) => r.kind === 'ROOT').forEach((r, i) => {
      const p = easeOut(r.progress);
      const dir = r.anchor > 0.5 ? 1 : -1;
      const reach = (46 + i * 24 + r.anchor * 60) * dir;
      ctx.strokeStyle = dark ? '#5a4534' : '#7c5940';
      ctx.lineWidth = 8 * p;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(b.x + dir * 16, b.y + 2);
      ctx.quadraticCurveTo(b.x + reach * 0.5 * p, b.y + 15 * p, b.x + reach * p, b.y + (20 + (i % 3) * 6) * p);
      ctx.stroke();
      // ปมแสงตรงปลายราก (จุดคุณค่า)
      ctx.fillStyle = `rgba(255,220,120,${0.85 * p})`;
      ctx.beginPath(); ctx.arc(b.x + reach * p, b.y + (20 + (i % 3) * 6) * p, 3.4, 0, Math.PI * 2); ctx.fill();
    });

    // --- ลำต้นทรงปริมาตร (โพลิกอนเรียว + โคนรากแผ่ + แสงเงาเปลือกไม้) ---
    const top = this.trunkTop();
    const w0 = Math.max(30, w * 0.040);   // กว้างโคน
    const w1 = Math.max(12, w * 0.014);   // กว้างยอด
    const bend = -w * 0.006;              // โค้งเล็กน้อย
    const trunkGrad = ctx.createLinearGradient(b.x - w0, 0, b.x + w0, 0);
    trunkGrad.addColorStop(0, dark ? '#4a392b' : '#6b4a35');
    trunkGrad.addColorStop(0.45, dark ? '#6a5340' : '#8a6247');
    trunkGrad.addColorStop(1, dark ? '#3f3024' : '#5d3f2d');
    ctx.fillStyle = trunkGrad;
    ctx.beginPath();
    ctx.moveTo(b.x - w0, b.y + 4);
    // ขอบซ้าย
    ctx.bezierCurveTo(b.x - w0 * 0.55 + bend, b.y - h * 0.12, top.x - w1 * 1.2 + bend, top.y + h * 0.06, top.x - w1, top.y);
    // ยอด
    ctx.quadraticCurveTo(top.x, top.y - 8, top.x + w1, top.y);
    // ขอบขวา
    ctx.bezierCurveTo(top.x + w1 * 1.2 + bend, top.y + h * 0.06, b.x + w0 * 0.55 + bend, b.y - h * 0.12, b.x + w0, b.y + 4);
    // โคนรากแผ่ซ้าย-ขวา
    ctx.quadraticCurveTo(b.x + w0 * 1.7, b.y + 8, b.x + w0 * 2.1, b.y + 12);
    ctx.lineTo(b.x - w0 * 2.1, b.y + 12);
    ctx.quadraticCurveTo(b.x - w0 * 1.7, b.y + 8, b.x - w0, b.y + 4);
    ctx.closePath(); ctx.fill();
    // เส้นเปลือกไม้จางๆ
    ctx.strokeStyle = dark ? 'rgba(30,22,16,0.35)' : 'rgba(60,38,25,0.28)';
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 4; i++) {
      const off = (i - 1.5) * w0 * 0.34;
      ctx.beginPath();
      ctx.moveTo(b.x + off, b.y - 4);
      ctx.bezierCurveTo(b.x + off * 0.7 + bend, b.y - h * 0.12, top.x + off * 0.4 + bend, top.y + h * 0.08, top.x + off * 0.3, top.y + 12);
      ctx.stroke();
    }

    // --- กิ่งหลัก (โผล่จากพุ่มบางส่วน) ---
    ctx.strokeStyle = dark ? '#5c4735' : '#7a5640';
    ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      const { start, ctrl, end } = this.branch(i);
      ctx.lineWidth = Math.max(5, w * 0.007);
      ctx.beginPath(); ctx.moveTo(start.x, start.y);
      ctx.quadraticCurveTo(ctrl.x, ctrl.y, end.x, end.y);
      ctx.stroke();
      // กิ่งแขนงเล็ก 3 จุดต่อกิ่ง สลับซ้าย-ขวา + แขนงย่อยปลายสุด — ทรงพุ่มแน่นเป็นธรรมชาติ
      let flip = i % 2 ? 1 : -1;
      for (const tt of [0.45, 0.68, 0.88] as const) {
        const m = this.leafSpot(i, tt);
        const dir = flip; flip = -flip;
        const reach = 20 + (i % 3) * 7 + tt * 14;
        ctx.lineWidth = Math.max(2.5, w * 0.0032);
        ctx.beginPath(); ctx.moveTo(m.x, m.y);
        ctx.quadraticCurveTo(m.x + dir * reach * 0.5, m.y - reach * 0.6, m.x + dir * reach, m.y - reach * 0.9);
        ctx.stroke();
        // แขนงย่อยปลายแขนง
        ctx.lineWidth = Math.max(1.6, w * 0.002);
        ctx.beginPath(); ctx.moveTo(m.x + dir * reach * 0.6, m.y - reach * 0.66);
        ctx.quadraticCurveTo(m.x + dir * reach * 0.85, m.y - reach, m.x + dir * (reach * 0.7), m.y - reach * 1.25);
        ctx.stroke();
      }
    }

    // --- ดอกไม้ / ผลไม้ (rewards) ---
    this.rewards.forEach((r, i) => {
      if (r.kind === 'ROOT') return;
      const spot = this.leafSpot(Math.floor(r.anchor * 8) % 8, 0.55 + (i % 4) * 0.1);
      const p = easeOut(r.progress);
      if (r.kind === 'FLOWER') this.drawFlower(spot.x, spot.y, p);
      else this.drawFruit(spot.x, spot.y, p);
    });

    // --- ใบไม้เสียงสะท้อน (บนสุดของพุ่ม มีขอบขาวให้อ่านง่าย) ---
    this.leaves.forEach((l) => {
      const sway = this.reducedMotion ? 0 : Math.sin(this.time * 1.6 + l.phase) * 2.2;
      const x = l.falling ? l.fx : l.x + sway;
      const y = l.falling ? l.fy : l.y + Math.cos(this.time * 1.2 + l.phase) * 1.2;
      const rot = l.falling ? l.frot : Math.sin(this.time + l.phase) * 0.15;
      const glowing = this.hoverId === l.id;
      this.drawLeaf(x, y, l.size, rot, l.color, glowing, l.kind === 'PRAISE');
    });

    // --- ใบไม้ปลิวผ่านฉาก ---
    this.drifting.forEach((d) => this.drawLeaf(d.x, d.y, 7, d.rot, d.color, false, false, 0.8));

    // --- ผีเสื้อ ---
    this.butterflies.forEach((bf) => {
      const x = bf.x * w, y = bf.y * h;
      const flap = Math.sin(this.time * 12 + bf.hue) * 0.6 + 0.7;
      ctx.save(); ctx.translate(x, y);
      ctx.fillStyle = `hsla(${bf.hue}, 80%, 70%, .95)`;
      ctx.beginPath(); ctx.ellipse(-4, 0, 5 * flap, 7, -0.4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(4, 0, 5 * flap, 7, 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(60,50,40,.9)';
      ctx.fillRect(-1, -6, 2, 12);
      ctx.restore();
    });

    // --- หญ้าไหวตามลม ---
    const bladeColor = dark ? 'rgba(60,110,75,' : 'rgba(36,93,51,';
    const count = Math.min(this.grassSeeds.length, Math.floor(w / 2.2));
    for (let i = 0; i < count; i++) {
      const seed = this.grassSeeds[i];
      const gx = seed * w;
      const groundY = h * (0.78 + 0.2 * this.grassSeeds[(i * 7 + 3) % this.grassSeeds.length]);
      const height = 10 + seed * 16;
      const wind = this.reducedMotion ? 0
        : Math.sin(this.time * 1.8 + gx * 0.02) * 4 + Math.sin(this.time * 0.7 + gx * 0.005) * 3;
      ctx.strokeStyle = `${bladeColor}${0.35 + seed * 0.4})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(gx, groundY);
      ctx.quadraticCurveTo(gx + wind * 0.4, groundY - height * 0.6, gx + wind, groundY - height);
      ctx.stroke();
    }

    ctx.restore();
  }

  /** วาดใบไม้ 1 ใบ — ขอบขาวบาง ให้เด่นบนพุ่มเขียว */
  private drawLeaf(x: number, y: number, size: number, rot: number, color: string, glow: boolean, readable: boolean, alpha = 1) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.globalAlpha = alpha;
    if (glow) { ctx.shadowColor = 'rgba(255,255,255,0.9)'; ctx.shadowBlur = 14; }
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.bezierCurveTo(size, -size * 0.5, size * 0.7, size * 0.7, 0, size);
    ctx.bezierCurveTo(-size * 0.7, size * 0.7, -size, -size * 0.5, 0, -size);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, -size * 0.7); ctx.lineTo(0, size * 0.7); ctx.stroke();
    if (readable && !glow) {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath(); ctx.arc(0, 0, 1.6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  /** ดอกปีบสีขาว — กลีบเรียวยาว 5 กลีบ เกสรเหลือง (deco = ขนาดเล็ก จาง) */
  private drawFlower(x: number, y: number, p: number, deco = false) {
    const { ctx } = this;
    ctx.save(); ctx.translate(x, y); ctx.scale(p, p);
    ctx.globalAlpha = deco ? 0.92 : 1;
    ctx.shadowColor = 'rgba(60,100,70,0.25)'; ctx.shadowBlur = deco ? 2 : 4;
    for (let i = 0; i < 5; i++) {
      ctx.rotate((Math.PI * 2) / 5);
      const petal = ctx.createLinearGradient(0, 0, 0, -13);
      petal.addColorStop(0, '#eef5ea');
      petal.addColorStop(1, '#ffffff');
      ctx.fillStyle = petal;
      ctx.beginPath(); ctx.ellipse(0, -8.5, 3.6, 9.5, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#f2ce5a';
    ctx.beginPath(); ctx.arc(0, 0, 3.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#dfae32';
    ctx.beginPath(); ctx.arc(0.8, 0.8, 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  /** ผลไม้สีเขียว — โตตาม progress */
  private drawFruit(x: number, y: number, p: number) {
    const { ctx } = this;
    ctx.save(); ctx.translate(x, y + 6); ctx.scale(p, p);
    ctx.strokeStyle = '#6f4e39'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, -6); ctx.stroke();
    const grad = ctx.createRadialGradient(-3, -3, 1, 0, 0, 9);
    grad.addColorStop(0, '#c8e698'); grad.addColorStop(1, '#7fb254');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(0, 0, 8.5, 0, Math.PI * 2); ctx.fill();
    // ผิวขรุขระแบบน้อยหน่า
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath(); ctx.arc(Math.cos(a) * 4.2, Math.sin(a) * 4.2, 1.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.arc(-3, -3, 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

// ---------- helpers ----------
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
function rgbSafe(c: string): string {
  if (c.startsWith('#')) return c;
  const m = c.match(/\d+/g);
  if (!m) return '#2b753d';
  return '#' + m.slice(0, 3).map((n) => Number(n).toString(16).padStart(2, '0')).join('');
}
const nearColor = (a: string, b: string) => {
  const [r1, g1, b1] = hexToRgb(rgbSafe(a)); const [r2, g2, b2] = hexToRgb(rgbSafe(b));
  return Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2) < 9;
};
