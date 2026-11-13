/* Dibujo del terreno: mar, playa, acantilados, hierba, estanque, escaleras y muelle.
   Cada capa se pinta como una sola figura (unión de círculos) para que los bordes
   queden redondeados y sin costuras entre casillas. */

import { T, W, H, Tile, hash, circle, roundRect, type World } from './world';

const TAU = Math.PI * 2;
const high = (t: Tile) => t === Tile.Grass || t === Tile.Water;
const cliffTop = (t: Tile) => high(t) || t === Tile.Stairs;
const land = (t: Tile) => t !== Tile.Sea && t !== Tile.Pier;

/** La fila de arena pegada al acantilado queda tapada por la pared de roca: no se pisa. */
export const underCliff = (w: World, x: number, y: number) => w.at(x, y) === Tile.Sand && high(w.at(x, y - 1));

const G = {
  grass: '#94d560',
  grassLight: 'rgba(182,232,120,.3)',
  grassDark: 'rgba(84,168,70,.13)',
  lip: '#5aa845',
  blade: '#67b54c',
  rockBase: '#7a5232',
  rock: '#a87548',
  rockTop: '#c4925f',
  stoneLight: '#d6a877',
  stoneMid: '#b98858',
  stoneDark: '#8c6039',
  sand: '#f8e8bf',
  sandWet: '#e3c98c',
  sandDot: '#e9d3a0',
  pondRim: '#6fb04e',
  pondDeep: '#3fa8cf',
  pond: '#6ccfe8',
  wood: '#c99560',
  woodDark: '#9c6c3c',
};

