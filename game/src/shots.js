// Screenshot scenes behind ?shot=cover|vault|chase|getaway.
// Every scene is the real world in a real state, drawn by the real renderer:
// the cover is a scripted run played forward by the rules; the others stage a
// moment the rules produce (a lift in the vault, a chase in the grand hall,
// the getaway tally) and let it settle for a few steps before the frame.
import { STEP } from './config.js';
import { GUARD_CHASE } from './guards.js';
import { SCREEN_GETAWAY, SCREEN_PLAY, startHeist, stepWorld } from './world.js';

const NO_INPUT = { left: false, right: false, up: false, down: false, sneak: false };

function seekInput(world, target) {
  const thief = world.thief;
  const dx = target.x - thief.x;
  const dy = target.y - thief.y;
  return {
    left: dx < -6,
    right: dx > 6,
    up: dy < -6,
    down: dy > 6,
    sneak: false,
  };
}

/** Play the world forward while the thief walks a list of waypoints in order. */
function runRoute(world, waypoints, extraSeconds) {
  let index = 0;
  const maxSteps = 120 * 90;
  for (let step = 0; step < maxSteps && index < waypoints.length; step += 1) {
    const target = waypoints[index];
    if (Math.hypot(target.x - world.thief.x, target.y - world.thief.y) < 10) {
      index += 1;
      continue;
    }
    stepWorld(world, seekInput(world, target), STEP);
    if (world.screen !== SCREEN_PLAY) return;
  }
  for (let step = 0; step < extraSeconds * 120; step += 1) {
    stepWorld(world, NO_INPUT, STEP);
    if (world.screen !== SCREEN_PLAY) return;
  }
}

function settle(world, seconds) {
  for (let step = 0; step < seconds * 120; step += 1) {
    stepWorld(world, NO_INPUT, STEP);
    if (world.screen !== SCREEN_PLAY) return;
  }
}

function stageCover(world) {
  startHeist(world);
  // In the west door, up the carpet, and across the west gallery toward the
  // pillar's cover — caught mid-crossing while the patrol works the east door.
  runRoute(world, [
    { x: 200, y: 655 },
    { x: 280, y: 520 },
    { x: 280, y: 430 },
    { x: 215, y: 300 },
  ], 0.4);
}

function stageVault(world) {
  startHeist(world);
  // The thief has slipped the vault door and is at the Star's plinth; the
  // vault guard is turning back from the east door, the vault camera mid-sweep.
  world.thief.x = 1012;
  world.thief.y = 262;
  world.thief.angle = -Math.PI / 2;
  const guard = world.guards[2];
  guard.x = 830;
  guard.y = 262;
  guard.angle = 0.2;
  world.lootTaken.add('case-east-1');
  world.lootTaken.add('case-east-2');
  world.lootValue = 2400;
  world.time = 74;
  settle(world, 0.25);
  world.alarm = 34;
  world.message = 'The Star is right there. Steady hands…';
  world.messageSeconds = 5;
}

function stageChase(world) {
  startHeist(world);
  // The Star is lifted, the tripwire has sung, and the grand hall guard is on
  // the thief's heels two strides from the carpet's end.
  world.thief.x = 742;
  world.thief.y = 622;
  world.thief.angle = Math.PI;
  const guard = world.guards[1];
  guard.x = 838;
  guard.y = 618;
  guard.angle = Math.PI;
  guard.mode = GUARD_CHASE;
  guard.target = { x: world.thief.x, y: world.thief.y };
  guard.memorySeconds = 3;
  world.lootTaken.add('case-grand-2');
  world.lootTaken.add('star');
  world.lootValue = 11400;
  world.starTaken = true;
  world.time = 131;
  settle(world, 0.2);
  world.alarm = 88;
  world.alarmTripped = true;
  world.message = 'ALARM TRIPPED — every guard is coming!';
  world.messageSeconds = 5;
}

function stageGetaway(world) {
  startHeist(world);
  for (const id of ['case-entry-1', 'case-west-1', 'case-west-2', 'case-east-1', 'case-east-2', 'star']) {
    world.lootTaken.add(id);
  }
  world.lootValue = 14400;
  world.starTaken = true;
  world.time = 148;
  world.screen = SCREEN_GETAWAY;
}

/** Set `world` to the named scene, ready for one draw. Unknown names give the cover. */
export function stageShot(name, world) {
  if (name === 'vault') stageVault(world);
  else if (name === 'chase') stageChase(world);
  else if (name === 'getaway') stageGetaway(world);
  else stageCover(world);
  return world;
}
