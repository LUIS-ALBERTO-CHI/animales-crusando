/* Motor del juego: bucle, movimiento, cámara, diálogos y paradas. */

import { CONFIG } from '../config';
import { VILLAGERS, villagerSVG, playerSVG, type VillagerId, type Dir } from './sprites';
import {
  T, W, H, buildWorld, buildRoute, drawRoute, drawDecor, drawHouse, drawLighthouse, drawWaterfall,
  drawSign, drawMarker, drawShell, leaf, walkable, level, Tile,
  HOUSE, HOUSE_BOX, START, LOLA_START, PIER_END, STOPS, LIGHTHOUSE, LIGHTHOUSE_R, WATERFALL, WATERFALL_R,
  circle, heart, shadow, type Prop, type Pt,
} from './world';
import { drawTerrain, underCliff } from './terrain';
import { drawPropNice } from './props';
import { initAudio, blip, sfx, setMuted, isMuted } from './audio';

type Mode = 'title' | 'intro' | 'play' | 'dialog' | 'card' | 'letter' | 'journal';

interface NPC {
  id: VillagerId;
  x: number;
  y: number;
  stop: number; // índice de parada, -1 para Lola
  found: boolean;
  blinkAt: number;
}

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; max: number; size: number; color: string;
  kind: 'heart' | 'petal' | 'spark';
  screen: boolean; rot: number; vr: number;
}

const fill = (s: string) => s.replaceAll('{nombre}', CONFIG.nombre);
const $ = <E extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as E;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

function svgImage(svg: string) {
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  return img;
}

