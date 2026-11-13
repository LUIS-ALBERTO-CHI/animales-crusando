/* Generación y dibujo de la isla. Todo es vectorial (canvas 2D), sin imágenes.
   Isla vertical sobre acantilados, con playa abajo a la izquierda, escaleras,
   muelle, estanque con cascada, faro, huerto y la casa de la jugadora. */

export const T = 48; // tamaño de un tile en unidades del mundo
export const W = 46; // ancho del mapa en tiles
export const H = 43; // alto del mapa en tiles

export const enum Tile {
  Sea,
  Sand,
  Grass,
  Water, // estanque
  Stairs,
  Pier,
}

export interface Pt {
  x: number;
  y: number;
}

/* ---------- puntos de interés (coordenadas en tiles) ---------- */

export const HOUSE: Pt = { x: 10.5, y: 20.5 }; // base de la fachada (puerta)
export const START: Pt = { x: 10.5, y: 21.9 };
export const LOLA_START: Pt = { x: 12.7, y: 21.8 };
export const STAIRS_X = [21, 22];
export const STAIRS_Y = 29;
export const PIER_END: Pt = { x: 22.5, y: 40.2 };
export const POND: Pt & { rx: number; ry: number } = { x: 25.5, y: 15, rx: 3.4, ry: 2.3 };
export const WATERFALL: Pt = { x: 29.9, y: 15.4 };
export const LIGHTHOUSE: Pt = { x: 33.5, y: 25.5 };
const ORCHARD: Pt = { x: 32.5, y: 8 };
const ORANGES: Pt = { x: 37, y: 13.5 };

/** Paradas en orden. `side` indica dónde va el letrero respecto al vecino. */
export const STOPS: (Pt & { side: 1 | -1 })[] = [
  { x: 13.5, y: 9.5, side: 1 },
  { x: 27.5, y: 9, side: -1 },
  { x: 33.5, y: 18, side: -1 },
  { x: 18.5, y: 22.5, side: 1 },
  { x: 28.5, y: 26.5, side: -1 },
  // por si se añaden más virtudes en config.ts
  { x: 8.5, y: 14.5, side: 1 },
  { x: 21.5, y: 18.6, side: 1 },
  { x: 37, y: 21.5, side: -1 },
];

/** Puntos intermedios del camino de puntitos entre paradas (se suavizan). */
export const ROUTE_VIA: Pt[][] = [
  [{ x: 14.2, y: 20.6 }, { x: 15.4, y: 14.5 }], // inicio → 1
  [{ x: 18, y: 7.6 }, { x: 23.5, y: 8.4 }], // 1 → 2
  [{ x: 33.6, y: 11.6 }, { x: 35.4, y: 15 }], // 2 → 3
  [{ x: 28.5, y: 20.7 }, { x: 22.5, y: 21.4 }], // 3 → 4
  [{ x: 22, y: 26.4 }, { x: 25.5, y: 28.1 }], // 4 → 5
  [{ x: 24.6, y: 28.5 }, { x: 22, y: 28.7 }, { x: 22, y: 31.6 }], // 5 → muelle
];

/* ---------- utilidades ---------- */

