/**
 * Four-point star geometry shared by the click burst and the morning-star motes.
 *
 * The shape is a sparkle with concave sides — the same silhouette as the morning star in
 * 爱弥斯's kit (专武「永远的启明星」). It is deliberately not a regular 8-point star: the
 * pinched sides are what make it read as "star" at 12px instead of "asterisk".
 */

export const STAR_VIEWBOX = { width: 24, height: 24 } as const;

/** Concave four-point star: tip at each axis, waist pulled toward the center. */
export const STAR_PATH =
  'M12 0C12.7 6.5 17.5 11.3 24 12C17.5 12.7 12.7 17.5 12 24C11.3 17.5 6.5 12.7 0 12C6.5 11.3 11.3 6.5 12 0Z';

/**
 * Burst colors, brightest first. All warm — the character is a Fusion resonator, so the
 * click sparkle stays gold/amber rather than the pink of the sakura petals it replaces.
 * Each entry is `[core, edge]` for the CSS gradient that fills a burst star.
 */
export const STAR_COLORS: ReadonlyArray<readonly [core: string, edge: string]> = [
  ['#fffdf5', '#ffd166'],
  ['#fff6dc', '#f0a92b'],
  ['#ffffff', '#ffe9a8'],
  ['#fff3c4', '#e89b1c'],
];

/** CSS mask for the burst stars, matching the canvas/sparkle silhouette. */
export const STAR_MASK = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${STAR_VIEWBOX.width} ${STAR_VIEWBOX.height}'><path d='${STAR_PATH}'/></svg>`,
)}")`;

/**
 * Draw the star into a canvas sprite.
 *
 * A soft halo is painted under the star: on a pale blog background a bare 12px gold star
 * disappears, and the halo is what makes the burst read as light rather than confetti.
 */
export function createStarSprite(core: string, edge: string, scale: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = Math.ceil(STAR_VIEWBOX.width * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.scale(scale, scale);

  const c = STAR_VIEWBOX.width / 2;
  const halo = ctx.createRadialGradient(c, c, 0, c, c, c);
  halo.addColorStop(0, `${edge}88`);
  halo.addColorStop(0.45, `${edge}33`);
  halo.addColorStop(1, `${edge}00`);
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, STAR_VIEWBOX.width, STAR_VIEWBOX.height);

  const fill = ctx.createRadialGradient(c, c, 0, c, c, c);
  fill.addColorStop(0, core);
  fill.addColorStop(1, edge);
  ctx.fillStyle = fill;
  ctx.fill(new Path2D(STAR_PATH));
  return canvas;
}
