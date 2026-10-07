let audioCtx: AudioContext | null = null;
const listeners = new Set<(isPlaying: boolean) => void>();
let activeAudioCount = 0;

function notifyListeners(isPlaying: boolean) {
  listeners.forEach(fn => fn(isPlaying));
}

export function subscribeAudioPlayback(callback: (isPlaying: boolean) => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playPianoNote(freq: number, duration: number = 2.0) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    activeAudioCount++;
    notifyListeners(true);

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.7, now);
    masterGain.connect(ctx.destination);

    // Realistic acoustic piano synthesis (additive multi-harmonic + resonant filter + hammer attack)
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(freq * 8, 8000), now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.5, 400), now + duration * 0.8);
    filter.Q.setValueAtTime(1.5, now);
    filter.connect(masterGain);

    const harmonics = [
      { mult: 1, gainRatio: 1.0, decayRate: 1.0, detune: 0 },
      { mult: 1, gainRatio: 0.7, decayRate: 1.0, detune: 2 },
      { mult: 2, gainRatio: 0.55, decayRate: 0.75, detune: -1 },
      { mult: 3, gainRatio: 0.28, decayRate: 0.55, detune: 1.5 },
      { mult: 4, gainRatio: 0.16, decayRate: 0.4, detune: -2 },
      { mult: 5, gainRatio: 0.08, decayRate: 0.3, detune: 0.8 },
      { mult: 6, gainRatio: 0.04, decayRate: 0.22, detune: -1.2 },
    ];

    harmonics.forEach(({ mult, gainRatio, decayRate, detune }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = mult % 2 === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq * mult, now);
      osc.detune.setValueAtTime(detune, now);

      const harmDuration = Math.max(0.4, duration * decayRate);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(gainRatio * 0.4, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(gainRatio * 0.15, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + harmDuration);

      osc.connect(gain);
      gain.connect(filter);

      osc.start(now);
      osc.stop(now + harmDuration + 0.05);
    });

    // Hammer transient click
    const hammerOsc = ctx.createOscillator();
    const hammerGain = ctx.createGain();
    hammerOsc.type = 'sine';
    hammerOsc.frequency.setValueAtTime(120, now);
    hammerOsc.frequency.exponentialRampToValueAtTime(40, now + 0.03);

    hammerGain.gain.setValueAtTime(0.2, now);
    hammerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

    hammerOsc.connect(hammerGain);
    hammerGain.connect(masterGain);
    hammerOsc.start(now);
    hammerOsc.stop(now + 0.04);

    setTimeout(() => {
      activeAudioCount = Math.max(0, activeAudioCount - 1);
      if (activeAudioCount === 0) {
        notifyListeners(false);
      }
    }, Math.min(duration * 1000, 1600));
  } catch (err) {
    console.error('Audio error:', err);
    notifyListeners(false);
  }
}

// Play a sequence of pitches in order
export function playPitchSequence(pitches: number[], intervalMs: number = 700) {
  pitches.forEach((pitch, index) => {
    setTimeout(() => {
      playPianoNote(pitch, 1.8);
    }, index * intervalMs);
  });
}

export function playSuccessChime() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteTime = now + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.25, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.7);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.75);
    });
  } catch (err) {
    console.error('Chime error:', err);
  }
}

export function playLevelUnlockedFanfare() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const chord = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C major full sparkle
    
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteTime = now + idx * 0.06;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.3, noteTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 1.25);
    });
  } catch (err) {
    console.error('Fanfare error:', err);
  }
}

export function playErrorBuzz() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.18);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  } catch (err) {
    console.error('Error sound error:', err);
  }
}