export function hash(x: number, y: number, s = 0): number {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

export const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

function distSeg(p: Pt, a: Pt, b: Pt) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const l2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/** Curva Catmull-Rom que pasa por todos los puntos. */
export function smooth(pts: Pt[], steps = 8): Pt[] {
  if (pts.length < 3) return pts;
  const out: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let s = 0; s < steps; s++) {
      const t = s / steps, t2 = t * t, t3 = t2 * t;
      out.push({
        x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/** Tramos del camino: tramo i va de la parada i-1 (o la casa) a la parada i; el último va al muelle. */
export function buildRoute(nStops: number): Pt[][] {
  const legs: Pt[][] = [];
  let from: Pt = { x: START.x, y: START.y + 0.3 };
  for (let i = 0; i <= nStops; i++) {
    const last = i === nStops;
    const to: Pt = last ? { x: PIER_END.x, y: PIER_END.y - 0.8 } : { x: STOPS[i].x, y: STOPS[i].y + 0.9 };
    const via = last ? ROUTE_VIA[5] : (ROUTE_VIA[i] ?? []);
    legs.push(smooth([from, ...via, to]));
    from = to;
  }
  return legs;
}

/* ---------- objetos ---------- */

export type PropKind =
  | 'tree' | 'pine' | 'apple' | 'orange' | 'bush' | 'rock' | 'lamp' | 'fence' | 'crate'
  | 'easel' | 'bunting' | 'mailbox' | 'flower' | 'shell' | 'star' | 'lily' | 'islet' | 'searock';

export interface Prop {
  kind: PropKind;
  x: number; // centro en tiles
  y: number; // base (pies) en tiles
  v: number; // variación 0..1
  solid: number; // radio de colisión en tiles (0 = atravesable)
}

export interface World {
  tiles: Uint8Array;
  props: Prop[]; // con profundidad (se ordenan por y)
  decor: Prop[]; // planos en el suelo
  at(x: number, y: number): Tile;
}

export function buildWorld(nStops: number): World {
  const tiles = new Uint8Array(W * H);
  const at = (x: number, y: number): Tile => (x < 0 || y < 0 || x >= W || y >= H ? Tile.Sea : (tiles[y * W + x] as Tile));
  const set = (x: number, y: number, t: Tile) => {
    if (x >= 0 && y >= 0 && x < W && y < H) tiles[y * W + x] = t;
  };

  // 1) Meseta de hierba y playa
  const cx = 23, cy = 17.5, rx = 20, ry = 15;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
      const a = Math.atan2(ny, nx);
      const wob = 0.045 * Math.sin(3 * a + 1) + 0.03 * Math.sin(5 * a + 2) + 0.02 * Math.sin(9 * a);
      const d = Math.hypot(nx, ny) + wob;
      const beachZone = x <= 26 && y >= 30;
      if (d < 0.9 && !beachZone) set(x, y, Tile.Grass);
      else if (d < 1.14 && x <= 27 && y >= 29) set(x, y, Tile.Sand);
      else set(x, y, Tile.Sea);
    }

  // 2) Escaleras de piedra hacia la playa
  for (const x of STAIRS_X) set(x, STAIRS_Y, Tile.Stairs);

  // 3) Estanque
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const e = ((x + 0.5 - POND.x) / POND.rx) ** 2 + ((y + 0.5 - POND.y) / POND.ry) ** 2;
      if (e < 1 && at(x, y) === Tile.Grass) set(x, y, Tile.Water);
    }

  // 4) Muelle
  for (let y = 30; y < 41; y++) for (let x = 21; x <= 23; x++) if (at(x, y) === Tile.Sea) set(x, y, Tile.Pier);

  // 5) Objetos
  const props: Prop[] = [];
  const decor: Prop[] = [];
  const route = buildRoute(Math.min(nStops, STOPS.length)).flat();
  const nearRoute = (p: Pt, r: number) => {
    for (let i = 0; i < route.length - 1; i++) if (distSeg(p, route[i], route[i + 1]) < r) return true;
    return false;
  };
  const used = STOPS.slice(0, nStops);
  const reserved: Pt[] = [
    START, LOLA_START, { x: HOUSE.x, y: HOUSE.y - 1.5 }, LIGHTHOUSE, WATERFALL,
    ...used, ...used.map((s) => ({ x: s.x + s.side * 1.9, y: s.y + 0.4 })),
  ];
  const grassAt = (x: number, y: number) => at(x, y) === Tile.Grass;
  const occupied = new Set<number>();

  for (let y = 1; y < H - 1; y++)
    for (let x = 1; x < W - 1; x++) {
      const t = at(x, y);
      const c = { x: x + 0.5, y: y + 0.5 };
      const r = hash(x, y, 1);
      const nearRes = reserved.some((p) => dist(p, c) < 2.6);

      if (t === Tile.Grass) {
        let inner = true;
        for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (!grassAt(x + i, y + j)) inner = false;
        const orchard = dist(c, ORCHARD) < 3.4;
        const oranges = dist(c, ORANGES) < 2;
        const free = inner && !nearRes && !nearRoute(c, 1.5) && !occupied.has((y - 1) * W + x) && !occupied.has(y * W + x - 1) && !occupied.has((y - 1) * W + x - 1) && !occupied.has((y - 1) * W + x + 1);
        const density = orchard || oranges ? 0.5 : 0.2;
        if (free && r < density) {
          occupied.add(y * W + x);
          const kind: PropKind = orchard ? 'apple' : oranges ? 'orange' : hash(x, y, 2) < 0.42 ? 'pine' : hash(x, y, 2) < 0.85 ? 'tree' : 'bush';
          props.push({ kind, x: c.x + (hash(x, y, 3) - 0.5) * 0.3, y: y + 0.85, v: hash(x, y, 4), solid: kind === 'bush' ? 0.38 : 0.3 });
          continue;
        }
        // flores en grupitos
        if (!nearRoute(c, 0.7) && hash(x, y, 5) < 0.2) {
          const n = 1 + Math.floor(hash(x, y, 6) * 3);
          const col = hash(x, y, 7);
          for (let k = 0; k < n; k++)
            decor.push({ kind: 'flower', x: x + 0.2 + hash(x, y, 10 + k) * 0.6, y: y + 0.25 + hash(x, y, 20 + k) * 0.6, v: col, solid: 0 });
        }
      } else if (t === Tile.Sand && at(x, y - 1) !== Tile.Grass) {
        if (hash(x, y, 9) < 0.07) decor.push({ kind: hash(x, y, 12) < 0.5 ? 'shell' : 'star', x: c.x, y: c.y, v: hash(x, y, 11), solid: 0 });
        else if (r > 0.95 && !nearRoute(c, 1.2)) props.push({ kind: 'rock', x: c.x, y: y + 0.7, v: hash(x, y, 3), solid: 0.32 });
      } else if (t === Tile.Water && hash(x, y, 13) < 0.35) {
        decor.push({ kind: 'lily', x: c.x + (hash(x, y, 14) - 0.5) * 0.5, y: c.y + (hash(x, y, 15) - 0.5) * 0.4, v: hash(x, y, 16), solid: 0 });
      }
    }

  // Rocas grandes en la costa (como en la referencia)
  for (const [x, y] of [[6.6, 22.5], [9.5, 31.6], [31, 30.2], [38.6, 24.5], [5.8, 13]]) {
    if (at(Math.floor(x), Math.floor(y)) !== Tile.Sea) props.push({ kind: 'rock', x, y, v: 0.8, solid: 0.45 });
  }

  // Islotes lejanos y rocas en el mar (solo decoran: no se puede llegar)
  props.push({ kind: 'islet', x: 5.4, y: 5.4, v: 0.2, solid: 0 });
  props.push({ kind: 'islet', x: 41.4, y: 4.8, v: 0.8, solid: 0 });
  props.push({ kind: 'islet', x: 41.2, y: 34.2, v: 0.35, solid: 0 });
  for (const [x, y, v] of [[3.6, 27, 0.7], [33, 33.6, 0.9], [36.6, 31.3, 0.2], [43, 21, 0.6], [15, 2.4, 0.3], [9, 37.4, 0.8], [29.6, 36.6, 0.4], [3.2, 16.5, 0.1]]) {
    if (at(Math.floor(x), Math.floor(y)) === Tile.Sea) props.push({ kind: 'searock', x, y, v, solid: 0 });
  }

  // Vallas, cajas, farolas, caballete, banderines y buzón
  for (let i = 0; i < 3; i++) props.push({ kind: 'fence', x: 35.1 + i, y: 10.4, v: i === 0 ? 1 : 0, solid: 0.3 });
  for (let i = 0; i < 2; i++) props.push({ kind: 'fence', x: 34.6 + i * 0.95, y: 26.4, v: i === 0 ? 1 : 0, solid: 0.3 });
  props.push({ kind: 'crate', x: 29.7, y: 8.7, v: 0, solid: 0.38 });
  props.push({ kind: 'easel', x: 16.7, y: 22.2, v: 0, solid: 0.3 });
  props.push({ kind: 'bunting', x: 17.6, y: 20.9, v: 0, solid: 0 });
  props.push({ kind: 'mailbox', x: 13.2, y: 20.3, v: 0, solid: 0.22 });
  props.push({ kind: 'lamp', x: 7.8, y: 20.7, v: 0, solid: 0.15 });
  props.push({ kind: 'lamp', x: 20.2, y: 31.9, v: 0, solid: 0.15 });
  props.push({ kind: 'lamp', x: 24.8, y: 31.9, v: 0, solid: 0.15 });
  props.push({ kind: 'lamp', x: 30.8, y: 28, v: 0, solid: 0.15 });

  return { tiles, props, decor, at };
}

/* ---------- colisiones ---------- */

export const walkable = (t: Tile) => t === Tile.Grass || t === Tile.Sand || t === Tile.Stairs || t === Tile.Pier;
/** Nivel de altura: 1 meseta, 0 playa/muelle, -1 escalera (conecta ambos). */
export const level = (t: Tile) => (t === Tile.Stairs ? -1 : t === Tile.Sand || t === Tile.Pier || t === Tile.Sea ? 0 : 1);

export const HOUSE_BOX = { x0: HOUSE.x - 2.2, x1: HOUSE.x + 2.2, y0: HOUSE.y - 2.6, y1: HOUSE.y + 0.1 };
export const LIGHTHOUSE_R = 0.95;
export const WATERFALL_R = 1.1;

/* ---------- colores ---------- */

export const C = {
  foam: '#effcff',
  sand: '#f6e6bb',
  sandWet: '#e4cc93',
  grass: '#8fd067',
  grass2: '#86c95f',
  rock: '#b98b5f',
  rockDark: '#94693f',
  rockLine: '#a77a4f',
  water: '#6fd0e6',
  waterDeep: '#4fb8d4',
  wood: '#c99560',
  woodDark: '#9c6c3c',
  stone: '#d9d2c8',
  stoneDark: '#b5aca0',
};

/** Camino de puntitos blancos. */
export function drawRoute(ctx: CanvasRenderingContext2D, legs: Pt[][], active: number, time: number, scale = 1, all = false) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  legs.forEach((leg, i) => {
    if (i > active && !all) return;
    const done = i < active && !all;
    ctx.strokeStyle = done ? 'rgba(255,255,255,.4)' : '#ffffff';
    ctx.shadowColor = 'rgba(60,110,50,.35)';
    ctx.shadowOffsetY = 2 * scale;
    ctx.lineWidth = 7 * scale;
    ctx.setLineDash([8 * scale, 17 * scale]);
    ctx.lineDashOffset = done ? 0 : -time * 30 * scale;
    ctx.beginPath();
    leg.forEach((p, k) => (k ? ctx.lineTo(p.x * T, p.y * T) : ctx.moveTo(p.x * T, p.y * T)));
    ctx.stroke();
  });
  ctx.restore();
}

/* ---------- decoración plana ---------- */

const FLOWER_COLS = ['#ff8fab', '#ffffff', '#ffd45c', '#b58cff', '#ff7a6b', '#ffb3d1'];

export function drawDecor(ctx: CanvasRenderingContext2D, p: Prop, time: number) {
  const px = p.x * T, py = p.y * T;
  if (p.kind === 'flower') {
    const c = FLOWER_COLS[Math.floor(p.v * FLOWER_COLS.length)];
    const sway = Math.sin(time * 2 + px * 0.1) * 1.2;
    ctx.fillStyle = '#5ea045';
    ctx.beginPath(); ctx.ellipse(px - 3, py + 4, 4, 2, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = c;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      circle(ctx, px + sway + Math.cos(a) * 3.6, py + Math.sin(a) * 3.6, 3);
    }
    ctx.fillStyle = c === '#ffd45c' ? '#ff9f43' : '#ffd45c';
    circle(ctx, px + sway, py, 2.2);
  } else if (p.kind === 'shell') {
    ctx.fillStyle = p.v > 0.5 ? '#ffc7c7' : '#fff1dc';
    ctx.beginPath();
    ctx.moveTo(px - 7, py + 3);
    ctx.quadraticCurveTo(px, py - 10, px + 7, py + 3);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(180,120,100,.5)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(px, py + 3); ctx.lineTo(px, py - 4); ctx.moveTo(px - 3.5, py + 3); ctx.lineTo(px - 2, py - 2); ctx.moveTo(px + 3.5, py + 3); ctx.lineTo(px + 2, py - 2); ctx.stroke();
  } else if (p.kind === 'star') {
    ctx.fillStyle = '#f2875a';
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2 + p.v;
      const r = i % 2 ? 3.5 : 9;
      ctx.lineTo(px + Math.cos(a) * r, py + Math.sin(a) * r * 0.8);
    }
    ctx.fill();
  } else if (p.kind === 'lily') {
    const bob = Math.sin(time * 1.5 + p.v * 9) * 1.5;
    ctx.fillStyle = '#5fae5a';
    ctx.beginPath();
    ctx.moveTo(px, py + bob);
    ctx.arc(px, py + bob, 9, 0.5, Math.PI * 2 - 0.1);
    ctx.fill();
    if (p.v > 0.55) {
      ctx.fillStyle = '#ff9fc0';
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath(); ctx.ellipse(px + Math.cos(a) * 3, py + bob - 3 + Math.sin(a) * 2, 3.5, 2, a, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#ffe07a';
      circle(ctx, px, py + bob - 3, 2);
    }
  }
}

/* ---------- objetos con profundidad ---------- */

export function drawProp(ctx: CanvasRenderingContext2D, p: Prop, time: number, night: number) {
  const px = p.x * T, py = p.y * T;
  const sway = Math.sin(time * 1.2 + p.v * 9) * 1.4;
  switch (p.kind) {
    case 'fence': {
      ctx.fillStyle = C.woodDark;
      roundRect(ctx, px - T / 2 - 1, py - 26, 8, 28, 3);
      if (p.v) roundRect(ctx, px + T / 2 - 7, py - 26, 8, 28, 3);
      ctx.fillStyle = C.wood;
      roundRect(ctx, px - T / 2, py - 22, T, 6, 3);
      roundRect(ctx, px - T / 2, py - 11, T, 6, 3);
      ctx.fillStyle = C.woodDark;
      roundRect(ctx, px + T / 2 - 4, py - 26, 8, 28, 3);
      break;
    }
    case 'crate': {
      shadow(ctx, px, py, 18, 5);
      ctx.fillStyle = '#b07d4a';
      roundRect(ctx, px - 17, py - 24, 34, 24, 3);
      ctx.fillStyle = '#c99560';
      ctx.fillRect(px - 15, py - 20, 30, 5);
      ctx.fillRect(px - 15, py - 10, 30, 5);
      ctx.fillStyle = '#e8424f';
      for (const [ax, ay] of [[-9, -27], [0, -29], [9, -27], [-4, -33], [5, -33]]) circle(ctx, px + ax, py + ay, 5);
      break;
    }
    case 'easel': {
      shadow(ctx, px, py, 16, 5);
      ctx.strokeStyle = '#9c6c3c';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(px - 12, py); ctx.lineTo(px - 2, py - 50);
      ctx.moveTo(px + 12, py); ctx.lineTo(px + 2, py - 50);
      ctx.moveTo(px, py - 4); ctx.lineTo(px, py - 30);
      ctx.stroke();
      ctx.fillStyle = '#fffdf6';
      roundRect(ctx, px - 16, py - 54, 32, 28, 2);
      ctx.fillStyle = '#ff8fab';
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        circle(ctx, px + Math.cos(a) * 5, py - 40 + Math.sin(a) * 5, 4);
      }
      ctx.fillStyle = '#ffd45c';
      circle(ctx, px, py - 40, 3);
      ctx.fillStyle = '#6cbf5e';
      ctx.fillRect(px - 1, py - 34, 2, 7);
      break;
    }
    case 'bunting': {
      const x0 = px - 70, x1 = px + 70, top = py - 66;
      ctx.fillStyle = C.woodDark;
      roundRect(ctx, x0 - 3, top, 6, 66, 3);
      roundRect(ctx, x1 - 3, top, 6, 66, 3);
      ctx.strokeStyle = '#8a6a50';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x0, top + 4); ctx.quadraticCurveTo(px, top + 24, x1, top + 4); ctx.stroke();
      const cols = ['#ff8fab', '#7fd3e3', '#ffd45c', '#9fdc7c', '#c49bff'];
      for (let i = 1; i < 9; i++) {
        const t = i / 9;
        const fx = x0 + (x1 - x0) * t;
        const fy = top + 4 + 4 * 20 * t * (1 - t) + Math.sin(time * 3 + i) * 0.8;
        ctx.fillStyle = cols[i % cols.length];
        ctx.beginPath(); ctx.moveTo(fx - 7, fy); ctx.lineTo(fx + 7, fy); ctx.lineTo(fx, fy + 14); ctx.fill();
      }
      break;
    }
    case 'lamp': {
      shadow(ctx, px, py, 8, 3);
      ctx.fillStyle = '#4f4757';
      roundRect(ctx, px - 2.5, py - 44, 5, 44, 2);
      roundRect(ctx, px - 8, py - 58, 16, 16, 4);
      ctx.fillStyle = night > 0.05 ? `rgba(255,224,140,${0.6 + night * 0.4})` : '#ffe9a8';
      roundRect(ctx, px - 5.5, py - 55, 11, 10, 3);
      if (night > 0.05) glow(ctx, px, py - 50, 60, night);
      break;
    }
    case 'mailbox': {
      shadow(ctx, px, py, 9, 3);
      ctx.fillStyle = '#8b6440';
      ctx.fillRect(px - 2.5, py - 22, 5, 22);
      ctx.fillStyle = '#d9474f';
      roundRect(ctx, px - 12, py - 37, 24, 17, 7);
      ctx.fillStyle = '#b8343c';
      ctx.fillRect(px - 12, py - 25, 24, 5);
      ctx.fillStyle = '#ffd45c';
      ctx.fillRect(px + 9, py - 42, 3, 11);
      break;
    }
    default:
      break;
  }
}

