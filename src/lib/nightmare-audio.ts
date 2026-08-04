/**
 * Web Audio synth for Skin of Sin — Nightmare Mirror.
 * Starts muted (required for mobile autoplay policies).
 * Call unlock() from a user tap, then setMuted(false) to hear sound.
 */

type AudioBundle = {
  ctx: AudioContext;
  master: GainNode;
  thrumOsc: OscillatorNode;
  thrumGain: GainNode;
};

let bundle: AudioBundle | null = null;
let muted = true;
let lastDragAt = 0;
let lastBeatAt = 0;

function getCtxClass(): typeof AudioContext | null {
  if (typeof window === "undefined") return null;
  return (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext ||
    null
  );
}

export function isMuted() {
  return muted;
}

export function ensureAudio(): boolean {
  if (bundle) return true;
  const Ctx = getCtxClass();
  if (!Ctx) return false;
  try {
    const ctx = new Ctx();
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    const thrumOsc = ctx.createOscillator();
    thrumOsc.type = "sine";
    thrumOsc.frequency.value = 42;
    const thrumGain = ctx.createGain();
    thrumGain.gain.value = 0.012;
    thrumOsc.connect(thrumGain);
    thrumGain.connect(master);
    thrumOsc.start();

    bundle = { ctx, master, thrumOsc, thrumGain };
    return true;
  } catch {
    return false;
  }
}

/** Must be called from a user gesture (tap). Resumes AudioContext on iOS/Android. */
export async function unlock(): Promise<boolean> {
  if (!ensureAudio() || !bundle) return false;
  try {
    if (bundle.ctx.state === "suspended") {
      await bundle.ctx.resume();
    }
    return true;
  } catch {
    return false;
  }
}

export function setMuted(next: boolean) {
  muted = next;
  if (!bundle) return;
  const t = bundle.ctx.currentTime;
  bundle.master.gain.cancelScheduledValues(t);
  bundle.master.gain.linearRampToValueAtTime(next ? 0 : 0.38, t + 0.08);
}

export function updateThrum(segments: number, frozen: boolean) {
  if (!bundle || muted) return;
  const t = bundle.ctx.currentTime;
  bundle.thrumOsc.frequency.setTargetAtTime(32 + segments * 2.2, t, 0.25);
  bundle.thrumGain.gain.setTargetAtTime(
    frozen ? 0.004 : 0.01 + segments * 0.0012,
    t,
    0.3,
  );
}

export function fleshTap() {
  if (!bundle || muted) return;
  const { ctx, master } = bundle;
  const t = ctx.currentTime;
  const size = 2048;
  const noise = ctx.createBuffer(1, size, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < size; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / 400);
  }
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 600;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.22, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
  src.connect(filter);
  filter.connect(g);
  g.connect(master);
  src.start(t);
  src.stop(t + 0.15);
}

export function wetDrag(intensity: number) {
  if (!bundle || muted) return;
  const now = performance.now();
  if (now - lastDragAt < 55) return;
  lastDragAt = now;
  const { ctx, master } = bundle;
  const t = ctx.currentTime;
  const n = ctx.createBuffer(1, 1024, ctx.sampleRate);
  const d = n.getChannelData(0);
  for (let i = 0; i < 1024; i++) {
    d[i] = (Math.random() * 2 - 1) * Math.exp(-i / 180);
  }
  const src = ctx.createBufferSource();
  src.buffer = n;
  const f = ctx.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = 180 + intensity * 220;
  f.Q.value = 0.7;
  const g = ctx.createGain();
  g.gain.value = 0.03 + intensity * 0.05;
  src.connect(f);
  f.connect(g);
  g.connect(master);
  src.start(t);
  src.stop(t + 0.05);
}

/** Soft double thump — call roughly every ~1s when heartbeat is active. */
export function heartbeatThump() {
  if (!bundle || muted) return;
  const now = performance.now();
  if (now - lastBeatAt < 900) return;
  lastBeatAt = now;
  const { ctx, master } = bundle;
  const t = ctx.currentTime;

  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(58, t);
  o.frequency.exponentialRampToValueAtTime(28, t + 0.12);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.2, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  o.connect(g);
  g.connect(master);
  o.start(t);
  o.stop(t + 0.2);

  const o2 = ctx.createOscillator();
  const g2 = ctx.createGain();
  o2.type = "sine";
  o2.frequency.value = 40;
  g2.gain.setValueAtTime(0.0001, t + 0.16);
  g2.gain.exponentialRampToValueAtTime(0.1, t + 0.18);
  g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
  o2.connect(g2);
  g2.connect(master);
  o2.start(t + 0.16);
  o2.stop(t + 0.35);
}