export function startGame() {
  const canvas = $<HTMLCanvasElement>('game');
  const ctx = canvas.getContext('2d')!;
  const virt = CONFIG.virtudes.slice(0, STOPS.length);
  const total = virt.length;
  const world = buildWorld(total);
  const legs = buildRoute(total);

  /* ---------- imágenes ---------- */
  const dirs: Dir[] = ['down', 'up', 'side'];
  const playerImg = Object.fromEntries(dirs.map((d) => [d, [0, 1, 2].map((f) => svgImage(playerSVG(d, f)))])) as Record<Dir, HTMLImageElement[]>;
  const ids = Object.keys(VILLAGERS) as VillagerId[];
  const npcImg = Object.fromEntries(ids.map((id) => [id, [svgImage(villagerSVG(id)), svgImage(villagerSVG(id, true))]])) as Record<VillagerId, HTMLImageElement[]>;
  const portrait = Object.fromEntries(ids.map((id) => [id, 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(villagerSVG(id))])) as Record<VillagerId, string>;
  const playerPortrait = playerImg.down[0];

  /* ---------- estado ---------- */
  const npcs: NPC[] = virt.map((v, i) => ({
    id: (v.vecino in VILLAGERS ? v.vecino : 'olivia') as VillagerId, x: STOPS[i].x, y: STOPS[i].y, stop: i, found: false, blinkAt: Math.random() * 4,
  }));
  const lola: NPC = { id: 'lola', x: LOLA_START.x, y: LOLA_START.y, stop: -1, found: true, blinkAt: 1 };
  npcs.push(lola);

  const S = {
    mode: 'title' as Mode,
    time: 0,
    player: { x: START.x, y: START.y, dir: 'down' as Dir, flip: false, moving: false, anim: 0, step: 0 },
    cam: { x: START.x * T, y: START.y * T },
    blend: 0, // 0 = vista del mapa completo, 1 = cámara de juego
    blendTarget: 0,
    found: 0,
    allFound: false,
    ended: false,
    sunset: 0,
    sunsetTarget: 0,
    cooldown: 0,
    fireworks: 0,
  };

  const particles: Particle[] = [];
  const butterflies = Array.from({ length: 6 }, (_, i) => ({
    cx: [14, 30, 18, 26, 9, 34][i], cy: [12, 8, 24, 20, 16, 23][i], r: 1.5 + Math.random() * 2, ph: Math.random() * 9,
    col: ['#ffd45c', '#ff9fb5', '#ffffff', '#b8a2ff', '#ffb36b', '#9fe0ff'][i],
  }));

  /* ---------- interfaz (DOM) ---------- */
  const ui = {
    hud: $('hud'), count: $('hud-count'), shells: $('hud-shells'), goal: $('hud-goal'),
    dialog: $('dialog'), dlgName: $('dlg-name'), dlgText: $('dlg-text'), dlgNext: $('dlg-next'), dlgPortrait: $<HTMLImageElement>('dlg-portrait'),
    card: $('card'), cardTitle: $('card-title'), cardMsg: $('card-msg'), cardPrize: $('card-prize'), cardBtn: $('card-btn'),
    journal: $('journal'), journalList: $('journal-list'),
    letter: $('letter'), letterBody: $('letter-body'), letterSign: $('letter-sign'),
    toast: $('toast'), title: $('title-screen'), titleStop: $('title-stop'), controls: $('touch-controls'),
  };
  const SHELL_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 15c0-6 4-10 9-10s9 4 9 10c-3 1.6-6 2.2-9 2.2S6 16.6 3 15z" fill="currentColor"/><path d="M12 16V7M8 15.5 6.5 9M16 15.5 17.5 9" stroke="#fff" stroke-opacity=".7" stroke-width="1.3" stroke-linecap="round"/></svg>`;

  function renderHud() {
    ui.count.textContent = `${S.found}/${total}`;
    ui.shells.innerHTML = Array.from({ length: total }, (_, i) => `<span class="${i < S.found ? 'on' : ''}">${SHELL_ICON}</span>`).join('');
    ui.goal.textContent = S.ended
      ? 'Pasea por tu isla todo lo que quieras ♥'
      : S.allFound || S.found >= total
        ? 'Lola te espera al final del muelle'
        : `Parada ${S.found + 1} de ${total}: ${virt[S.found].etiqueta}`;
  }
  ui.titleStop.textContent = `Parada 1 de ${total}`;

  let toastTimer = 0;
  function toast(msg: string) {
    ui.toast.textContent = msg;
    ui.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => ui.toast.classList.remove('show'), 3800);
  }

  /* ---------- diálogos ---------- */
  let dlg: { lines: string[]; i: number; shown: number; acc: number; pitch: number; resolve: () => void } | null = null;
  const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);

  function paintLine() {
    if (!dlg) return;
    const full = dlg.lines[dlg.i];
    ui.dlgText.innerHTML = esc(full.slice(0, dlg.shown)) + `<span class="ghost">${esc(full.slice(dlg.shown))}</span>`;
    ui.dlgNext.classList.toggle('show', dlg.shown >= full.length);
  }

  function talk(id: VillagerId, lines: string[]) {
    return new Promise<void>((resolve) => {
      const v = VILLAGERS[id];
      ui.dlgName.textContent = v.nombre;
      ui.dlgName.parentElement!.style.setProperty('--tag', v.color);
      ui.dlgPortrait.src = portrait[id];
      ui.dlgPortrait.alt = `${v.nombre}, ${v.especie}`;
      ui.dialog.classList.add('show');
      S.mode = 'dialog';
      dlg = { lines: lines.map(fill), i: 0, shown: 0, acc: 0, pitch: v.voz, resolve };
      sfx('open');
      paintLine();
    });
  }

  function advance() {
    if (!dlg) return;
    const full = dlg.lines[dlg.i];
    if (dlg.shown < full.length) {
      dlg.shown = full.length;
    } else if (dlg.i < dlg.lines.length - 1) {
      dlg.i++;
      dlg.shown = 0;
      sfx('pop');
    } else {
      const r = dlg.resolve;
      dlg = null;
      ui.dialog.classList.remove('show');
      S.mode = 'play';
      S.cooldown = 0.35;
      r();
      return;
    }
    paintLine();
  }

  function updateDialog(dt: number) {
    if (!dlg) return;
    const full = dlg.lines[dlg.i];
    if (dlg.shown >= full.length) return;
    dlg.acc += dt * 40;
    let changed = false;
    while (dlg.acc >= 1 && dlg.shown < full.length) {
      dlg.acc--;
      dlg.shown++;
      changed = true;
      const ch = full[dlg.shown - 1];
      if (dlg.shown % 2 === 0) blip(ch, dlg.pitch * (0.95 + Math.random() * 0.1));
      if ('.!?…,'.includes(ch)) dlg.acc -= 4;
    }
    if (changed) paintLine();
  }

  /* ---------- tarjeta de virtud ---------- */
  function showCard(npc: NPC) {
    return new Promise<void>((resolve) => {
      const v = virt[npc.stop];
      ui.cardTitle.textContent = v.titulo;
      ui.cardMsg.textContent = fill(v.mensaje);
      ui.cardPrize.textContent = `${CONFIG.premio} desbloqueada`;
      ui.card.classList.add('show');
      S.mode = 'card';
      const done = () => {
        ui.cardBtn.removeEventListener('click', done);
        window.removeEventListener('keydown', onKey);
        ui.card.classList.remove('show');
        S.mode = 'play';
        S.cooldown = 0.35;
        resolve();
      };
      const onKey = (e: KeyboardEvent) => {
        if (['Enter', ' ', 'e', 'E', 'z', 'Z'].includes(e.key)) { e.preventDefault(); done(); }
      };
      ui.cardBtn.addEventListener('click', done);
      setTimeout(() => window.addEventListener('keydown', onKey), 500);
      ui.cardBtn.focus({ preventScroll: true });
    });
  }

  /* ---------- diario ---------- */
  function openJournal() {
    if (S.mode !== 'play') return;
    ui.journalList.innerHTML = npcs
      .filter((n) => n.stop >= 0)
      .map((n) => {
        const v = virt[n.stop];
        const who = VILLAGERS[n.id];
        return n.found
          ? `<li class="found"><img src="${portrait[n.id]}" alt=""/><div><strong>${esc(v.titulo)}</strong><small>${esc(fill(v.mensaje))}</small></div></li>`
          : `<li><span class="mystery">${n.stop + 1}</span><div><strong>${esc(v.etiqueta)}</strong><small>Te espera ${who.nombre}, ${who.especie}</small></div></li>`;
      })
      .join('');
    ui.journal.classList.add('show');
    S.mode = 'journal';
  }
  function closeJournal() {
    ui.journal.classList.remove('show');
    S.mode = 'play';
    S.cooldown = 0.2;
  }

  /* ---------- carta final ---------- */
  function showLetter() {
    ui.letterBody.innerHTML = CONFIG.carta.map((p) => `<p>${esc(fill(p))}</p>`).join('');
    ui.letterSign.textContent = CONFIG.firma;
    ui.letter.classList.add('show');
    S.mode = 'letter';
    S.fireworks = 1;
  }
  $('letter-continue').addEventListener('click', () => {
    ui.letter.classList.remove('show');
    S.mode = 'play';
    S.fireworks = 0;
    S.cooldown = 0.4;
    renderHud();
  });
  $('letter-restart').addEventListener('click', () => location.reload());

  /* ---------- paradas ---------- */
  async function meet(npc: NPC) {
    if (npc.id === 'lola') {
      if (S.allFound && !S.ended) {
        S.sunsetTarget = 1;
        await talk('lola', CONFIG.finalLola);
        S.ended = true;
        sfx('fanfare');
        burst(S.player.x, S.player.y - 1, 40);
        showLetter();
      } else if (S.ended) {
        await talk('lola', ['Qué atardecer tan bonito, ¿verdad?', 'Esta isla siempre será tuya, {nombre}. Vuelve cuando quieras. ♥']);
      } else {
        const next = npcs[S.found];
        await talk('lola', [`Tu siguiente parada es «${virt[S.found].etiqueta}». ${VILLAGERS[next.id].nombre} te está esperando.`, 'Sigue los puntitos blancos del camino. ¡Ánimo!']);
      }
      return;
    }
    const v = virt[npc.stop];
    if (npc.found) {
      await talk(npc.id, [v.dialogo[v.dialogo.length - 1]]);
      return;
    }
    if (npc.stop !== S.found) {
      const prev = npcs[S.found];
      await talk(npc.id, [`¡Hola, {nombre}! Aún no es mi turno...`, `Primero ve a la parada «${virt[S.found].etiqueta}», donde está ${VILLAGERS[prev.id].nombre}. ¡Sigue los puntitos!`]);
      return;
    }
    await talk(npc.id, v.dialogo);
    npc.found = true;
    S.found++;
    sfx('chime');
    burst(npc.x, npc.y - 1.6, 26);
    await showCard(npc);
    renderHud();
    if (S.found >= total) {
      S.allFound = true;
      lola.x = PIER_END.x;
      lola.y = PIER_END.y;
      renderHud();
      toast('¡Tienes todas las conchas! Lola se fue saltando al muelle 🦘');
    } else {
      toast(`Siguiente parada: ${virt[S.found].etiqueta}`);
    }
  }

  function nearestNPC(range: number) {
    let best: NPC | null = null;
    let bd = range;
    for (const n of npcs) {
      const d = Math.hypot(n.x - S.player.x, (n.y - S.player.y) * 1.2);
      if (d < bd) { bd = d; best = n; }
    }
    return best;
  }

  function action() {
    initAudio();
    if (S.mode === 'dialog') return advance();
    if (S.mode === 'journal') return closeJournal();
    if (S.mode !== 'play' || S.cooldown > 0) return;
    const n = nearestNPC(1.9);
    if (n) void meet(n);
  }

  /* ---------- partículas ---------- */
  function burst(x: number, y: number, n: number) {
    const cols = ['#ff7a93', '#ffb3c6', '#ffd45c', '#ffffff', '#ff5c7a'];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 1.5 + Math.random() * 3.5;
      particles.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2.5, life: 0, max: 1.2 + Math.random() * 0.8,
        size: 5 + Math.random() * 6, color: cols[i % cols.length], kind: i % 3 ? 'heart' : 'spark', screen: false, rot: 0, vr: 0,
      });
    }
  }

  function screenBurst() {
    const x = innerWidth * (0.15 + Math.random() * 0.7);
    const y = innerHeight * (0.12 + Math.random() * 0.4);
    const cols = ['#ff7a93', '#ffd45c', '#ffffff', '#b8a2ff', '#7fe0ff'];
    const col = cols[Math.floor(Math.random() * cols.length)];
    for (let i = 0; i < 28; i++) {
      const tt = (i / 28) * Math.PI * 2;
      const hx = 16 * Math.sin(tt) ** 3;
      const hy = -(13 * Math.cos(tt) - 5 * Math.cos(2 * tt) - 2 * Math.cos(3 * tt) - Math.cos(4 * tt));
      particles.push({ x, y, vx: hx * 9, vy: hy * 9, life: 0, max: 1.4, size: 3.2, color: col, kind: 'spark', screen: true, rot: 0, vr: 0 });
    }
  }

  function updateParticles(dt: number) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life += dt;
      if (p.life > p.max) { particles.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      if (p.kind === 'petal') p.vx += Math.sin(S.time * 2 + p.size) * 8 * dt;
      else if (p.screen) { p.vx *= 0.96; p.vy = p.vy * 0.96 + 30 * dt; }
      else { p.vy += 4 * dt; p.vx *= 0.98; }
    }
    const petals = particles.filter((p) => p.kind === 'petal').length;
    if (S.mode !== 'title' && petals < 10 && Math.random() < dt * 2) {
      particles.push({
        x: Math.random() * innerWidth, y: -10, vx: 10 + Math.random() * 20, vy: 25 + Math.random() * 25, life: 0, max: 14,
        size: 4 + Math.random() * 3, color: Math.random() < 0.5 ? '#ffc4d4' : '#ffe1ea', kind: 'petal', screen: true, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 3,
      });
    }
  }

  /* ---------- entrada ---------- */
  const keys = new Set<string>();
  const joy = { active: false, id: -1, ox: 0, oy: 0, dx: 0, dy: 0 };

  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    if (S.mode === 'title' || S.mode === 'intro') return;
    if (e.repeat && (k === ' ' || k === 'enter')) return;
    keys.add(k);
    if (S.mode === 'card') return;
    if ([' ', 'enter', 'e', 'z'].includes(k)) action();
    if (k === 'j' || k === 'tab') { e.preventDefault(); if (S.mode === 'journal') closeJournal(); else openJournal(); }
    if (k === 'escape' && S.mode === 'journal') closeJournal();
  });
  window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur', () => keys.clear());

  ui.dialog.addEventListener('click', () => advance());
  $('btn-journal').addEventListener('click', () => (S.mode === 'journal' ? closeJournal() : openJournal()));
  $('journal-close').addEventListener('click', closeJournal);
  const soundBtn = $('btn-sound');
  soundBtn.addEventListener('click', () => {
    initAudio();
    setMuted(!isMuted());
    soundBtn.classList.toggle('off', isMuted());
    soundBtn.setAttribute('aria-pressed', String(isMuted()));
  });

  // Joystick táctil dinámico: aparece donde se toca la pantalla
  const zone = $('touch-zone');
  const base = $('joy-base');
  const knob = $('joy-knob');
  const R = 46;
  zone.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' || S.mode === 'title') return;
    initAudio();
    document.body.classList.add('touch');
    joy.active = true; joy.id = e.pointerId; joy.ox = e.clientX; joy.oy = e.clientY; joy.dx = joy.dy = 0;
    base.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    knob.style.transform = 'translate(-50%, -50%)';
    base.classList.add('show');
    zone.setPointerCapture(e.pointerId);
  });
  zone.addEventListener('pointermove', (e) => {
    if (!joy.active || e.pointerId !== joy.id) return;
    let dx = e.clientX - joy.ox, dy = e.clientY - joy.oy;
    const d = Math.hypot(dx, dy);
    if (d > R) { dx = (dx / d) * R; dy = (dy / d) * R; }
    joy.dx = dx / R; joy.dy = dy / R;
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  });
  const endJoy = (e: PointerEvent) => {
    if (e.pointerId !== joy.id) return;
    joy.active = false; joy.dx = joy.dy = 0;
    base.classList.remove('show');
  };
  zone.addEventListener('pointerup', endJoy);
  zone.addEventListener('pointercancel', endJoy);
  $('btn-a').addEventListener('pointerdown', (e) => { e.preventDefault(); if (S.mode === 'card') ui.cardBtn.click(); else action(); });
  if (matchMedia('(pointer: coarse)').matches) document.body.classList.add('touch');

  /* ---------- inicio: del mapa completo a la jugadora ---------- */
  $('start-btn').addEventListener('click', () => {
    if (S.mode !== 'title') return;
    initAudio();
    ui.title.classList.add('hide');
    S.mode = 'intro';
    S.blendTarget = 1;
    setTimeout(() => {
      ui.hud.classList.add('show');
      ui.controls.classList.add('show');
      renderHud();
      S.mode = 'play';
      void talk('lola', CONFIG.intro).then(() => toast('Usa las flechas o toca y arrastra para caminar'));
    }, 1700);
  });

  /* ---------- colisiones ---------- */
  const solids: Prop[] = world.props.filter((p) => p.solid > 0);
  const PR = 0.27;
  function free(x: number, y: number, fromX: number, fromY: number) {
    for (const [ox, oy] of [[-PR, 0], [PR, 0], [0, -PR * 0.6], [0, PR * 0.6], [-PR * 0.7, -PR * 0.4], [PR * 0.7, -PR * 0.4], [-PR * 0.7, PR * 0.4], [PR * 0.7, PR * 0.4]]) {
      if (!walkable(world.at(Math.floor(x + ox), Math.floor(y + oy))) || underCliff(world, Math.floor(x + ox), Math.floor(y + oy))) return false;
    }
    // no se puede saltar el acantilado: solo se cambia de nivel por la escalera
    const lt = level(world.at(Math.floor(x), Math.floor(y)));
    const lf = level(world.at(Math.floor(fromX), Math.floor(fromY)));
    if (lt >= 0 && lf >= 0 && lt !== lf) return false;
    if (x > HOUSE_BOX.x0 && x < HOUSE_BOX.x1 && y > HOUSE_BOX.y0 && y < HOUSE_BOX.y1) return false;
    if (Math.hypot(x - LIGHTHOUSE.x, (y - LIGHTHOUSE.y + 0.15) * 1.6) < LIGHTHOUSE_R) return false;
    if (Math.hypot(x - WATERFALL.x, (y - WATERFALL.y + 0.3) * 1.4) < WATERFALL_R) return false;
    for (const s of solids) {
      if (Math.abs(s.x - x) > 1.5 || Math.abs(s.y - y) > 1.5) continue;
      if (Math.hypot(s.x - x, (s.y - y) * 1.4) < s.solid + PR) return false;
    }
    for (const n of npcs) if (Math.hypot(n.x - x, (n.y - y) * 1.4) < 0.36 + PR) return false;
    return x > 0.5 && y > 0.5 && x < W - 0.5 && y < H - 0.5;
  }

  /* ---------- cámara ---------- */
  function playZoom() {
    const w = innerWidth, h = innerHeight;
    return Math.min(Math.min(w, h) / (10 * T), Math.max(w, h) / (17 * T));
  }
  /** Vista del mapa completo para la portada (deja sitio al letrero y al botón). */
  function overview() {
    const w = innerWidth, h = innerHeight;
    const top = Math.min(190, h * 0.225), bottom = Math.min(120, h * 0.145);
    const bx0 = 3, bx1 = W - 3, by0 = 1.6, by1 = H - 1.2;
    const zoom = Math.min(w / ((bx1 - bx0) * T), (h - top - bottom) / ((by1 - by0) * T));
    const cx = ((bx0 + bx1) / 2) * T;
    const cy = ((by0 + by1) / 2) * T - ((top - bottom) / 2) / zoom;
    return { zoom, cx, cy };
  }
  function camera() {
    const ov = overview();
    const t = ease(S.blend);
    const z = 1 / lerp(1 / ov.zoom, 1 / playZoom(), t);
    return { zoom: z, x: lerp(ov.cx, S.cam.x, t), y: lerp(ov.cy, S.cam.y, t) };
  }

  /* ---------- actualización ---------- */
  function update(dt: number) {
    S.time += dt;
    S.cooldown = Math.max(0, S.cooldown - dt);
    S.sunset += (S.sunsetTarget - S.sunset) * Math.min(1, dt * 0.5);
    if (S.blend < S.blendTarget) S.blend = Math.min(S.blendTarget, S.blend + dt / 1.6);
    updateDialog(dt);
    updateParticles(dt);
    if (S.fireworks) {
      S.fireworks -= dt;
      if (S.fireworks <= 0) { screenBurst(); S.fireworks = 0.55 + Math.random() * 0.4; }
    }

    const p = S.player;
    p.moving = false;
    if (S.mode === 'play') {
      let ix = 0, iy = 0;
      if (keys.has('arrowleft') || keys.has('a')) ix -= 1;
      if (keys.has('arrowright') || keys.has('d')) ix += 1;
      if (keys.has('arrowup') || keys.has('w')) iy -= 1;
      if (keys.has('arrowdown') || keys.has('s')) iy += 1;
      if (joy.active && Math.hypot(joy.dx, joy.dy) > 0.18) { ix = joy.dx; iy = joy.dy; }
      const mag = Math.hypot(ix, iy);
      if (mag > 0) {
        const sp = 4.3 * Math.min(1, mag);
        const vx = (ix / mag) * sp * dt, vy = (iy / mag) * sp * dt;
        if (free(p.x + vx, p.y, p.x, p.y)) p.x += vx;
        if (free(p.x, p.y + vy, p.x, p.y)) p.y += vy;
        p.moving = true;
        if (Math.abs(ix) > Math.abs(iy) * 0.9) { p.dir = 'side'; p.flip = ix < 0; }
        else p.dir = iy < 0 ? 'up' : 'down';
        p.anim += dt;
        p.step += dt;
        if (p.step > 0.28) { p.step = 0; sfx('step'); }
      } else p.anim = 0;

      if (S.cooldown <= 0) {
        for (const n of npcs) {
          const d = Math.hypot(n.x - p.x, (n.y - p.y) * 1.2);
          const auto = (n.stop >= 0 && n.stop === S.found && !n.found && d < 1.45) || (n.id === 'lola' && S.allFound && !S.ended && d < 1.6);
          if (auto) { void meet(n); break; }
        }
      }
    }

    const zoom = playZoom();
    const hw = innerWidth / 2 / zoom, hh = innerHeight / 2 / zoom;
    let tx = p.x * T, ty = (p.y - 0.5) * T;
    tx = Math.max(hw - T, Math.min(W * T - hw + T, tx));
    ty = Math.max(hh - T, Math.min(H * T - hh + T, ty));
    if (S.blend === 0) { S.cam.x = tx; S.cam.y = ty; }
    S.cam.x += (tx - S.cam.x) * Math.min(1, dt * 6);
    S.cam.y += (ty - S.cam.y) * Math.min(1, dt * 6);
  }

  /* ---------- dibujo ---------- */
  let dpr = 1;
  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
  }
  window.addEventListener('resize', resize);
  resize();

  function drawSprite(img: HTMLImageElement, x: number, y: number, h: number, flip = false, sy = 1) {
    if (!img.complete || !img.naturalWidth) return;
    const w = (h * 100) / 120;
    ctx.save();
    ctx.translate(x * T, y * T);
    if (flip) ctx.scale(-1, 1);
    ctx.scale(1, sy);
    ctx.drawImage(img, -w / 2, -h * (116 / 120), w, h);
    ctx.restore();
  }

  const markerState = (n: NPC) => (n.found ? 'done' : n.stop === S.found ? 'next' : 'locked');

  function drawNPC(n: NPC) {
    const bob = 1 + Math.sin(S.time * 2.2 + n.x) * 0.018;
    const blinking = (S.time + n.blinkAt) % 3.8 < 0.13;
    shadow(ctx, n.x * T, n.y * T, 20, 7);
    drawSprite(npcImg[n.id][blinking ? 1 : 0], n.x, n.y, T * 1.6, false, bob);
  }

  function drawOverhead(n: NPC) {
    const x = n.x * T, top = n.y * T - T * 1.75;
    if (n.stop >= 0 && !n.found && n.stop === S.found) {
      const fy = top - 6 + Math.sin(S.time * 3 + n.x) * 4;
      ctx.fillStyle = 'rgba(255,255,255,.95)';
      circle(ctx, x, fy, 13);
      ctx.fillStyle = '#ff6f8f';
      heart(ctx, x, fy + 1, 7.5 + Math.sin(S.time * 6) * 0.6);
      return;
    }
    const lolaWaiting = n.id === 'lola' && S.allFound && !S.ended;
    if (lolaWaiting) {
      const fy = top - 6 + Math.sin(S.time * 3) * 4;
      ctx.fillStyle = '#fff';
      circle(ctx, x, fy, 14);
      ctx.fillStyle = '#ef7a85';
      ctx.font = 'bold 16px Fredoka, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('✉', x, fy + 6);
    }
    const d = Math.hypot(n.x - S.player.x, (n.y - S.player.y) * 1.2);
    if (d < 1.9 && S.mode === 'play') {
      const by = top - (lolaWaiting ? 34 : 4);
      ctx.fillStyle = '#fffaf0';
      ctx.beginPath(); ctx.roundRect(x - 22, by - 14, 44, 24, 12); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x - 5, by + 9); ctx.lineTo(x, by + 15); ctx.lineTo(x + 5, by + 9); ctx.fill();
      ctx.fillStyle = '#8a6a50';
      for (let i = -1; i <= 1; i++) circle(ctx, x + i * 9, by - 2, 2.6 + (Math.floor(S.time * 3) % 3 === i + 1 ? 0.9 : 0));
    }
  }

  function drawButterflies() {
    for (const b of butterflies) {
      const t = S.time * 0.5 + b.ph;
      const x = (b.cx + Math.cos(t) * b.r + Math.sin(t * 2.3) * 0.5) * T;
      const y = (b.cy + Math.sin(t * 1.3) * b.r * 0.6) * T - 30;
      const f = Math.abs(Math.sin(S.time * 14 + b.ph));
      ctx.fillStyle = b.col;
      ctx.beginPath(); ctx.ellipse(x - 4 * f, y, 5 * f + 1, 6, -0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + 4 * f, y, 5 * f + 1, 6, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5a4636';
      ctx.fillRect(x - 0.8, y - 4, 1.6, 8);
    }
  }

  const toScreen = (cam: { zoom: number; x: number; y: number }, x: number, y: number) => ({
    x: (x * T - cam.x) * cam.zoom + innerWidth / 2,
    y: (y * T - cam.y) * cam.zoom + innerHeight / 2,
  });

  /** Letreros grandes en pantalla para la vista del mapa (portada). */
  function drawMapLabels(cam: { zoom: number; x: number; y: number }, alpha: number) {
    if (alpha <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    const fs = Math.max(13, Math.min(20, innerWidth / 22));
    ctx.font = `600 ${fs}px Fredoka, Nunito, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const boxes = npcs.filter((n) => n.stop >= 0).map((n) => {
      const sp = toScreen(cam, n.x + STOPS[n.stop].side * 1.1, n.y + 1.6);
      const text = virt[n.stop].etiqueta;
      const bw = ctx.measureText(text).width + fs * 2.6, bh = fs * 1.9;
      return { x: sp.x, y: sp.y, bw, bh, text };
    });
    const fit = (b: { x: number; bw: number }) => { b.x = Math.max(b.bw / 2 + 6, Math.min(innerWidth - b.bw / 2 - 6, b.x)); };
    boxes.forEach(fit);
    // si dos letreros se pisan, se separan por el eje donde menos se solapan
    for (let it = 0; it < 14; it++)
      for (let i = 0; i < boxes.length; i++)
        for (let j = i + 1; j < boxes.length; j++) {
          const p = boxes[i], q = boxes[j];
          const ox = (p.bw + q.bw) / 2 + 8 - Math.abs(p.x - q.x), oy = (p.bh + q.bh) / 2 + 8 - Math.abs(p.y - q.y);
          if (ox <= 0 || oy <= 0) continue;
          if (oy < ox) { const d = (p.y <= q.y ? -1 : 1) * oy / 2; p.y += d; q.y -= d; }
          else { const d = (p.x <= q.x ? -1 : 1) * ox / 2; p.x += d; q.x -= d; fit(p); fit(q); }
        }
    boxes.forEach(({ x, y, bw, bh, text }) => {
      const sp = { y };
      ctx.fillStyle = 'rgba(70,40,20,.25)';
      ctx.beginPath(); ctx.roundRect(x - bw / 2, sp.y - bh / 2 + 4, bw, bh, bh / 2); ctx.fill();
      ctx.fillStyle = '#8b5e34';
      ctx.beginPath(); ctx.roundRect(x - bw / 2, sp.y - bh / 2 + 2, bw, bh, bh / 2); ctx.fill();
      ctx.fillStyle = '#e8b77d';
      ctx.beginPath(); ctx.roundRect(x - bw / 2, sp.y - bh / 2, bw, bh, bh / 2); ctx.fill();
      ctx.fillStyle = '#f3cc98';
      ctx.beginPath(); ctx.roundRect(x - bw / 2 + 5, sp.y - bh / 2 + 3, bw - 10, bh * 0.22, 4); ctx.fill();
      ctx.save();
      ctx.translate(x - bw / 2 + fs * 0.75, sp.y);
      ctx.scale(fs / 16, fs / 16);
      leaf(ctx, 0, 0, -1);
      ctx.restore();
      ctx.save();
      ctx.translate(x + bw / 2 - fs * 0.75, sp.y);
      ctx.scale(fs / 16, fs / 16);
      leaf(ctx, 0, 0, 1);
      ctx.restore();
      ctx.fillStyle = '#4e321c';
      ctx.fillText(text, x, sp.y + 1);
    });
    // chincheta con la cara de la jugadora sobre la primera parada
    const first = npcs[S.found] && npcs[S.found].stop >= 0 ? npcs[S.found] : npcs[0];
    const pin = toScreen(cam, first.x, first.y - 1.9);
    const r = Math.max(20, Math.min(30, innerWidth / 15));
    const by = pin.y - r - 6 + Math.sin(S.time * 3) * 3;
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    circle(ctx, pin.x, by + 3, r + 3);
    ctx.fillStyle = '#ffffff';
    circle(ctx, pin.x, by, r + 3);
    ctx.beginPath(); ctx.moveTo(pin.x - 8, by + r); ctx.lineTo(pin.x, by + r + 12); ctx.lineTo(pin.x + 8, by + r); ctx.fill();
    ctx.fillStyle = '#ffe9ef';
    circle(ctx, pin.x, by, r);
    if (playerPortrait.complete && playerPortrait.naturalWidth) {
      ctx.save();
      ctx.beginPath(); ctx.arc(pin.x, by, r, 0, Math.PI * 2); ctx.clip();
      const ih = r * 3.3;
      ctx.drawImage(playerPortrait, pin.x - (ih * 100) / 120 / 2, by - r * 1.05, (ih * 100) / 120, ih);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawIndicator(cam: { zoom: number; x: number; y: number }) {
    let target: Pt | null = null;
    if (S.allFound && !S.ended) target = lola;
    else if (!S.allFound) target = npcs[S.found];
    if (!target || S.mode !== 'play') return;
    const cw = innerWidth, ch = innerHeight;
    const s = toScreen(cam, target.x, target.y - 1);
    const m = 46;
    if (s.x > m && s.x < cw - m && s.y > m + 60 && s.y < ch - m) return;
    const cx = cw / 2, cy = ch / 2;
    const ang = Math.atan2(s.y - cy, s.x - cx);
    const k = Math.min(Math.abs((cw / 2 - m) / Math.cos(ang)), Math.abs((ch / 2 - m - 30) / Math.sin(ang)));
    const ix = cx + Math.cos(ang) * k, iy = cy + Math.sin(ang) * k + 15;
    ctx.save();
    ctx.translate(ix, iy);
    ctx.fillStyle = 'rgba(80,50,40,.18)';
    circle(ctx, 0, 3, 21);
    ctx.fillStyle = '#fffaf0';
    circle(ctx, 0, 0, 20);
    ctx.rotate(ang);
    ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(16, -9); ctx.lineTo(16, 9); ctx.fill();
    ctx.rotate(-ang);
    ctx.fillStyle = '#ff6f8f';
    heart(ctx, 0, 1, 9 + Math.sin(S.time * 5) * 0.8);
    ctx.restore();
  }

  function draw() {
    const cw = innerWidth, ch = innerHeight;
    const cam = camera();
    const zoom = cam.zoom;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sea = ctx.createLinearGradient(0, 0, 0, ch);
    sea.addColorStop(0, '#62cbe6');
    sea.addColorStop(1, '#36a8d2');
    ctx.fillStyle = sea;
    ctx.fillRect(0, 0, cw, ch);

    const s = dpr * zoom;
    ctx.setTransform(s, 0, 0, s, Math.round((cw * dpr) / 2 - cam.x * s), Math.round((ch * dpr) / 2 - cam.y * s));
    const vx0 = Math.floor((cam.x - cw / 2 / zoom) / T) - 2;
    const vx1 = Math.ceil((cam.x + cw / 2 / zoom) / T) + 2;
    const vy0 = Math.floor((cam.y - ch / 2 / zoom) / T) - 2;
    const vy1 = Math.ceil((cam.y + ch / 2 / zoom) / T) + 3;
    drawTerrain(ctx, world, vx0, vy0, vx1, vy1, S.time);

    const vis = (x: number, y: number) => x > vx0 - 1 && x < vx1 + 1 && y > vy0 - 1 && y < vy1 + 3;
    // en la vista de mapa todo se dibuja más grande, como en una maqueta
    const big = lerp(1.6, 1, ease(Math.min(1, S.blend * 1.3)));
    const grow = (x: number, y: number, fn: () => void) => {
      if (big < 1.01) return fn();
      ctx.save();
      ctx.translate(x * T, y * T);
      ctx.scale(big, big);
      ctx.translate(-x * T, -y * T);
      fn();
      ctx.restore();
    };
    for (const d of world.decor) if (vis(d.x, d.y)) grow(d.x, d.y, () => drawDecor(ctx, d, S.time));
    const overviewScale = Math.max(1, 0.55 / zoom);
    drawRoute(ctx, legs, S.allFound ? total : S.found, S.time, Math.min(2.6, overviewScale), S.blend < 0.35);
    for (const n of npcs) if (n.stop >= 0) grow(n.x, n.y + 0.85, () => drawMarker(ctx, n.x, n.y + 0.85, markerState(n), S.time));

    type Item = { x: number; y: number; draw: () => void };
    const items: Item[] = [];
    const night = S.sunset * 0.8;
    for (const pr of world.props) if (vis(pr.x, pr.y)) items.push({ x: pr.x, y: pr.y, draw: () => drawPropNice(ctx, pr, S.time, night) });
    items.push({ x: HOUSE.x, y: HOUSE.y, draw: () => drawHouse(ctx, S.time, night) });
    items.push({ x: LIGHTHOUSE.x, y: LIGHTHOUSE.y, draw: () => drawLighthouse(ctx, S.time, night) });
    items.push({ x: WATERFALL.x, y: WATERFALL.y, draw: () => drawWaterfall(ctx, S.time) });
    for (const n of npcs) {
      if (!vis(n.x, n.y)) continue;
      items.push({ x: n.x, y: n.y, draw: () => drawNPC(n) });
      if (n.stop >= 0 && S.blend > 0.4) {
        const st = STOPS[n.stop];
        const sx = n.x + st.side * 1.9, sy = n.y + 0.45;
        items.push({ x: sx, y: sy, draw: () => drawSign(ctx, sx, sy, virt[n.stop].etiqueta, n.found) });
      }
    }
    const p = S.player;
    items.push({
      x: p.x,
      y: p.y,
      draw: () => {
        const cycle = [1, 0, 2, 0];
        const frame = p.moving ? cycle[Math.floor(p.anim * 8) % 4] : 0;
        const bounce = p.moving ? Math.abs(Math.sin(p.anim * 12.5)) * 0.04 : 0;
        shadow(ctx, p.x * T, p.y * T, 17, 6);
        drawSprite(playerImg[p.dir][frame], p.x, p.y - bounce, T * 1.55, p.dir === 'side' && p.flip, p.moving ? 1 : 1 + Math.sin(S.time * 2.5) * 0.012);
      },
    });
    items.sort((a, b) => a.y - b.y);
    for (const it of items) grow(it.x, it.y, it.draw);
    drawButterflies();
    if (S.blend > 0.6) for (const n of npcs) if (vis(n.x, n.y)) drawOverhead(n);

    for (const pt of particles) {
      if (pt.screen) continue;
      ctx.globalAlpha = Math.max(0, 1 - pt.life / pt.max);
      ctx.fillStyle = pt.color;
      if (pt.kind === 'heart') heart(ctx, pt.x * T, pt.y * T, pt.size);
      else circle(ctx, pt.x * T, pt.y * T, pt.size * 0.45);
    }
    ctx.globalAlpha = 1;

    // capa de pantalla
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (S.sunset > 0.01) {
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = `rgba(255,${Math.round(200 - 30 * S.sunset)},${Math.round(185 - 25 * S.sunset)},${0.5 * S.sunset})`;
      ctx.fillRect(0, 0, cw, ch);
      ctx.globalCompositeOperation = 'screen';
      const g = ctx.createLinearGradient(0, 0, 0, ch);
      g.addColorStop(0, `rgba(255,120,150,${0.28 * S.sunset})`);
      g.addColorStop(1, `rgba(255,190,90,${0.18 * S.sunset})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, cw, ch);
      ctx.globalCompositeOperation = 'source-over';
    }
    drawMapLabels(cam, 1 - S.blend * 2.5);
    for (const pt of particles) {
      if (!pt.screen) continue;
      ctx.globalAlpha = Math.max(0, pt.kind === 'petal' ? 0.85 : 1 - pt.life / pt.max);
      ctx.fillStyle = pt.color;
      if (pt.kind === 'petal') {
        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.rotate(pt.rot);
        ctx.beginPath(); ctx.ellipse(0, 0, pt.size, pt.size * 0.55, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      } else circle(ctx, pt.x, pt.y, pt.size);
    }
    ctx.globalAlpha = 1;
    drawIndicator(cam);
  }

  /* ---------- bucle ---------- */
  let last = performance.now();
  function loop(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // Ganchos para pruebas automáticas (no afectan al juego)
  (window as unknown as { __isla: unknown }).__isla = {
    state: S,
    npcs,
    teleport(x: number, y: number) { S.player.x = x; S.player.y = y; },
    tileAt: (x: number, y: number) => world.at(x, y) as Tile,
    free,
  };
  void drawShell; // disponible para futuras decoraciones
}
