/* Vegetación, rocas e islotes con volumen: copa con sombra por debajo y luz arriba
   a la izquierda, como figuritas de arcilla. El resto de objetos (vallas, farolas,
   caballete...) siguen en world.ts y se delegan a drawProp. */

import { T, circle, roundRect, shadow, glow, drawProp, type Prop } from './world';

const TAU = Math.PI * 2;
const LEAF = [
  ['#2f8a4a', '#48a85a', '#6cc66a', '#a6e58c'],
  ['#2c8556', '#45a368', '#68c079', '#a2e2a0'],
  ['#3b9440', '#57b24e', '#7ecf5e', '#b9ec88'],
];

function ell(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, TAU);
  ctx.fill();
}

/** Árbol de copa redonda; `fruit` añade manzanas o naranjas. */
function tree(ctx: CanvasRenderingContext2D, px: number, py: number, s: number, v: number, sway: number, fruit?: string) {
  const pal = LEAF[Math.floor(v * 2.99)];
  // tronco con raíces
  ctx.fillStyle = '#7d5230';
  ell(ctx, px, py - 2 * s, 15 * s, 6 * s);
  roundRect(ctx, px - 9 * s, py - 34 * s, 18 * s, 34 * s, 6 * s);
  ctx.fillStyle = '#a06c3f';
  roundRect(ctx, px - 9 * s, py - 34 * s, 9 * s, 30 * s, 5 * s);
  ctx.fillStyle = '#b98455';
  roundRect(ctx, px - 6 * s, py - 30 * s, 3.5 * s, 20 * s, 2 * s);
  const x = px + sway * s;
  ctx.fillStyle = pal[0];
  circle(ctx, x, py - 50 * s, 34 * s);
  circle(ctx, x - 25 * s, py - 42 * s, 21 * s);
  circle(ctx, x + 25 * s, py - 42 * s, 21 * s);
  ctx.fillStyle = pal[1];
  circle(ctx, x - 2 * s, py - 56 * s, 32 * s);
  circle(ctx, x - 24 * s, py - 48 * s, 18 * s);
  circle(ctx, x + 22 * s, py - 49 * s, 18 * s);
  ctx.fillStyle = pal[2];
  circle(ctx, x - 8 * s, py - 66 * s, 22 * s);
  circle(ctx, x + 13 * s, py - 62 * s, 15 * s);
  circle(ctx, x - 24 * s, py - 54 * s, 11 * s);
  ctx.fillStyle = pal[3];
  ell(ctx, x - 13 * s, py - 75 * s, 10 * s, 7 * s, -0.5);
  circle(ctx, x + 5 * s, py - 79 * s, 4 * s);
  if (!fruit) return;
  for (const [ax, ay] of [[-22, -44], [14, -40], [22, -62], [-5, -55], [-24, -66], [4, -78], [-2, -34]]) {
    ctx.fillStyle = 'rgba(40,70,30,.25)';
    circle(ctx, x + ax * s + 1, py + ay * s + 2, 7.5 * s);
    ctx.fillStyle = fruit;
    circle(ctx, x + ax * s, py + ay * s, 7.5 * s);
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    circle(ctx, x + (ax - 2.4) * s, py + (ay - 2.6) * s, 2.2 * s);
  }
}

/** Pino de pisos redondeados, con la mitad izquierda iluminada. */
function pine(ctx: CanvasRenderingContext2D, px: number, py: number, s: number, sway: number) {
  ctx.fillStyle = '#7d5230';
  roundRect(ctx, px - 6 * s, py - 20 * s, 12 * s, 22 * s, 4 * s);
  ctx.fillStyle = '#a06c3f';
  roundRect(ctx, px - 6 * s, py - 20 * s, 6 * s, 20 * s, 3 * s);
  const tiers = [[-12, 33, 30], [-36, 27, 28], [-59, 21, 26], [-80, 14, 22]];
  tiers.forEach(([oy, hw, hh], i) => {
    const x = px + sway * (i / 3) * s, base = py + oy * s, tip = base - hh * s;
    ctx.fillStyle = '#2a7f55';
    ctx.beginPath();
    ctx.moveTo(x - hw * s, base);
    ctx.quadraticCurveTo(x, base + 12 * s, x + hw * s, base);
    ctx.quadraticCurveTo(x + hw * 0.3 * s, base - hh * 0.6 * s, x, tip);
    ctx.quadraticCurveTo(x - hw * 0.3 * s, base - hh * 0.6 * s, x - hw * s, base);
    ctx.fill();
    ctx.fillStyle = '#46a56c';
    ctx.beginPath();
    ctx.moveTo(x - hw * s, base);
    ctx.quadraticCurveTo(x - hw * 0.4 * s, base + 8 * s, x + hw * 0.15 * s, base + 5 * s);
    ctx.quadraticCurveTo(x + hw * 0.05 * s, base - hh * 0.6 * s, x, tip);
    ctx.quadraticCurveTo(x - hw * 0.3 * s, base - hh * 0.6 * s, x - hw * s, base);
    ctx.fill();
    ctx.fillStyle = '#7fd08f';
    ell(ctx, x - hw * 0.42 * s, base - hh * 0.3 * s, hw * 0.16 * s, hh * 0.2 * s, 0.5);
  });
}

function rock(ctx: CanvasRenderingContext2D, px: number, py: number, s: number) {
  ctx.fillStyle = '#857f7b';
  ell(ctx, px, py - 9 * s, 17 * s, 12.5 * s);
  ctx.fillStyle = '#a8a29c';
  ell(ctx, px - 1.5 * s, py - 11 * s, 15 * s, 10.5 * s);
  ctx.fillStyle = '#c9c4be';
  ell(ctx, px - 5 * s, py - 14.5 * s, 8 * s, 5 * s, -0.35);
  ctx.fillStyle = '#e6e2dd';
  ell(ctx, px - 7 * s, py - 16 * s, 3 * s, 1.8 * s, -0.35);
}