export function drawTerrain(ctx: CanvasRenderingContext2D, w: World, rx0: number, ry0: number, rx1: number, ry1: number, time: number) {
  const x0 = Math.max(0, rx0), y0 = Math.max(0, ry0), x1 = Math.min(W - 1, rx1), y1 = Math.min(H - 1, ry1);
  const each = (fn: (x: number, y: number, t: Tile) => void) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) fn(x, y, w.at(x, y));
  };
  /** Rellena de una vez la unión de un círculo por casilla seleccionada. */
  const blob = (color: string, sel: (t: Tile) => boolean, r: number, dy = 0) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    each((x, y, t) => {
      if (!sel(t)) return;
      const cx = (x + 0.5) * T, cy = (y + 0.5 + dy) * T;
      ctx.moveTo(cx + r * T, cy);
      ctx.arc(cx, cy, r * T, 0, TAU);
    });
    ctx.fill();
  };

  // agua poco profunda alrededor de la isla
  blob('rgba(150,232,238,.42)', land, 1.9, 0.3);
  blob('rgba(196,246,244,.5)', land, 1.32, 0.3);

  // olitas (también fuera del mapa, para que el mar de la portada no quede plano)
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  const wx0 = Math.max(-14, rx0), wx1 = Math.min(W + 14, rx1), wy0 = Math.max(-10, ry0), wy1 = Math.min(H + 10, ry1);
  for (let y = wy0; y <= wy1; y++)
    for (let x = wx0; x <= wx1; x++) {
      if (w.at(x, y) !== Tile.Sea || hash(x, y, 40) > 0.24) continue;
      const ph = time * 1.3 + hash(x, y, 41) * TAU;
      const px = (x + hash(x, y, 42)) * T + Math.sin(ph) * 5, py = (y + hash(x, y, 43)) * T;
      ctx.globalAlpha = (0.45 + 0.45 * Math.sin(ph)) * 0.8;
      ctx.beginPath();
      ctx.moveTo(px - 13, py);
      ctx.quadraticCurveTo(px - 6, py - 7, px, py);
      ctx.quadraticCurveTo(px + 6, py - 6, px + 12, py);
      ctx.stroke();
    }
  ctx.globalAlpha = 1;

  // espuma que respira en la orilla
  ctx.fillStyle = 'rgba(255,255,255,.9)';
  ctx.beginPath();
  each((x, y, t) => {
    if (!land(t)) return;
    const hi = high(t) ? 1 : 0;
    const cx = (x + 0.5) * T, cy = (y + 0.5 + hi * 0.52) * T;
    const r = T * (0.86 + hi * 0.06 + 0.05 * Math.sin(time * 2 + x * 0.7 + y * 0.4));
    ctx.moveTo(cx + r, cy);
    ctx.arc(cx, cy, r, 0, TAU);
  });
  ctx.fill();

  // arena
  blob(G.sandWet, (t) => t === Tile.Sand, 0.78, 0.09);
  blob(G.sand, (t) => t === Tile.Sand, 0.76);
  ctx.fillStyle = G.sandDot;
  each((x, y, t) => {
    if (t !== Tile.Sand) return;
    for (let k = 0; k < 3; k++) circle(ctx, (x + hash(x, y, 50 + k)) * T, (y + hash(x, y, 54 + k)) * T, 1.6 + hash(x, y, 58 + k) * 1.4);
  });

  // acantilado: base en sombra, roca y franja alta más clara
  blob(G.rockBase, cliffTop, 0.74, 0.86);
  blob(G.rock, cliffTop, 0.74, 0.68);
  blob(G.rockTop, cliffTop, 0.74, 0.36);
  // sillares de piedra en la pared que mira al sur
  each((x, y, t) => {
    if (!cliffTop(t) || cliffTop(w.at(x, y + 1))) return;
    const bx = x * T, by = (y + 1) * T;
    for (let k = 0; k < 3; k++) {
      const h = hash(x, y, 80 + k);
      const sw = 14 + h * 13;
      ctx.fillStyle = k === 2 ? G.stoneDark : h < 0.5 ? G.stoneLight : G.stoneMid;
      roundRect(ctx, bx + 3 + hash(x, y, 84 + k) * (T - 6 - sw), by + 8 + k * 11 + h * 3, sw, 8.5, 4);
    }
  });

  // hierba: labio en sombra, césped y flecos que cuelgan sobre la roca
  blob(G.lip, high, 0.74, 0.13);
  blob(G.grass, high, 0.74);
  ctx.fillStyle = G.grass;
  each((x, y, t) => {
    if (!high(t) || cliffTop(w.at(x, y + 1))) return;
    for (let k = 0; k < 3; k++) circle(ctx, x * T + 8 + k * 16, (y + 1) * T, 6 + hash(x, y, 70 + k) * 3.5);
  });
  // manchas suaves de luz y sombra, y briznas
  each((x, y, t) => {
    if (t !== Tile.Grass) return;
    const inner = high(w.at(x - 1, y)) && high(w.at(x + 1, y)) && high(w.at(x, y - 1)) && high(w.at(x, y + 1));
    const h = hash(x, y, 60);
    if (inner && (h < 0.3 || h > 0.8)) {
      ctx.fillStyle = h < 0.3 ? G.grassLight : G.grassDark;
      ctx.beginPath();
      ctx.ellipse((x + 0.3 + hash(x, y, 64) * 0.4) * T, (y + 0.5) * T, T * (0.5 + hash(x, y, 65) * 0.3), T * (0.26 + hash(x, y, 66) * 0.16), 0, 0, TAU);
      ctx.fill();
    }
    if (hash(x, y, 61) < 0.3) {
      const px = (x + 0.2 + hash(x, y, 62) * 0.6) * T, py = (y + 0.35 + hash(x, y, 63) * 0.5) * T;
      ctx.strokeStyle = G.blade;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(px - 5, py - 5); ctx.lineTo(px - 1.5, py + 2);
      ctx.moveTo(px, py - 7); ctx.lineTo(px, py + 2);
      ctx.moveTo(px + 5, py - 4); ctx.lineTo(px + 1.5, py + 2);
      ctx.stroke();
    }
  });

  // estanque
  const water = (t: Tile) => t === Tile.Water;
  blob(G.pondRim, water, 0.84, 0.05);
  blob(G.pondDeep, water, 0.76, 0.07);
  blob(G.pond, water, 0.73);
  ctx.strokeStyle = 'rgba(255,255,255,.65)';
  ctx.lineWidth = 2;
  each((x, y, t) => {
    if (t !== Tile.Water || hash(x, y, 90) > 0.5) return;
    const k = (time * 0.5 + hash(x, y, 91)) % 1;
    ctx.globalAlpha = 1 - k;
    ctx.beginPath();
    ctx.ellipse((x + 0.5) * T, (y + 0.5) * T, 4 + k * 14, 2 + k * 6, 0, 0, TAU);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;

  // escaleras de piedra: bajan toda la pared hasta la arena
  each((x, y, t) => {
    if (t !== Tile.Stairs) return;
    const top = y * T - 6, n = 7, sh = (T * 2 + 6) / n;
    ctx.fillStyle = '#9d948a';
    ctx.fillRect(x * T - 3, top, T + 6, T * 2 + 12);
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = i % 2 ? '#e6e0d6' : '#d8d1c6';
      roundRect(ctx, x * T, top + i * sh, T, sh - 4, 3);
      ctx.fillStyle = '#b5aca0';
      ctx.fillRect(x * T, top + i * sh + sh - 5, T, 2);
    }
  });

  // muelle
  each((x, y, t) => {
    if (t !== Tile.Pier) return;
    ctx.fillStyle = 'rgba(30,90,110,.25)';
    ctx.fillRect(x * T, y * T + 12, T, T);
    ctx.fillStyle = G.woodDark;
    ctx.fillRect(x * T - 0.5, y * T, T + 1, T + 4);
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = (i + x) % 2 ? G.wood : '#d3a26d';
      roundRect(ctx, x * T + 1, y * T + i * 12 + 1, T - 2, 10, 2);
    }
    const left = w.at(x - 1, y) !== Tile.Pier, right = w.at(x + 1, y) !== Tile.Pier;
    if ((left || right) && y % 2 === 0) {
      const px = left ? x * T - 4 : (x + 1) * T - 8;
      ctx.fillStyle = '#7d5530';
      roundRect(ctx, px, y * T - 12, 12, 30, 4);
      ctx.fillStyle = '#b98a55';
      roundRect(ctx, px, y * T - 14, 12, 8, 4);
    }
  });
}
