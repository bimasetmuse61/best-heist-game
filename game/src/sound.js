// Tiny synthesized sounds: no audio files, just an oscillator and an envelope.
// The context wakes on the first key press or click, as browsers require.

let context = null;

export function wakeSound() {
  try {
    if (context === null) context = new (window.AudioContext || window.webkitAudioContext)();
    if (context.state === 'suspended') context.resume();
  } catch {
    context = null;
  }
}

function tone(frequency, seconds, type, volume, slideTo) {
  if (context === null) return;
  try {
    const start = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(slideTo, start + seconds);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + seconds);
  } catch {
    // Sound is a garnish; a silent game still plays.
  }
}

export function playCoinToss() {
  tone(1560, 0.16, 'sine', 0.12, 2093);
}

export function playLoot() {
  tone(880, 0.09, 'triangle', 0.14);
  setTimeout(() => tone(1318, 0.14, 'triangle', 0.12), 55);
}

export function playSpotted() {
  tone(220, 0.22, 'sawtooth', 0.1, 110);
}

export function playGetaway() {
  tone(659, 0.12, 'triangle', 0.13);
  setTimeout(() => tone(880, 0.12, 'triangle', 0.13), 100);
  setTimeout(() => tone(1318, 0.24, 'triangle', 0.13), 200);
}
