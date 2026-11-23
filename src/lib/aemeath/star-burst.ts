/**
 * A burst of golden four-point stars where an interactive element is pressed
 * (lively motion level only).
 *
 * Replaces the sakura petal burst: the character this site is themed on is a Fusion
 * resonator whose signature is the morning star, so a click throws warm sparks rather
 * than pink petals.
 *
 * Each star's flight is simulated up front (a toss, air drag, then a slow fall with sway,
 * spin and a flip about its long axis) and baked into transform/opacity keyframes, so the
 * compositor plays it even while a navigation keeps the main thread busy.
 *
 * The layer lives on <html> so it survives ClientRouter swaps. While stars are airborne it
 * carries its own view-transition-name, so a page transition shows it as a live group above
 * both pages instead of freezing it into the old snapshot; its animations hold still while
 * the page itself is frozen, then resume exactly where they stopped.
 */

import { readMotionLevel, subscribeMotionLevel } from '@lib/motion-level';
import { STAR_COLORS, STAR_MASK } from './star';

const INTERACTIVE = 'a[href], button, [role="button"], summary, label[for]';
const EXCLUDED = 'input, textarea, select, [contenteditable="true"], [data-no-petals]';
/**
 * More sparks than the petal burst used (7), because a star is visually lighter than a petal
 * and the effect should read as a spark, not a single dot.
 */
const STARS_PER_BURST = 12;
const SAMPLE_MS = 1000 / 30;
const LAYER_NAME = 'aemeath-star-burst';

let layer: HTMLDivElement | null = null;
const flights = new Set<Animation>();

const random = (min: number, max: number) => min + Math.random() * (max - min);
const smoothstep = (t: number) => t * t * (3 - 2 * t);

function ensureLayer(): HTMLDivElement {
  if (layer?.isConnected) return layer;
  layer = document.createElement('div');
  layer.className = 'star-burst-layer';
  layer.setAttribute('aria-hidden', 'true');
  layer.style.setProperty('--star-mask', STAR_MASK);
  document.documentElement.append(layer);
  return layer;
}

/** One star tossed from (x, y), sampled into keyframes. Positions are the star's center in px. */
function simulateFlight(x: number, y: number, depth: number): { keyframes: Keyframe[]; duration: number } {
  const angle = -Math.PI / 2 + random(-1.3, 1.3);
  const speed = random(190, 380) * (0.75 + depth * 0.25);
  const drag = random(3.4, 4.4);
  const terminal = random(80, 115);
  const duration = random(1000, 1450);
  const sway = { amplitude: random(5, 13), frequency: random(4.5, 7.5), phase: random(0, Math.PI * 2) };
  const flip = { frequency: random(6, 10), phase: random(0, Math.PI * 2) };
  const spin = random(160, 420) * (Math.random() < 0.5 ? -1 : 1);
  const rotation = random(0, 360);

  let px = x + random(-3, 3);
  let py = y + random(-3, 3);
  let vx = Math.cos(angle) * speed;
  let vy = Math.sin(angle) * speed;
  const steps = Math.ceil(duration / SAMPLE_MS);
  const dt = duration / steps / 1000;
  const keyframes: Keyframe[] = [];

  for (let i = 0; i <= steps; i++) {
    const t = i * dt;
    const progress = i / steps;
    const pop = 1 - (1 - Math.min(1, t / 0.14)) ** 3;
    const scale = (0.45 + 0.75 * pop) * (1 - 0.15 * progress) * (0.7 + depth * 0.3);
    const cos = Math.cos(flip.phase + flip.frequency * t);
    const flipX = Math.sign(cos || 1) * Math.max(Math.abs(cos), 0.14);
    const drift = Math.sin(sway.phase + sway.frequency * t) * sway.amplitude * (1 - Math.exp(-3 * t));
    const angleDeg = rotation + (spin * (1 - Math.exp(-1.4 * t))) / 1.4;
    const opacity = progress < 0.5 ? 1 : 1 - smoothstep((progress - 0.5) / 0.5);
    keyframes.push({
      transform: `translate(${(px + drift).toFixed(1)}px, ${py.toFixed(1)}px) rotate(${angleDeg.toFixed(1)}deg) scale(${(scale * flipX).toFixed(3)}, ${scale.toFixed(3)})`,
      opacity: opacity.toFixed(3),
    });

    // Exact step for linear air drag: velocity relaxes toward rest sideways and toward the terminal fall speed.
    const decay = Math.exp(-drag * dt);
    px += (vx * (1 - decay)) / drag;
    py += terminal * dt + ((vy - terminal) * (1 - decay)) / drag;
    vx *= decay;
    vy = terminal + (vy - terminal) * decay;
  }
  return { keyframes, duration };
}

function burstAt(x: number, y: number): void {
  const host = ensureLayer();
  host.style.viewTransitionName = LAYER_NAME;
  for (let i = 0; i < STARS_PER_BURST; i++) {
    const depth = random(0.35, 1);
    const size = 9 + depth * 9;
    const [core, edge] = STAR_COLORS[i % STAR_COLORS.length];
    const star = document.createElement('span');
    star.className = 'star-burst';
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.margin = `${-size / 2}px 0 0 ${-size / 2}px`;
    // The edge color reaches further in than on the ambient motes so each spark still reads
    // against the pale page background.
    star.style.background = `radial-gradient(circle, ${core} 0%, ${edge} 85%)`;
    host.append(star);

    const { keyframes, duration } = simulateFlight(x, y, depth);
    const flight = star.animate(keyframes, { duration, delay: random(0, 50), fill: 'backwards' });
    flights.add(flight);
    flight.finished
      .catch(() => {})
      .finally(() => {
        star.remove();
        flights.delete(flight);
        if (flights.size === 0) host.style.removeProperty('view-transition-name');
      });
  }
}

/** Freeze airborne stars while a view transition has the page frozen, and resume them once it plays. */
export function holdStarBurst(transition: ViewTransition): void {
  if (flights.size === 0) return;
  for (const flight of flights) flight.pause();
  const resume = () => {
    for (const flight of flights) flight.play();
  };
  transition.ready.then(resume, resume);
}

export function setupStarBurst(): void {
  const stopWhenDisabled = () => {
    if (!document.hidden && readMotionLevel() === 'lively') return;
    for (const flight of flights) flight.cancel();
    flights.clear();
    layer?.replaceChildren();
    layer?.style.removeProperty('view-transition-name');
  };
  subscribeMotionLevel(stopWhenDisabled);
  document.addEventListener('visibilitychange', stopWhenDisabled);
  document.addEventListener(
    'pointerdown',
    (event) => {
      if (event.button !== 0 || !event.isPrimary) return;
      const target = event.target;
      if (!(target instanceof Element) || !target.closest(INTERACTIVE) || target.closest(EXCLUDED)) return;
      if (document.hidden || readMotionLevel() !== 'lively') return;
      burstAt(event.clientX, event.clientY);
    },
    { passive: true },
  );
  document.addEventListener('astro:before-swap', (event) => holdStarBurst(event.viewTransition));
}
