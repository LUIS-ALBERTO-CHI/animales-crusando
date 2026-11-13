/* Personajes originales dibujados como SVG (viewBox 100x120, los pies en y≈116).
   Se usan dos veces: en la portada (Astro los incrusta como HTML) y en el juego
   (se convierten en imágenes para pintarlas en el canvas). */

import { CONFIG } from '../config';

export type VillagerId = 'lola' | 'bruno' | 'coco' | 'mimi' | 'olivia' | 'nube' | 'pepa';
export type Dir = 'down' | 'up' | 'side';

export interface VillagerInfo {
  id: VillagerId;
  nombre: string;
  especie: string;
  color: string; // color de la etiqueta del nombre
  voz: number; // tono base de su "voz"
}

export const VILLAGERS: Record<VillagerId, VillagerInfo> = {
  lola: { id: 'lola', nombre: 'Lola', especie: 'canguro', color: '#ef7a85', voz: 1.25 },
  bruno: { id: 'bruno', nombre: 'Bruno', especie: 'oso', color: '#8b5e3c', voz: 0.7 },
  coco: { id: 'coco', nombre: 'Coco', especie: 'conejita', color: '#b98be0', voz: 1.5 },
  mimi: { id: 'mimi', nombre: 'Mimi', especie: 'gata pintora', color: '#9b7fd4', voz: 1.35 },
  olivia: { id: 'olivia', nombre: 'Olivia', especie: 'búho', color: '#7a6bb0', voz: 0.95 },
  nube: { id: 'nube', nombre: 'Nube', especie: 'oveja', color: '#6fa8dc', voz: 1.1 },
  pepa: { id: 'pepa', nombre: 'Pepa', especie: 'pata', color: '#e8a93a', voz: 1.6 },
};

const INK = '#3a2a22';

const wrap = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" width="200" height="240">${body}</svg>`;

/* ---------- piezas comunes ---------- */

