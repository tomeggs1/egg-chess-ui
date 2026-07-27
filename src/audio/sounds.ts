// Subtle move/board sounds, synthesized with the Web Audio API rather than
// shipped as audio files: no binary assets to bundle or license, and every
// sound is tunable here. All sounds are short percussive "knocks" kept
// deliberately quiet — see MASTER_GAIN.

export type SoundType = "move" | "capture" | "check" | "castle" | "gameEnd";

// Overall ceiling on how loud any sound can be, layered on top of each sound's
// own per-voice gains. Kept low so the effect stays subtle.
const MASTER_GAIN = 0.35;

// A single lazily-created context, shared across all plays. Created on first use
// (not at module load) so we never trip the browser's "AudioContext was not
// allowed to start" warning before the user has interacted with the page.
let ctx: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null; // no Web Audio support
    ctx = new Ctor();
  }
  return ctx;
}

/** A percussive tone: a quick attack then exponential decay to silence. */
function tone(
  ac: AudioContext,
  out: AudioNode,
  { freq, type = "sine", duration, gain, sweepTo, delay = 0 }: {
    freq: number;
    type?: OscillatorType;
    duration: number;
    gain: number;
    sweepTo?: number;
    delay?: number;
  },
) {
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (sweepTo) osc.frequency.exponentialRampToValueAtTime(sweepTo, t0 + duration);
  // Ramp from/to a small non-zero value so exponentialRamp stays valid.
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g).connect(out);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

/** A short decaying noise burst through a band-pass filter — the "click" of wood. */
function noiseClick(
  ac: AudioContext,
  out: AudioNode,
  { duration, gain, filterFreq, q = 1, delay = 0 }: {
    duration: number;
    gain: number;
    filterFreq: number;
    q?: number;
    delay?: number;
  },
) {
  const t0 = ac.currentTime + delay;
  const frames = Math.max(1, Math.floor(ac.sampleRate * duration));
  const buffer = ac.createBuffer(1, frames, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) {
    // White noise with a linear decay so it reads as a transient, not a hiss.
    data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  }
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = filterFreq;
  filter.Q.value = q;
  const g = ac.createGain();
  g.gain.value = gain;
  src.connect(filter).connect(g).connect(out);
  src.start(t0);
  src.stop(t0 + duration);
}

/** Render one sound into the given (already-gained) destination node. */
function render(ac: AudioContext, out: AudioNode, sound: SoundType) {
  switch (sound) {
    case "move":
      // A soft wooden knock: a bright click over a low thump.
      noiseClick(ac, out, { duration: 0.035, gain: 0.5, filterFreq: 2200, q: 0.8 });
      tone(ac, out, { freq: 170, type: "sine", duration: 0.09, gain: 0.45, sweepTo: 120 });
      break;
    case "capture":
      // Heavier and a touch longer — a meatier landing.
      noiseClick(ac, out, { duration: 0.05, gain: 0.7, filterFreq: 1500, q: 0.7 });
      tone(ac, out, { freq: 130, type: "sine", duration: 0.13, gain: 0.6, sweepTo: 80 });
      break;
    case "check":
      // A subtle two-note alert (up), distinct from a plain move.
      tone(ac, out, { freq: 660, type: "triangle", duration: 0.09, gain: 0.35 });
      tone(ac, out, { freq: 990, type: "triangle", duration: 0.11, gain: 0.32, delay: 0.08 });
      break;
    case "castle":
      // Two quick knocks — king and rook.
      noiseClick(ac, out, { duration: 0.035, gain: 0.5, filterFreq: 2200, q: 0.8 });
      tone(ac, out, { freq: 170, type: "sine", duration: 0.08, gain: 0.4, sweepTo: 120 });
      noiseClick(ac, out, { duration: 0.035, gain: 0.45, filterFreq: 2000, q: 0.8, delay: 0.11 });
      tone(ac, out, { freq: 150, type: "sine", duration: 0.08, gain: 0.38, sweepTo: 110, delay: 0.11 });
      break;
    case "gameEnd":
      // A gentle descending two-note chime to signal finality.
      tone(ac, out, { freq: 523, type: "sine", duration: 0.22, gain: 0.3 });
      tone(ac, out, { freq: 392, type: "sine", duration: 0.32, gain: 0.3, delay: 0.16 });
      break;
  }
}

/**
 * Play a board sound. `volume` (0–1) scales the master gain; callers gate on
 * their own mute preference before calling. Safe to call anywhere: it no-ops
 * without Web Audio support and never throws.
 */
export function playSound(sound: SoundType, volume = 1) {
  const ac = audioContext();
  if (!ac) return;
  // The context may be suspended until a user gesture; resuming is a no-op if
  // it's already running. Our own moves are gestures; by the time an opponent's
  // move arrives the user has already interacted, so it stays running.
  if (ac.state === "suspended") void ac.resume();
  try {
    const master = ac.createGain();
    master.gain.value = MASTER_GAIN * Math.max(0, Math.min(1, volume));
    master.connect(ac.destination);
    render(ac, master, sound);
  } catch {
    // Ignore audio failures — sound is a non-essential enhancement.
  }
}