/** Faro pequeñito para el islote lejano. */
function miniLighthouse(ctx: CanvasRenderingContext2D, px: number, py: number, time: number, night: number) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(px - 13, py); ctx.lineTo(px - 9, py - 48); ctx.lineTo(px + 9, py - 48); ctx.lineTo(px + 13, py); ctx.closePath();
  ctx.fillStyle = '#fbf7f0';
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = '#dd4b45';
  ctx.fillRect(px - 14, py - 40, 28, 9);
  ctx.fillRect(px - 14, py - 20, 28, 9);
  ctx.fillStyle = 'rgba(0,0,0,.08)';
  ctx.fillRect(px + 3, py - 50, 14, 50);
  ctx.restore();
  ctx.fillStyle = '#4f4757';
  roundRect(ctx, px - 12, py - 51, 24, 4, 2);
  ctx.fillStyle = '#ffe58a';
  roundRect(ctx, px - 7, py - 62, 14, 11, 2);
  ctx.fillStyle = '#dd4b45';
  ctx.beginPath(); ctx.moveTo(px - 10, py - 61); ctx.lineTo(px, py - 72); ctx.lineTo(px + 10, py - 61); ctx.fill();
  glow(ctx, px, py - 57, 34, (night > 0.05 ? night : 0.4) * (0.7 + 0.3 * Math.sin(time * 2 + 1)));
}

export function drawPropNice(ctx: CanvasRenderingContext2D, p: Prop, time: number, night: number) {
  const px = p.x * T, py = p.y * T;
  const sway = Math.sin(time * 1.2 + p.v * 9) * 1.4;
  switch (p.kind) {
    case 'tree':
    case 'apple':
    case 'orange':
      shadow(ctx, px, py, 30, 10);
      tree(ctx, px, py, 1.08 + p.v * 0.1, p.v, sway, p.kind === 'apple' ? '#e8414b' : p.kind === 'orange' ? '#f7a229' : undefined);
      break;
    case 'pine':
      shadow(ctx, px, py, 24, 8);
      pine(ctx, px, py, 1.05 + p.v * 0.12, sway);
      break;
    case 'bush': {
      shadow(ctx, px, py, 24, 7);
      ctx.fillStyle = '#3f9a4f';
      circle(ctx, px - 12, py - 11, 14); circle(ctx, px + 12, py - 11, 14); circle(ctx, px, py - 17, 16);
      ctx.fillStyle = '#5cb862';
      circle(ctx, px - 11, py - 14, 12); circle(ctx, px + 10, py - 15, 12); circle(ctx, px - 1, py - 22, 13);
      ctx.fillStyle = '#93dc84';
      ell(ctx, px - 5, py - 28, 7, 4.5, -0.4);
      for (const [ax, ay] of [[-8, -22], [9, -15], [-14, -9], [2, -8]]) {
        ctx.fillStyle = p.v > 0.5 ? '#ff8fab' : '#fff6d8';
        circle(ctx, px + ax, py + ay, 3.2);
        ctx.fillStyle = '#ffd45c';
        circle(ctx, px + ax, py + ay, 1.2);
      }
      break;
    }
    case 'rock':
      shadow(ctx, px, py, 18 * (0.8 + p.v * 0.9), 6);
      rock(ctx, px, py, 0.8 + p.v * 0.9);
      break;
    case 'searock': {
      const s = 1.1 + p.v * 0.9, k = Math.sin(time * 1.8 + p.v * 9);
      ctx.fillStyle = 'rgba(255,255,255,.8)';
      ell(ctx, px, py - 1, (22 + k * 2) * s, (8 + k) * s);
      rock(ctx, px, py, s);
      if (p.v > 0.5) rock(ctx, px + 17 * s, py + 2, s * 0.55);
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      ell(ctx, px - 9 * s, py, 7 * s, 2.6 * s);
      ell(ctx, px + 10 * s, py + 1, 6 * s, 2.2 * s);
      break;
    }
    case 'islet': {
      const k = Math.sin(time * 1.6 + p.v * 7);
      ctx.fillStyle = 'rgba(190,244,243,.55)';
      ell(ctx, px, py + 4, 96, 34);
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      ell(ctx, px, py + 2, 78 + k * 2, 24 + k);
      ctx.fillStyle = '#7a5232';
      roundRect(ctx, px - 64, py - 26, 128, 36, 17);
      ctx.fillStyle = '#a87548';
      roundRect(ctx, px - 64, py - 30, 128, 32, 16);
      for (const [ax, ay, w] of [[-44, -8, 20], [-12, -3, 24], [22, -9, 18], [38, -1, 14], [-30, 2, 14]]) {
        ctx.fillStyle = ax % 3 ? '#c4925f' : '#8c6039';
        roundRect(ctx, px + ax, py + ay, w, 7, 3.5);
      }
      ctx.fillStyle = '#5aa845';
      ell(ctx, px, py - 25, 68, 17);
      ctx.fillStyle = '#94d560';
      ell(ctx, px, py - 29, 68, 16);
      if (p.v > 0.5) {
        tree(ctx, px - 36, py - 28, 0.5, 0.2, sway);
        miniLighthouse(ctx, px + 12, py - 28, time, night);
        pine(ctx, px + 44, py - 26, 0.5, sway);
      } else {
        pine(ctx, px - 40, py - 30, 0.55, sway);
        tree(ctx, px - 6, py - 26, 0.62, 0.7, sway);
        tree(ctx, px + 34, py - 29, 0.5, 0.4, sway);
      }
      break;
    }
    default:
      drawProp(ctx, p, time, night);
  }
}