function eyes(y: number, blink: boolean, o: { gap?: number; s?: number; lashes?: boolean } = {}) {
  const g = o.gap ?? 10;
  const s = o.s ?? 1;
  return [50 - g, 50 + g]
    .map((x, i) => {
      if (blink)
        return `<path d="M${x - 3.6 * s} ${y} Q${x} ${y + 3.2 * s} ${x + 3.6 * s} ${y}" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
      const lash = o.lashes
        ? `<path d="M${x + (i ? 2.6 : -2.6) * s} ${y - 3.4 * s} l${(i ? 2.8 : -2.8) * s} ${-2.2 * s}" stroke="${INK}" stroke-width="1.7" stroke-linecap="round"/>`
        : '';
      return `<ellipse cx="${x}" cy="${y}" rx="${3.4 * s}" ry="${4.5 * s}" fill="${INK}"/><circle cx="${x + 1.1 * s}" cy="${y - 1.7 * s}" r="${1.35 * s}" fill="#fff"/>${lash}`;
    })
    .join('');
}

const blush = (y: number, gap = 16, c = '#ff8fa0') =>
  `<ellipse cx="${50 - gap}" cy="${y}" rx="4.6" ry="2.7" fill="${c}" opacity=".55"/><ellipse cx="${50 + gap}" cy="${y}" rx="4.6" ry="2.7" fill="${c}" opacity=".55"/>`;

const smile = (y: number, w = 4.5, c = INK) =>
  `<path d="M${50 - w} ${y} Q50 ${y + w * 0.95} ${50 + w} ${y}" stroke="${c}" stroke-width="1.9" fill="none" stroke-linecap="round"/>`;

function flower(cx: number, cy: number, petal: string, r = 3.2) {
  let p = '';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    p += `<circle cx="${(cx + Math.cos(a) * r).toFixed(2)}" cy="${(cy + Math.sin(a) * r).toFixed(2)}" r="${r * 0.85}" fill="${petal}"/>`;
  }
  return p + `<circle cx="${cx}" cy="${cy}" r="${r * 0.6}" fill="#ffd45c"/>`;
}

/** Cuerpo genérico pequeño (patitas, torso, bracitos) con una prenda encima. */
function body(fur: string, shade: string, outfit: string, outfit2?: string) {
  return `
  <ellipse cx="40" cy="113" rx="8.5" ry="4.5" fill="${shade}"/>
  <ellipse cx="60" cy="113" rx="8.5" ry="4.5" fill="${shade}"/>
  <path d="M34 112 C31 96 34 80 41 73 L59 73 C66 80 69 96 66 112 Z" fill="${fur}"/>
  <path d="M35 100 C34 88 36 80 41 73 L59 73 C64 80 66 88 65 100 Q50 105 35 100 Z" fill="${outfit}"/>
  ${outfit2 ?? ''}
  <ellipse cx="33" cy="86" rx="4.6" ry="8.5" transform="rotate(22 33 86)" fill="${outfit}"/>
  <ellipse cx="67" cy="86" rx="4.6" ry="8.5" transform="rotate(-22 67 86)" fill="${outfit}"/>
  <circle cx="30" cy="93" r="4" fill="${fur}"/>
  <circle cx="70" cy="93" r="4" fill="${fur}"/>`;
}

/* ---------- Lola, la canguro (protagonista de la isla) ---------- */

function lola(blink: boolean) {
  const fur = '#dc9c5e';
  const shade = '#c3824b';
  const cream = '#f8e4c3';
  const pink = '#f6a9b4';
  return wrap(`
  <path d="M60 104 C80 109 95 101 96 86 C96 79 90 78 88 84 C85 96 76 99 60 96 Z" fill="${shade}"/>
  <ellipse cx="37" cy="113" rx="12.5" ry="5" fill="${shade}"/>
  <ellipse cx="63" cy="113" rx="12.5" ry="5" fill="${shade}"/>
  <path d="M31 112 C27 92 31 77 40 70 L60 70 C69 77 73 92 69 112 Z" fill="${fur}"/>
  <ellipse cx="50" cy="94" rx="14.5" ry="15" fill="${cream}"/>
  <ellipse cx="45.5" cy="89.5" rx="2.2" ry="3.4" fill="${fur}"/>
  <ellipse cx="54.5" cy="89.5" rx="2.2" ry="3.4" fill="${fur}"/>
  <circle cx="50" cy="95" r="5.6" fill="${fur}"/>
  <circle cx="48" cy="94.5" r=".95" fill="${INK}"/><circle cx="52" cy="94.5" r=".95" fill="${INK}"/>
  <ellipse cx="50" cy="96.6" rx="1.1" ry=".8" fill="${INK}"/>
  <path d="M35.5 97 Q50 104 64.5 97 L64 106 Q50 112 36 106 Z" fill="${cream}"/>
  <path d="M35.5 97 Q50 104 64.5 97" stroke="${shade}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <ellipse cx="33" cy="84" rx="4.6" ry="8.5" transform="rotate(22 33 84)" fill="${fur}"/>
  <ellipse cx="67" cy="84" rx="4.6" ry="8.5" transform="rotate(-22 67 84)" fill="${fur}"/>
  <path d="M37 67 L63 67 L50 80 Z" fill="#ef7a85"/>
  <circle cx="45" cy="70" r="1.3" fill="#fff" opacity=".85"/><circle cx="54" cy="70.5" r="1.3" fill="#fff" opacity=".85"/><circle cx="50" cy="75" r="1.3" fill="#fff" opacity=".85"/>
  <ellipse cx="37" cy="19" rx="7.5" ry="17.5" transform="rotate(-14 37 19)" fill="${fur}"/>
  <ellipse cx="37" cy="20" rx="4" ry="12.5" transform="rotate(-14 37 20)" fill="${pink}"/>
  <ellipse cx="63" cy="19" rx="7.5" ry="17.5" transform="rotate(14 63 19)" fill="${fur}"/>
  <ellipse cx="63" cy="20" rx="4" ry="12.5" transform="rotate(14 63 20)" fill="${pink}"/>
  <ellipse cx="50" cy="47" rx="23.5" ry="21" fill="${fur}"/>
  <ellipse cx="50" cy="57.5" rx="12.5" ry="9.5" fill="${cream}"/>
  <ellipse cx="50" cy="52.6" rx="4.3" ry="3.1" fill="#5b3a2c"/>
  <ellipse cx="48.8" cy="51.7" rx="1.3" ry=".8" fill="#fff" opacity=".6"/>
  <path d="M45.5 58.5 Q50 63.5 54.5 58.5" stroke="#5b3a2c" stroke-width="1.9" fill="none" stroke-linecap="round"/>
  ${eyes(44, blink, { gap: 10, lashes: true })}
  ${blush(53, 17)}
  ${flower(31, 33, '#ffffff', 3.4)}
  ${flower(38.5, 29, '#ffb3c6', 2.8)}
  ${flower(25.5, 39, '#ffb3c6', 2.6)}`);
}

/* ---------- Vecinos ---------- */

function bruno(blink: boolean) {
  const fur = '#a06d45';
  const shade = '#87573a';
  return wrap(`
  ${body(fur, shade, '#76b96b', `<path d="M44 82 q6 -6 12 0 q-6 7 -12 0Z" fill="#5c9a53"/>`)}
  <circle cx="30" cy="30" r="9" fill="${fur}"/><circle cx="30" cy="30" r="5" fill="#e3b48c"/>
  <circle cx="70" cy="30" r="9" fill="${fur}"/><circle cx="70" cy="30" r="5" fill="#e3b48c"/>
  <ellipse cx="50" cy="49" rx="26" ry="23" fill="${fur}"/>
  <ellipse cx="50" cy="59" rx="12" ry="9" fill="#ebcaa2"/>
  <ellipse cx="50" cy="54.5" rx="5" ry="3.6" fill="${INK}"/>
  ${smile(60, 4)}
  ${eyes(46, blink, { gap: 11 })}
  ${blush(56, 18)}`);
}

function coco(blink: boolean) {
  const fur = '#fbf6ef';
  const shade = '#e6dacd';
  return wrap(`
  ${body(fur, shade, '#c7a6e8', `<path d="M35 100 Q50 106 65 100 L68 108 Q50 114 32 108Z" fill="#b48fdc"/>`)}
  <ellipse cx="40" cy="17" rx="7" ry="19" transform="rotate(-8 40 17)" fill="${fur}"/>
  <ellipse cx="40" cy="18" rx="3.6" ry="14" transform="rotate(-8 40 18)" fill="#f8b6c3"/>
  <ellipse cx="61" cy="17" rx="7" ry="19" transform="rotate(10 61 17)" fill="${fur}"/>
  <ellipse cx="61" cy="18" rx="3.6" ry="14" transform="rotate(10 61 18)" fill="#f8b6c3"/>
  <path d="M60 14 l-8 -6 l0 12 Z M60 14 l8 -6 l0 12 Z" fill="#ef6f8d"/><circle cx="60" cy="14" r="2.6" fill="#d9567a"/>
  <ellipse cx="50" cy="48" rx="23" ry="21" fill="${fur}"/>
  <ellipse cx="50" cy="56" rx="3.2" ry="2.3" fill="#f18da3"/>
  <path d="M50 58 v3 M46 60 Q50 64 54 60" stroke="${INK}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <rect x="48" y="61" width="4" height="3.4" rx="1" fill="#fff" stroke="${shade}" stroke-width=".6"/>
  ${eyes(46, blink, { gap: 10, lashes: true })}
  ${blush(55, 15)}`);
}

function mimi(blink: boolean) {
  const fur = '#b99ce8';
  const shade = '#9b7fd4';
  const apron = `<path d="M38 80 L62 80 L65 100 Q50 105 35 100 Z" fill="#fff6e8"/><circle cx="44" cy="88" r="2.2" fill="#ff8fab"/><circle cx="55" cy="93" r="2" fill="#7fd3e3"/><circle cx="50" cy="85" r="1.8" fill="#ffd45c"/><circle cx="46" cy="96" r="1.6" fill="#9fdc7c"/>`;
  return wrap(`
  ${body(fur, shade, '#f0a6c0', apron)}
  <path d="M86 108 C98 100 96 84 88 80" stroke="${shade}" stroke-width="5" fill="none" stroke-linecap="round"/>
  <g transform="rotate(-30 74 86)"><rect x="72" y="66" width="4" height="26" rx="2" fill="#c99560"/><path d="M72 66 q2 -8 4 0 Z" fill="#ef6f82"/></g>
  <path d="M28 40 L30 18 L46 30 Z" fill="${fur}"/><path d="M31 34 L32 23 L41 30 Z" fill="#f8b6c3"/>
  <path d="M72 40 L70 18 L54 30 Z" fill="${fur}"/><path d="M69 34 L68 23 L59 30 Z" fill="#f8b6c3"/>
  <ellipse cx="50" cy="48" rx="24" ry="21" fill="${fur}"/>
  <path d="M44 28 l2 7 M50 27 v8 M56 28 l-2 7" stroke="${shade}" stroke-width="2.4" stroke-linecap="round"/>
  <ellipse cx="50" cy="57" rx="11" ry="8" fill="#fff4e6"/>
  <path d="M47.5 53 h5 l-2.5 3 Z" fill="#f17b95"/>
  <path d="M50 56 v1.5 M46 58 Q48 60.5 50 57.5 Q52 60.5 54 58" stroke="${INK}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <path d="M38 56 h-10 M38 59 l-9 2 M62 56 h10 M62 59 l9 2" stroke="${INK}" stroke-width="1" opacity=".55" stroke-linecap="round"/>
  ${eyes(46, blink, { gap: 10, lashes: true })}
  ${blush(54, 17)}`);
}

function olivia(blink: boolean) {
  const fur = '#a78a6c';
  const shade = '#8b6f53';
  const face = '#f3e5cf';
  return wrap(`
  <ellipse cx="41" cy="113" rx="7" ry="4" fill="#f0a24a"/><ellipse cx="59" cy="113" rx="7" ry="4" fill="#f0a24a"/>
  <path d="M30 110 C26 90 32 72 42 66 L58 66 C68 72 74 90 70 110 Q50 116 30 110 Z" fill="${fur}"/>
  <ellipse cx="50" cy="94" rx="13" ry="14" fill="#e8d6ba"/>
  <path d="M44 88 q3 3 6 0 q3 3 6 0 M44 96 q3 3 6 0 q3 3 6 0" stroke="${shade}" stroke-width="1.3" fill="none"/>
  <path d="M30 76 C20 86 22 100 32 104 Z" fill="${shade}"/>
  <path d="M70 76 C80 86 78 100 68 104 Z" fill="${shade}"/>
  <rect x="38" y="96" width="24" height="14" rx="2" fill="#d96b6b" transform="rotate(-6 50 103)"/>
  <rect x="40" y="97.5" width="20" height="11" rx="1" fill="#fff8ee" transform="rotate(-6 50 103)"/>
  <path d="M38 64 Q50 72 62 64 L60 70 Q50 76 40 70 Z" fill="#9b7fd1"/>
  <path d="M28 30 L33 16 L42 28 Z M72 30 L67 16 L58 28 Z" fill="${shade}"/>
  <ellipse cx="50" cy="45" rx="26" ry="22" fill="${fur}"/>
  <path d="M50 34 C38 26 24 34 26 48 C27 60 40 66 50 60 C60 66 73 60 74 48 C76 34 62 26 50 34 Z" fill="${face}"/>
  ${eyes(46, blink, { gap: 11, s: 1.15, lashes: true })}
  <circle cx="39" cy="46" r="7.5" fill="none" stroke="#c9a24a" stroke-width="1.6"/>
  <circle cx="61" cy="46" r="7.5" fill="none" stroke="#c9a24a" stroke-width="1.6"/>
  <path d="M46.5 46 h7" stroke="#c9a24a" stroke-width="1.6"/>
  <path d="M46 53 L54 53 L50 59 Z" fill="#f0a24a"/>
  ${blush(56, 19)}`);
}

function nube(blink: boolean) {
  const wool = '#fffaf0';
  const woolShade = '#efe6d6';
  const face = '#f5dcc8';
  const puffs = (cx: number, cy: number, r: number, n: number, c: string) => {
    let s = '';
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      s += `<circle cx="${(cx + Math.cos(a) * r).toFixed(1)}" cy="${(cy + Math.sin(a) * r * 0.85).toFixed(1)}" r="${(r * 0.42).toFixed(1)}" fill="${c}"/>`;
    }
    return s;
  };
  return wrap(`
  <rect x="37" y="104" width="7" height="10" rx="3" fill="#6b5a52"/><rect x="56" y="104" width="7" height="10" rx="3" fill="#6b5a52"/>
  ${puffs(50, 90, 17, 10, woolShade)}
  <ellipse cx="50" cy="90" rx="19" ry="17" fill="${wool}"/>
  ${puffs(50, 89, 14, 8, wool)}
  <path d="M40 72 L50 78 L60 72 L60 80 L50 76 L40 80 Z" fill="#6fa8dc"/><circle cx="50" cy="77" r="3" fill="#4f8fcb"/>
  <ellipse cx="26" cy="47" rx="9" ry="4.5" transform="rotate(20 26 47)" fill="${face}"/>
  <ellipse cx="74" cy="47" rx="9" ry="4.5" transform="rotate(-20 74 47)" fill="${face}"/>
  <ellipse cx="50" cy="50" rx="20" ry="19" fill="${face}"/>
  ${puffs(50, 32, 13, 9, wool)}
  <ellipse cx="50" cy="32" rx="13" ry="8" fill="${wool}"/>
  <ellipse cx="50" cy="59" rx="2.8" ry="2" fill="#c98b84"/>
  ${smile(61.5, 3.5)}
  ${eyes(49, blink, { gap: 9 })}
  ${blush(57, 14)}`);
}

function pepa(blink: boolean) {
  const fur = '#ffd860';
  const shade = '#efc043';
  return wrap(`
  <path d="M30 113 l10 -4 l10 4 Z M50 113 l10 -4 l10 4 Z" fill="#f39a3b"/>
  <ellipse cx="40" cy="112" rx="10" ry="3.6" fill="#f39a3b"/><ellipse cx="60" cy="112" rx="10" ry="3.6" fill="#f39a3b"/>
  <ellipse cx="50" cy="90" rx="22" ry="20" fill="${fur}"/>
  <ellipse cx="50" cy="94" rx="13" ry="12" fill="#fff0b8"/>
  <path d="M29 84 C18 90 20 102 32 100 Z" fill="${shade}"/>
  <path d="M71 84 C82 90 80 102 68 100 Z" fill="${shade}"/>
  <path d="M38 70 Q50 76 62 70 L62 75 Q50 81 38 75 Z" fill="#7cc8e8"/>
  <ellipse cx="50" cy="47" rx="23" ry="22" fill="${fur}"/>
  <ellipse cx="50" cy="27" rx="27" ry="6" fill="#e9c88e"/>
  <path d="M34 27 C34 12 66 12 66 27 Z" fill="#f2d7a2"/>
  <path d="M34.5 24 C40 26 60 26 65.5 24 L66 27 C60 29 40 29 34 27 Z" fill="#f27c9b"/>
  ${flower(62, 22, '#ffffff', 2.4)}
  <ellipse cx="50" cy="58" rx="13" ry="5.5" fill="#f5a043"/>
  <path d="M38 58 Q50 62.5 62 58" stroke="#d9822e" stroke-width="1.4" fill="none"/>
  ${eyes(46, blink, { gap: 10, lashes: true })}
  ${blush(53, 17)}`);
}

const BUILDERS: Record<VillagerId, (blink: boolean) => string> = { lola, bruno, coco, mimi, olivia, nube, pepa };

export function villagerSVG(id: VillagerId, blink = false): string {
  return BUILDERS[id](blink);
}

/* ---------- La jugadora: una perrita original ---------- */

export function playerSVG(dir: Dir, frame: number): string {
  const c = CONFIG.jugadora;
  const fur = c.pelaje;
  const ear = c.orejas;
  const muzzle = '#fff7ea';
  // frame: 0 quieta, 1 pie izquierdo adelante, 2 pie derecho adelante
  const lf = frame === 1 ? -3 : frame === 2 ? 1 : 0;
  const rf = frame === 2 ? -3 : frame === 1 ? 1 : 0;
  const armL = frame === 1 ? 12 : frame === 2 ? -12 : 0;
  const wag = frame === 1 ? 18 : frame === 2 ? -18 : 0;

  const dots = (id: string, path: string) => {
    let s = `<clipPath id="${id}"><path d="${path}"/></clipPath><path d="${path}" fill="${c.vestido}"/><g clip-path="url(#${id})" fill="${c.lunares}" opacity=".9">`;
    for (let y = 72; y < 108; y += 8) for (let x = 30 + ((y / 8) % 2) * 4; x < 72; x += 8) s += `<circle cx="${x}" cy="${y}" r="1.7"/>`;
    return s + '</g>';
  };
  const dressPath = 'M40 72 L60 72 C63 80 67 92 70 103 Q50 109 30 103 C33 92 37 80 40 72 Z';
  const legs = `
    <rect x="40.5" y="${100 + lf}" width="8" height="${11 - lf}" rx="4" fill="${fur}"/>
    <rect x="51.5" y="${100 + rf}" width="8" height="${11 - rf}" rx="4" fill="${fur}"/>
    <ellipse cx="44.5" cy="${112 + lf * 0.6}" rx="6" ry="3.8" fill="${ear}"/>
    <ellipse cx="55.5" cy="${112 + rf * 0.6}" rx="6" ry="3.8" fill="${ear}"/>`;
  const tail = (x: number, y: number) =>
    `<g transform="rotate(${wag} ${x} ${y})"><path d="M${x} ${y} q12 -4 13 -16" stroke="${ear}" stroke-width="6" fill="none" stroke-linecap="round"/></g>`;
  const hat = (cx: number) => `
    <ellipse cx="${cx}" cy="29" rx="31" ry="7.5" fill="${c.sombrero}"/>
    <path d="M${cx - 17} 29 C${cx - 17} 12 ${cx + 17} 12 ${cx + 17} 29 Z" fill="${c.sombrero}"/>
    <path d="M${cx - 17} 29 C${cx - 17} 25 ${cx + 17} 25 ${cx + 17} 29 L${cx + 17} 24.5 C${cx + 17} 20.5 ${cx - 17} 20.5 ${cx - 17} 24.5 Z" fill="${c.cinta}"/>
    <path d="M${cx - 12} 18 q12 -4 24 0" stroke="#fff" stroke-opacity=".35" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  const bow = (x: number, y: number) =>
    `<path d="M${x} ${y} l-7 -5 l0 10 Z M${x} ${y} l7 -5 l0 10 Z" fill="${c.cinta}"/><circle cx="${x}" cy="${y}" r="2.3" fill="#b8323b"/>`;

  if (dir === 'down') {
    return wrap(`
    ${tail(64, 98)}
    ${legs}
    <g transform="rotate(${armL} 38 76)"><ellipse cx="35" cy="86" rx="4.6" ry="9" transform="rotate(16 35 86)" fill="${fur}"/></g>
    <g transform="rotate(${-armL} 62 76)"><ellipse cx="65" cy="86" rx="4.6" ry="9" transform="rotate(-16 65 86)" fill="${fur}"/></g>
    ${dots('dress', dressPath)}
    ${bow(50, 76)}
    <ellipse cx="50" cy="47" rx="23" ry="21" fill="${fur}"/>
    <ellipse cx="28" cy="52" rx="7.5" ry="15" transform="rotate(14 28 52)" fill="${ear}"/>
    <ellipse cx="72" cy="52" rx="7.5" ry="15" transform="rotate(-14 72 52)" fill="${ear}"/>
    <ellipse cx="50" cy="58" rx="11.5" ry="8.5" fill="${muzzle}"/>
    <ellipse cx="50" cy="53.5" rx="4.6" ry="3.4" fill="#4a2f24"/>
    <ellipse cx="48.7" cy="52.6" rx="1.4" ry=".8" fill="#fff" opacity=".6"/>
    <path d="M45.5 59 Q50 63 54.5 59" stroke="#4a2f24" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <ellipse cx="50" cy="62.3" rx="2.4" ry="2" fill="#f2808f"/>
    ${eyes(46, false, { gap: 10, s: 0.95, lashes: true })}
    ${c.lentes ? `<circle cx="40" cy="46" r="6.6" fill="#fff" fill-opacity=".12" stroke="#a7a3b3" stroke-width="1.6"/><circle cx="60" cy="46" r="6.6" fill="#fff" fill-opacity=".12" stroke="#a7a3b3" stroke-width="1.6"/><path d="M46.6 45.5 Q50 44 53.4 45.5" stroke="#a7a3b3" stroke-width="1.5" fill="none"/>` : ''}
    ${blush(55, 15)}
    ${hat(50)}
    ${flower(66, 25, '#ffffff', 2.6)}`);
  }

  if (dir === 'up') {
    return wrap(`
    ${legs}
    <g transform="rotate(${armL} 38 76)"><ellipse cx="35" cy="86" rx="4.6" ry="9" transform="rotate(16 35 86)" fill="${fur}"/></g>
    <g transform="rotate(${-armL} 62 76)"><ellipse cx="65" cy="86" rx="4.6" ry="9" transform="rotate(-16 65 86)" fill="${fur}"/></g>
    ${dots('dressb', dressPath)}
    ${tail(50, 96)}
    <ellipse cx="50" cy="47" rx="23" ry="21" fill="${fur}"/>
    <ellipse cx="28" cy="52" rx="7.5" ry="15" transform="rotate(14 28 52)" fill="${ear}"/>
    <ellipse cx="72" cy="52" rx="7.5" ry="15" transform="rotate(-14 72 52)" fill="${ear}"/>
    ${hat(50)}
    <path d="M44 29 l-5 16 M56 29 l5 16" stroke="${c.cinta}" stroke-width="3.2" stroke-linecap="round"/>
    ${flower(34, 25, '#ffffff', 2.6)}`);
  }

  // perfil mirando a la derecha (para la izquierda se voltea al dibujar)
  const sl = frame === 1 ? 6 : frame === 2 ? -6 : 0;
  return wrap(`
    ${tail(38, 96).replace(`rotate(${wag}`, `rotate(${wag - 70}`)}
    <g transform="rotate(${-sl * 2} 50 100)"><rect x="45" y="99" width="8" height="12" rx="4" fill="${fur}"/><ellipse cx="51" cy="112" rx="6.5" ry="3.6" fill="${ear}"/></g>
    <g transform="rotate(${sl * 2} 50 100)"><rect x="47" y="99" width="8" height="12" rx="4" fill="${fur}"/><ellipse cx="53" cy="112" rx="6.5" ry="3.6" fill="${ear}"/></g>
    ${dots('dresss', 'M42 72 L58 72 C61 80 64 92 66 103 Q50 108 34 103 C37 92 39 80 42 72 Z')}
    <g transform="rotate(${-sl * 3} 50 77)"><ellipse cx="51" cy="87" rx="4.6" ry="9" fill="${fur}"/></g>
    <ellipse cx="49" cy="47" rx="22" ry="21" fill="${fur}"/>
    <ellipse cx="69" cy="56" rx="11" ry="8" fill="${muzzle}"/>
    <ellipse cx="78.5" cy="52.5" rx="4" ry="3.2" fill="#4a2f24"/>
    <path d="M70 60.5 Q74 63 78 60" stroke="#4a2f24" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <ellipse cx="62" cy="46" rx="3.2" ry="4.3" fill="${INK}"/><circle cx="63" cy="44.3" r="1.25" fill="#fff"/>
    <path d="M64.5 42 l2.6 -2" stroke="${INK}" stroke-width="1.5" stroke-linecap="round"/>
    ${c.lentes ? `<circle cx="62" cy="46" r="6.6" fill="#fff" fill-opacity=".12" stroke="#a7a3b3" stroke-width="1.6"/><path d="M55.5 45 L42 43" stroke="#a7a3b3" stroke-width="1.5"/>` : ''}
    <ellipse cx="60" cy="55" rx="4" ry="2.5" fill="#ff8fa0" opacity=".55"/>
    <ellipse cx="38" cy="52" rx="8" ry="15.5" transform="rotate(10 38 52)" fill="${ear}"/>
    ${hat(49)}
    ${flower(34, 25, '#ffffff', 2.6)}`);
}

/** Icono de corazón reutilizable en la interfaz. */
export const HEART_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.2 0 3.6 1.2 5.3 3.1 1.7-1.9 3.1-3.1 5.3-3.1 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z" fill="currentColor"/></svg>`;
