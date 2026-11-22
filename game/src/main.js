// Boot and loop: fit the canvas, run the world in fixed steps, route clicks
// (start, restart, or a coin toss), and trigger the little synthesized sounds.
// With ?shot=<scene> the page stages one deterministic frame and stops, which
// is how the entry's screenshots are taken.
import { STEP, VIEW_HEIGHT, VIEW_WIDTH } from './config.js';
import { attachInput, readInput, takeClick } from './input.js';
import { drawWorld } from './render.js';
import { stageShot } from './shots.js';
import { playCoinToss, playGetaway, playLoot, playSpotted, wakeSound } from './sound.js';
import { SCREEN_CAUGHT, SCREEN_GETAWAY, SCREEN_PLAY, createWorld, startHeist, stepWorld, tossCoin } from './world.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');
canvas.width = VIEW_WIDTH;
canvas.height = VIEW_HEIGHT;

function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW_WIDTH, window.innerHeight / VIEW_HEIGHT);
  canvas.style.width = `${Math.floor(VIEW_WIDTH * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW_HEIGHT * scale)}px`;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

const world = createWorld();
const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');

if (shotName !== null) {
  stageShot(shotName, world);
  drawWorld(ctx, world);
  document.title = `Vaultbreak — shot ${shotName}`;
} else {
  let previousScreen = world.screen;
  let previousLoot = 0;
  let previousAlarm = 0;

  function announce() {
    if (world.screen !== previousScreen) {
      if (world.screen === SCREEN_CAUGHT) status.textContent = `Busted. ${world.caughtReason}`;
      else if (world.screen === SCREEN_GETAWAY) status.textContent = 'Clean getaway.';
      else if (world.screen === SCREEN_PLAY) status.textContent = 'The heist is on.';
      previousScreen = world.screen;
    }
  }

  function react() {
    if (world.lootTaken.size > previousLoot) playLoot();
    previousLoot = world.lootTaken.size;
    if (world.alarm >= 100 && previousAlarm < 100) playSpotted();
    previousAlarm = world.alarm;
  }

  attachInput(canvas, () => {
    wakeSound();
    if (world.screen !== SCREEN_PLAY) {
      startHeist(world);
      previousLoot = 0;
      previousAlarm = 0;
    }
  });

  let last = performance.now();
  let accumulator = 0;
  function frame(now) {
    accumulator += Math.min(0.25, (now - last) / 1000);
    last = now;
    while (accumulator >= STEP) {
      const click = takeClick();
      if (click !== null && world.screen === SCREEN_PLAY) {
        if (tossCoin(world, click.x, click.y)) playCoinToss();
      }
      stepWorld(world, readInput(), STEP);
      accumulator -= STEP;
    }
    react();
    announce();
    drawWorld(ctx, world);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