/** Letrero de madera con el nombre de la virtud. */
export function drawSign(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, done: boolean) {
  const px = x * T, py = y * T;
  ctx.font = '600 15px Fredoka, Nunito, sans-serif';
  const tw = ctx.measureText(text).width;
  const bw = tw + 44, bh = 28;
  shadow(ctx, px, py, bw / 2 - 6, 5);
  ctx.fillStyle = C.woodDark;
  roundRect(ctx, px - bw / 2 + 12, py - 34, 6, 34, 2);
  roundRect(ctx, px + bw / 2 - 18, py - 34, 6, 34, 2);
  ctx.fillStyle = '#8b5e34';
  roundRect(ctx, px - bw / 2, py - 56 + 3, bw, bh, 12);
  ctx.fillStyle = '#e6b47a';
  roundRect(ctx, px - bw / 2, py - 56, bw, bh, 12);
  ctx.fillStyle = '#f0c590';
  roundRect(ctx, px - bw / 2 + 4, py - 53, bw - 8, 6, 3);
  leaf(ctx, px - bw / 2 + 12, py - 42, -1);
  leaf(ctx, px + bw / 2 - 12, py - 42, 1);
  ctx.fillStyle = '#5b3a22';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, px, py - 41);
  if (done) {
    ctx.fillStyle = '#ef6f82';
    heart(ctx, px + bw / 2 - 2, py - 58, 7);
  }
}

