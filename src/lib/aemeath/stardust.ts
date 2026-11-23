/**
 * Ambient stardust for the page whitespace.
 *
 * Motifs are taken from 爱弥斯「飞行雪绒」(Aemeath, "Flying Snowvelvet"), the Fusion resonator
 * added in 3.1「赠予雪中的你」: a former Tunneler candidate at Star Torch Academy who became a
 * "digital ghost", and whose ability has her fuse with the Tunneler Armament and —
 * "lightly turn into starlight, singing softly as she flies through the endless night,
 * lighting up the stars in the darkness".
 *
 * Three motes carry that:
 * - `stardust`    fine motes rising slowly (星炬 / 璀璨星河)
 * - `snowvelvet`  soft flakes drifting down (飞行雪绒)
 * - `morningstar` rare four-point glints in warm gold (专武「永远的启明星」, 热熔属性)
 *
 * Rendering is one `drawImage` per mote from pre-rendered sprites, like the cover petal field.
 */

export const MOTE_KINDS = ['stardust', 'snowvelvet', 'morningstar'] as const;
export type MoteKind = (typeof MOTE_KINDS)[number];

/** Relative share of each kind; morningstar is no longer vanishingly rare — it is the signature. */
export const MOTE_WEIGHTS: Readonly<Record<MoteKind, number>> = {
  stardust: 0.5,
  snowvelvet: 0.3,
  morningstar: 0.2,
};

/** Mote colors: pink-white dust, cooler frost, and a warm morning star. */
export const MOTE_COLORS: Readonly<Record<MoteKind, readonly string[]>> = {
  stardust: ['#ffd9e8', '#fff2f7', '#ffc3d9', '#ffffff'],
  snowvelvet: ['#ffffff', '#fdeef5', '#f6e9ff'],
  morningstar: ['#ffe6b8', '#fff6e0', '#ffd79a'],
};

const MAX_DPR = 2;
const SPRITE_UNIT = 4;
const SPRITE_SIZE = 24;

/**
 * How many motes the viewport gets.
 *
 * Coarse pointers (phones) pay more per pixel for a full-screen canvas, so they get a
 * thinner field; both ends are clamped so a huge monitor cannot flood the layer and a
 * short window still shows a few motes.
 */
export function resolveMoteCount(width: number, height: number, coarse: boolean): number {
  const density = (width * height) / (coarse ? 15000 : 9000);
  return Math.round(Math.min(coarse ? 70 : 130, Math.max(coarse ? 24 : 44, density)));
}

/** Draw one kind from the weighted table using an injected `random` so it stays testable. */
export function pickMoteKind(random: () => number): MoteKind {
  let roll = random();
  for (const kind of MOTE_KINDS) {
    roll -= MOTE_WEIGHTS[kind];
    if (roll < 0) return kind;
  }
  return MOTE_KINDS[MOTE_KINDS.length - 1];
}

