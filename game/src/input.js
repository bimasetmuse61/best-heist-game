// Keyboard and mouse state: the world reads a plain input object each step,
// and clicks arrive as world-space points the main loop routes (start the job,
// restart it, or toss a coin where the player clicked).
import { VIEW_HEIGHT, VIEW_WIDTH } from './config.js';

const held = new Set();
let clickPoint = null;

const KEYMAP = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ShiftLeft: 'sneak',
  ShiftRight: 'sneak',
};

export function attachInput(canvas, onPress) {
  window.addEventListener('keydown', (event) => {
    if (KEYMAP[event.code]) {
      held.add(KEYMAP[event.code]);
      event.preventDefault();
    }
    if (event.code === 'Enter' || event.code === 'Space') onPress();
  });
  window.addEventListener('keyup', (event) => {
    if (KEYMAP[event.code]) held.delete(KEYMAP[event.code]);
  });
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    clickPoint = {
      x: ((event.clientX - rect.left) / rect.width) * VIEW_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * VIEW_HEIGHT,
    };
    onPress();
  });
}

export function readInput() {
  return {
    left: held.has('left'),
    right: held.has('right'),
    up: held.has('up'),
    down: held.has('down'),
    sneak: held.has('sneak'),
  };
}

/** The last click point in world coordinates, or null; reading it clears it. */
export function takeClick() {
  const point = clickPoint;
  clickPoint = null;
  return point;
}
