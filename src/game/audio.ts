/* Audio sintetizado con WebAudio: voces balbuceadas, música suave y efectos.
   No hay archivos de sonido; todo se genera al vuelo. */

let ctx: AudioContext | null = null;
let master: GainNode;
let musicGain: GainNode;
let muted = false;
let musicTimer: number | undefined;

export function initAudio() {
  if (ctx) {
    void ctx.resume();
    return;
  }
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.8;
  master.connect(ctx.destination);
  musicGain = ctx.createGain();
  musicGain.gain.value = 0.32;
  musicGain.connect(master);
  startMusic();
}

export function setMuted(m: boolean) {
  muted = m;
  if (master && ctx) master.gain.setTargetAtTime(m ? 0 : 0.8, ctx.currentTime, 0.05);
}
export const isMuted = () => muted;

function tone(freq: number, start: number, dur: number, type: OscillatorType, vol: number, dest: AudioNode = master) {
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(dest);
  o.start(start);
  o.stop(start + dur + 0.05);
}

/** Una sílaba de "voz" para la letra dada. */
export function blip(ch: string, pitch: number) {
  if (!ctx || muted) return;
  const lower = ch.toLowerCase();
  if (!/[a-záéíóúñü]/.test(lower)) return;
  const vowels = 'aeiouáéíóú';
  const base = 330 * pitch;
  const code = lower.charCodeAt(0);
  const isV = vowels.includes(lower);
  const f = base * (1 + ((code * 7) % 12) / 24) * (isV ? 1.12 : 1);
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(f, t);
  o.frequency.exponentialRampToValueAtTime(f * (isV ? 1.18 : 0.92), t + 0.06);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.13, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + 0.09);
}

export function sfx(kind: 'pop' | 'chime' | 'open' | 'step' | 'fanfare') {
  if (!ctx || muted) return;
  const t = ctx.currentTime;
  if (kind === 'pop') tone(880, t, 0.08, 'sine', 0.12);
  if (kind === 'open') {
    tone(660, t, 0.1, 'sine', 0.1);
    tone(990, t + 0.06, 0.12, 'sine', 0.08);
  }
  if (kind === 'step') tone(180 + Math.random() * 40, t, 0.04, 'triangle', 0.025);
  if (kind === 'chime') [784, 988, 1175, 1568].forEach((f, i) => tone(f, t + i * 0.09, 0.5, 'sine', 0.12));
  if (kind === 'fanfare')
    [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, t + i * 0.14, i === 6 ? 1.4 : 0.3, 'triangle', 0.1));
}

/* Música: progresión I–vi–IV–V en Do con arpegios pentatónicos. */
const CHORDS = [
  [261.63, 329.63, 392.0],
  [220.0, 261.63, 329.63],
  [174.61, 220.0, 261.63],
  [196.0, 246.94, 293.66],
];
const PENTA = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];

function startMusic() {
  if (!ctx) return;
  const beat = 60 / 84;
  let bar = 0;
  let next = ctx.currentTime + 0.2;
  const schedule = () => {
    if (!ctx) return;
    while (next < ctx.currentTime + 1.5) {
      const ch = CHORDS[bar % 4];
      ch.forEach((f) => tone(f / 2, next, beat * 4, 'sine', 0.05, musicGain));
      for (let i = 0; i < 8; i++) {
        if (Math.random() < 0.35) continue;
        const pool = PENTA.filter((p) => ch.some((c) => Math.abs(Math.log2(p / (c * 2)) % 1) < 0.01) || Math.random() < 0.4);
        const f = pool[Math.floor(Math.random() * pool.length)] ?? PENTA[0];
        tone(f, next + i * (beat / 2), beat * 0.9, 'triangle', 0.035, musicGain);
      }
      next += beat * 4;
      bar++;
    }
  };
  schedule();
  musicTimer = window.setInterval(schedule, 400);
}

export function stopMusic() {
  if (musicTimer) clearInterval(musicTimer);
}