function createRoundSprite(color: string, scale: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = Math.ceil(SPRITE_SIZE * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.scale(scale, scale);
  const center = SPRITE_SIZE / 2;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.3, color);
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradient;
  // A soft outer bloom lifts the mote off the pale wash; a bare dot disappears on white.
  const bloom = ctx.createRadialGradient(center, center, 0, center, center, center);
  bloom.addColorStop(0, `${color}55`);
  bloom.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = bloom;
  ctx.beginPath();
  ctx.arc(center, center, center, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(center, center, center * 0.55, 0, Math.PI * 2);
  ctx.fill();
  return canvas;
}

/** A four-point star with concave sides — the morning star's sparkle. */
function createStarSprite(color: string, scale: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = Math.ceil(SPRITE_SIZE * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.scale(scale, scale);
  const c = SPRITE_SIZE / 2;
  const outer = c * 0.98;
  const waist = c * 0.16;
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const radius = i % 2 === 0 ? outer : waist;
    const angle = (Math.PI / 4) * i - Math.PI / 2;
    const x = c + Math.cos(angle) * radius;
    const y = c + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  // Halo under the star so a 12px spark still registers at a glance.
  const halo = ctx.createRadialGradient(c, c, 0, c, c, c);
  halo.addColorStop(0, `${color}66`);
  halo.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
  return canvas;
}

/** Pre-render every kind/color pair once so each frame is only `drawImage`. */
export function createStardustSprites(scale: number): Record<MoteKind, HTMLCanvasElement[]> {
  return {
    stardust: MOTE_COLORS.stardust.map((color) => createRoundSprite(color, scale)),
    snowvelvet: MOTE_COLORS.snowvelvet.map((color) => createRoundSprite(color, scale)),
    morningstar: MOTE_COLORS.morningstar.map((color) => createStarSprite(color, scale)),
  };
}

interface Mote {
  kind: MoteKind;
  x: number;
  y: number;
  /** Vertical speed in px/s; negative rises, positive falls. */
  rise: number;
  size: number;
  depth: number;
  alpha: number;
  twinklePhase: number;
  twinkleSpeed: number;
  swayPhase: number;
  swayAmp: number;
  swaySpeed: number;
  life: number;
  sprite: number;
}

const random = (min: number, max: number) => min + Math.random() * (max - min);

export class StardustField {
  private readonly ctx: CanvasRenderingContext2D;
  private sprites: Record<MoteKind, HTMLCanvasElement[]> | null = null;
  private motes: Mote[] = [];
  private width = 0;
  private height = 0;
  private dpr = 1;
  private frame = 0;
  private lastTime = 0;
  private clock = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    this.ctx = ctx;
  }

  get running(): boolean {
    return this.frame !== 0;
  }

  resize(width: number, height: number): void {
    if (width === this.width && height === this.height) return;
    const firstLayout = this.width === 0;
    this.dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    this.width = width;
    this.height = height;
    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);
    this.sprites ??= createStardustSprites(SPRITE_UNIT * this.dpr);

    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const target = resolveMoteCount(width, height, coarse);
    while (this.motes.length < target) this.motes.push(this.spawn(firstLayout));
    this.motes.length = target;
  }

  start(): void {
    if (this.frame !== 0) return;
    this.lastTime = performance.now();
    this.frame = requestAnimationFrame(this.tick);
  }

  stop(): void {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  clear(): void {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private spawn(scatter: boolean): Mote {
    const kind = pickMoteKind(Math.random);
    const depth = random(0.4, 1);
    const isStar = kind === 'morningstar';
    const rises = kind !== 'snowvelvet';
    return {
      kind,
      x: random(-30, this.width + 30),
      y: scatter ? random(0, this.height) : rises ? random(this.height + 20, this.height + 140) : random(-140, -20),
      rise: rises ? -random(6, 20) * (0.6 + depth * 0.4) : random(8, 22) * (0.6 + depth * 0.4),
      // Stars are the signature, so they carry more size than the dust they sit among.
      size: (isStar ? random(1.9, 3.1) : random(0.85, 1.7)) * (0.55 + depth * 0.45),
      depth,
      alpha: (isStar ? random(0.75, 1) : random(0.45, 0.85)) * (0.5 + depth * 0.5),
      twinklePhase: random(0, Math.PI * 2),
      twinkleSpeed: isStar ? random(1.1, 2) : random(0.5, 1.5),
      swayPhase: random(0, Math.PI * 2),
      swayAmp: random(4, 16),
      swaySpeed: random(0.3, 0.9),
      life: scatter ? random(0.15, 1) : 0,
      sprite: Math.floor(random(0, MOTE_COLORS[kind].length)),
    };
  }

  private readonly tick = (now: number) => {
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;
    this.clock += dt;
    this.update(dt);
    this.draw();
    this.frame = requestAnimationFrame(this.tick);
  };

  private update(dt: number): void {
    for (const mote of this.motes) {
      mote.swayPhase += mote.swaySpeed * dt;
      mote.twinklePhase += mote.twinkleSpeed * dt;
      // The whole field leans on a slow shared breeze so motes do not move as independent dots.
      const breeze = Math.sin(this.clock * 0.09 + mote.depth) * 5;
      mote.x += (breeze + Math.cos(mote.swayPhase) * mote.swayAmp * 0.4) * dt;
      mote.y += mote.rise * dt;
      mote.life = Math.min(1, mote.life + dt / 1.6);

      const gone = mote.y < -60 || mote.y > this.height + 60 || mote.x < -70 || mote.x > this.width + 70;
      if (gone) {
        Object.assign(mote, this.spawn(false));
        // Re-enter from the opposite edge so a recycled mote never jumps across the viewport.
        mote.x = random(0, this.width);
      }
    }
  }

  private draw(): void {
    const { ctx, dpr } = this;
    this.clear();
    if (!this.sprites) return;
    for (const mote of this.motes) {
      const sprite = this.sprites[mote.kind][mote.sprite];
      if (!sprite) continue;
      const twinkle = 0.55 + 0.45 * Math.sin(mote.twinklePhase);
      const alpha = mote.alpha * mote.life * twinkle;
      if (alpha <= 0.01) continue;
      const size = SPRITE_SIZE * mote.size;
      ctx.globalAlpha = Math.min(1, alpha);
      ctx.drawImage(sprite, mote.x * dpr - (size * dpr) / 2, mote.y * dpr - (size * dpr) / 2, size * dpr, size * dpr);
    }
    ctx.globalAlpha = 1;
  }
}