export function leaf(ctx: CanvasRenderingContext2D, x: number, y: number, dir: number) {
  ctx.fillStyle = '#6aa84f';
  ctx.beginPath(); ctx.ellipse(x, y - 3, 2.6, 5, dir * 0.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + dir * 2, y + 4, 2.4, 4.5, dir * 1.1, 0, Math.PI * 2); ctx.fill();
}

/** Disco de piedra de cada parada. */
export function drawMarker(ctx: CanvasRenderingContext2D, x: number, y: number, state: 'next' | 'locked' | 'done', time: number) {
  const px = x * T, py = y * T;
  if (state === 'next') {
    const k = 0.5 + 0.5 * Math.sin(time * 3);
    ctx.fillStyle = `rgba(255,255,255,${0.25 + k * 0.25})`;
    ctx.beginPath(); ctx.ellipse(px, py, 26 + k * 6, 11 + k * 2.5, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#cfc4b4';
  ctx.beginPath(); ctx.ellipse(px, py + 2, 17, 7.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f7f1e6';
  ctx.beginPath(); ctx.ellipse(px, py, 17, 7, 0, 0, Math.PI * 2); ctx.fill();
  if (state === 'done') drawShell(ctx, px, py - 3, 0.45, time);
}

/** Concha de luz (premio de cada parada). */
export function drawShell(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, time: number) {
  glow(ctx, x, y, 34 * s, 0.6 + Math.sin(time * 3) * 0.2);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = '#ffd9e6';
  ctx.beginPath();
  ctx.moveTo(-20, 8);
  for (let i = 0; i <= 6; i++) {
    const a = Math.PI + (i / 6) * Math.PI;
    ctx.quadraticCurveTo(Math.cos(a - 0.26) * 24, Math.sin(a - 0.26) * 24 - 2, Math.cos(a) * 21, Math.sin(a) * 21);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#f3a9c2';
  ctx.lineWidth = 2;
  for (let i = 1; i < 6; i++) {
    const a = Math.PI + (i / 6) * Math.PI;
    ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(Math.cos(a) * 19, Math.sin(a) * 19); ctx.stroke();
  }
  ctx.fillStyle = '#fff8e8';
  ctx.beginPath(); ctx.ellipse(0, 9, 20, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  circle(ctx, 0, 4, 5);
  ctx.restore();
}

/* ---------- edificios y lugares especiales ---------- */

export function drawHouse(ctx: CanvasRenderingContext2D, time: number, night: number) {
  const bx = HOUSE.x * T, by = HOUSE.y * T;
  shadow(ctx, bx, by, 112, 14);
  // humo de la chimenea
  for (let i = 0; i < 3; i++) {
    const k = (time * 0.35 + i / 3) % 1;
    ctx.fillStyle = `rgba(255,255,255,${0.75 * (1 - k)})`;
    circle(ctx, bx + 58 + Math.sin(k * 6 + i) * 6, by - 178 - k * 60, 8 + k * 12);
  }
  ctx.fillStyle = '#d6cfc4';
  roundRect(ctx, bx + 46, by - 178, 24, 46, 3);
  ctx.fillStyle = '#e6dfd4';
  roundRect(ctx, bx + 43, by - 182, 30, 9, 3);
  // paredes de piedra crema
  ctx.fillStyle = '#f6ecd8';
  roundRect(ctx, bx - 94, by - 104, 188, 104, 8);
  ctx.fillStyle = '#e9dcc3';
  for (let r = 0; r < 5; r++)
    for (let c = 0; c < 7; c++)
      if (hash(r, c, 3) < 0.35) roundRect(ctx, bx - 88 + c * 26 + (r % 2) * 10, by - 98 + r * 19, 18, 9, 3);
  ctx.fillStyle = '#d9c9ab';
  ctx.fillRect(bx - 94, by - 12, 188, 12);
  // tejado de tejas rojas
  ctx.fillStyle = '#b8483c';
  ctx.beginPath();
  ctx.moveTo(bx - 118, by - 88);
  ctx.lineTo(bx - 70, by - 166);
  ctx.lineTo(bx + 70, by - 166);
  ctx.lineTo(bx + 118, by - 88);
  ctx.closePath();
  ctx.fill();
  for (let r = 0; r < 4; r++) {
    const yy = by - 160 + r * 19;
    const half = 70 + (r + 1) * 12;
    ctx.fillStyle = r % 2 ? '#d65f4e' : '#cc5545';
    for (let xx = -half; xx < half; xx += 18) {
      ctx.beginPath();
      ctx.ellipse(bx + xx + 9, yy + 10, 10, 9, 0, 0, Math.PI);
      ctx.fill();
    }
  }
  ctx.fillStyle = '#a63d33';
  roundRect(ctx, bx - 72, by - 172, 144, 10, 5);
  // ventanas con luz cálida
  for (const sx of [-58, 58]) {
    ctx.fillStyle = '#8b5e34';
    roundRect(ctx, bx + sx - 19, by - 82, 38, 36, 6);
    ctx.fillStyle = night > 0.05 ? '#ffd56b' : '#ffe9a8';
    roundRect(ctx, bx + sx - 15, by - 78, 30, 28, 4);
    ctx.fillStyle = '#8b5e34';
    ctx.fillRect(bx + sx - 1, by - 78, 2, 28);
    ctx.fillRect(bx + sx - 15, by - 65, 30, 2);
    ctx.fillStyle = '#9c6c3c';
    roundRect(ctx, bx + sx - 22, by - 46, 44, 9, 3);
    ctx.fillStyle = '#5ea045';
    roundRect(ctx, bx + sx - 20, by - 52, 40, 7, 3);
    for (let k = 0; k < 5; k++) {
      ctx.fillStyle = k % 2 ? '#ffffff' : '#ff8fab';
      circle(ctx, bx + sx - 16 + k * 8, by - 51, 3.6);
    }
    if (night > 0.05) glow(ctx, bx + sx, by - 64, 46, night * 0.8);
  }
  // puerta en arco
  ctx.fillStyle = '#7a4d2a';
  ctx.beginPath(); ctx.roundRect(bx - 20, by - 66, 40, 66, [20, 20, 0, 0]); ctx.fill();
  ctx.fillStyle = '#a8703f';
  ctx.beginPath(); ctx.roundRect(bx - 16, by - 62, 32, 62, [16, 16, 0, 0]); ctx.fill();
  ctx.strokeStyle = '#8b5a30';
  ctx.lineWidth = 2;
  for (const dx of [-6, 6]) { ctx.beginPath(); ctx.moveTo(bx + dx, by - 56); ctx.lineTo(bx + dx, by - 2); ctx.stroke(); }
  ctx.fillStyle = '#ffd45c';
  circle(ctx, bx + 10, by - 28, 2.6);
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath(); ctx.roundRect(bx - 8, by - 56, 16, 12, [8, 8, 2, 2]); ctx.fill();
  // farolillo junto a la puerta
  ctx.fillStyle = '#4f4757';
  roundRect(ctx, bx + 24, by - 74, 10, 14, 3);
  ctx.fillStyle = '#ffe08a';
  roundRect(ctx, bx + 26, by - 72, 6, 9, 2);
  // escalón
  ctx.fillStyle = '#d9d2c8';
  roundRect(ctx, bx - 26, by - 4, 52, 10, 4);
}

export function drawLighthouse(ctx: CanvasRenderingContext2D, time: number, night: number) {
  const px = LIGHTHOUSE.x * T, py = LIGHTHOUSE.y * T;
  shadow(ctx, px, py, 40, 11);
  ctx.fillStyle = '#e8e2d8';
  ctx.beginPath(); ctx.ellipse(px, py - 6, 38, 13, 0, 0, Math.PI * 2); ctx.fill();
  // torre a rayas
  const top = py - 120, wb = 30, wt = 21;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(px - wb, py - 8); ctx.lineTo(px - wt, top); ctx.lineTo(px + wt, top); ctx.lineTo(px + wb, py - 8); ctx.closePath();
  ctx.fillStyle = '#fbf7f0';
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = '#dd4b45';
  for (let i = 0; i < 3; i++) ctx.fillRect(px - 40, top + 14 + i * 36, 80, 16);
  ctx.fillStyle = 'rgba(0,0,0,.07)';
  ctx.fillRect(px + 6, top, 40, 130);
  ctx.restore();
  // puerta
  ctx.fillStyle = '#8b5e34';
  ctx.beginPath(); ctx.roundRect(px - 9, py - 34, 18, 26, [9, 9, 0, 0]); ctx.fill();
  // balcón y linterna
  ctx.fillStyle = '#4f4757';
  roundRect(ctx, px - 29, top - 6, 58, 8, 3);
  ctx.fillStyle = night > 0.05 ? '#ffe58a' : '#fff2b8';
  roundRect(ctx, px - 16, top - 30, 32, 24, 4);
  ctx.strokeStyle = '#4f4757';
  ctx.lineWidth = 2;
  for (const dx of [-6, 6]) { ctx.beginPath(); ctx.moveTo(px + dx, top - 30); ctx.lineTo(px + dx, top - 6); ctx.stroke(); }
  ctx.fillStyle = '#dd4b45';
  ctx.beginPath(); ctx.moveTo(px - 22, top - 28); ctx.lineTo(px, top - 50); ctx.lineTo(px + 22, top - 28); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#4f4757';
  circle(ctx, px, top - 52, 3.5);
  const beam = night > 0.05 ? night : 0.35;
  glow(ctx, px, top - 18, 70, beam * (0.7 + 0.3 * Math.sin(time * 2)));
}

export function drawWaterfall(ctx: CanvasRenderingContext2D, time: number) {
  const px = WATERFALL.x * T, py = WATERFALL.y * T;
  // peñasco
  ctx.fillStyle = '#94693f';
  ctx.beginPath(); ctx.roundRect(px - 40, py - 74, 80, 78, 20); ctx.fill();
  ctx.fillStyle = '#b98b5f';
  ctx.beginPath(); ctx.roundRect(px - 40, py - 80, 80, 66, 20); ctx.fill();
  ctx.fillStyle = '#8fd067';
  ctx.beginPath(); ctx.ellipse(px, py - 80, 42, 14, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#a77a4f';
  roundRect(ctx, px + 12, py - 50, 18, 8, 4);
  roundRect(ctx, px - 30, py - 36, 14, 7, 3);
  // agua cayendo
  ctx.fillStyle = '#9fe3f2';
  ctx.fillRect(px - 26, py - 82, 24, 82);
  ctx.strokeStyle = 'rgba(255,255,255,.85)';
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 4; i++) {
    const lx = px - 23 + i * 6;
    const off = (time * 90 + i * 23) % 40;
    ctx.beginPath(); ctx.moveTo(lx, py - 82 + off); ctx.lineTo(lx, py - 66 + off); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(lx, py - 42 + off * 0.9); ctx.lineTo(lx, py - 30 + off * 0.9); ctx.stroke();
  }
  // espuma abajo
  ctx.fillStyle = 'rgba(255,255,255,.9)';
  for (let i = 0; i < 5; i++) circle(ctx, px - 30 + i * 8, py + 2 + Math.sin(time * 6 + i) * 2, 6 + Math.sin(time * 5 + i * 2) * 1.5);
}

/* ---------- primitivas ---------- */

export function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2);
  ctx.fill();
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

export function shadow(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number) {
  ctx.fillStyle = 'rgba(40,70,40,.2)';
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, a: number) {
  const g = ctx.createRadialGradient(x, y, 1, x, y, r);
  g.addColorStop(0, `rgba(255,226,140,${0.55 * a})`);
  g.addColorStop(1, 'rgba(255,226,140,0)');
  ctx.fillStyle = g;
  circle(ctx, x, y, r);
}

export function heart(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.6, y - s * 0.1, x - s * 0.9, y - s * 1.3, x, y - s * 0.45);
  ctx.bezierCurveTo(x + s * 0.9, y - s * 1.3, x + s * 1.6, y - s * 0.1, x, y + s * 0.9);
  ctx.fill();
}
