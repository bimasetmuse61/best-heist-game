// The world: one heist, simulated in fixed steps. Holds the thief, the guards,
// the cameras, the loot and the alarm, and advances them all by the same rules
// whether a player or a screenshot scene is driving.
import {
  ALARM_CASE_CRACK,
  ALARM_DECAY,
  ALARM_FROM_CAMERA,
  ALARM_FROM_GUARD,
  ALARM_STAR_TRIPWIRE,
  CAMERA_SIGHT_HALF_ANGLE,
  CAMERA_SIGHT_RANGE,
  CAMERA_SWEEP_SPAN,
  CAMERA_SWEEP_SPEED,
  COIN_COUNT,
  COIN_LURE_RADIUS,
  COIN_LURE_SECONDS,
  COIN_THROW_RANGE,
  GUARD_SIGHT_HALF_ANGLE,
  GUARD_SIGHT_RANGE,
  THIEF_RADIUS,
  THIEF_SNEAK_SPEED,
  THIEF_WALK_SPEED,
} from './config.js';
import { GUARD_CHASE, GUARD_INVESTIGATE, createGuard, sendGuardTo, stepGuard } from './guards.js';
import { buildLevel } from './level.js';
import { inCone } from './vision.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_GETAWAY = 'getaway';

export function createWorld() {
  const level = buildLevel();
  return {
    level,
    screen: SCREEN_TITLE,
    time: 0,
    thief: { x: level.spawn.x, y: level.spawn.y, radius: THIEF_RADIUS, angle: -Math.PI / 2, moving: false, sneaking: false },
    guards: level.guardPaths.map((path, index) => createGuard(path, index)),
    cameras: level.cameras.map((cam) => ({ ...cam, angle: cam.baseAngle })),
    alarm: 0,
    alarmTripped: false,
    lootTaken: new Set(),
    lootValue: 0,
    coinsLeft: COIN_COUNT,
    coin: null, // {x, y, secondsLeft} while a tossed coin is ringing
    caughtReason: '',
    message: '',
    messageSeconds: 0,
    starTaken: false,
    seenNow: false, // any watcher has eyes on the thief this step
  };
}

/** Move a circle by (dx, dy), sliding along blocker rectangles it would cross. */
export function moveCircle(world, body, dx, dy) {
  const blockers = world.level.blockers;
  body.x += dx;
  for (const rect of blockers) {
    if (circleHitsRect(body, rect)) body.x = dx > 0 ? rect.x - body.radius - 0.01 : rect.x + rect.w + body.radius + 0.01;
  }
  body.y += dy;
  for (const rect of blockers) {
    if (circleHitsRect(body, rect)) body.y = dy > 0 ? rect.y - body.radius - 0.01 : rect.y + rect.h + body.radius + 0.01;
  }
}

export function circleHitsRect(body, rect) {
  const nearX = Math.max(rect.x, Math.min(body.x, rect.x + rect.w));
  const nearY = Math.max(rect.y, Math.min(body.y, rect.y + rect.h));
  const dx = body.x - nearX;
  const dy = body.y - nearY;
  return dx * dx + dy * dy < body.radius * body.radius;
}

function stepThief(world, input, dt) {
  const thief = world.thief;
  let mx = 0;
  let my = 0;
  if (input.left) mx -= 1;
  if (input.right) mx += 1;
  if (input.up) my -= 1;
  if (input.down) my += 1;
  thief.moving = mx !== 0 || my !== 0;
  thief.sneaking = Boolean(input.sneak);
  if (!thief.moving) return;
  const length = Math.hypot(mx, my);
  const speed = thief.sneaking ? THIEF_SNEAK_SPEED : THIEF_WALK_SPEED;
  thief.angle = Math.atan2(my, mx);
  moveCircle(world, thief, (mx / length) * speed * dt, 0);
  moveCircle(world, thief, 0, (my / length) * speed * dt);
}

/**
 * Who can see the thief right now, and how strongly. Guards and cameras both
 * feed the alarm; a sneaking thief is harder to make out, and distance dulls
 * every watcher's certainty.
 */
function detection(world) {
  const thief = world.thief;
  const blockers = world.level.blockers;
  let strongest = 0;
  let anyGuard = false;
  for (const guard of world.guards) {
    const seen = inCone(guard.x, guard.y, guard.angle, GUARD_SIGHT_HALF_ANGLE, GUARD_SIGHT_RANGE, thief.x, thief.y, blockers);
    guard.seesThief = seen;
    if (seen) {
      anyGuard = true;
      const dist = Math.hypot(thief.x - guard.x, thief.y - guard.y);
      strongest = Math.max(strongest, ALARM_FROM_GUARD * (1.15 - dist / GUARD_SIGHT_RANGE));
    }
  }
  for (const camera of world.cameras) {
    const seen = inCone(camera.x, camera.y, camera.angle, CAMERA_SIGHT_HALF_ANGLE, CAMERA_SIGHT_RANGE, thief.x, thief.y, blockers);
    camera.seesThief = seen;
    if (seen) {
      const dist = Math.hypot(thief.x - camera.x, thief.y - camera.y);
      strongest = Math.max(strongest, ALARM_FROM_CAMERA * (1.15 - dist / CAMERA_SIGHT_RANGE));
    }
  }
  if (thief.sneaking) strongest *= 0.45;
  return { rate: strongest, anyGuard };
}

function stepAlarm(world, dt, seen) {
  if (seen.rate > 0) {
    world.alarm = Math.min(100, world.alarm + seen.rate * dt);
  } else {
    world.alarm = Math.max(0, world.alarm - ALARM_DECAY * dt);
  }
  world.seenNow = seen.rate > 0;
  // The moment the meter fills, every guard converges on the thief's position.
  if (world.alarm >= 100 && !world.alarmTripped) {
    world.alarmTripped = true;
    world.message = 'ALARM TRIPPED — every guard is coming!';
    world.messageSeconds = 3;
    for (const guard of world.guards) {
      guard.mode = GUARD_CHASE;
      guard.target = { x: world.thief.x, y: world.thief.y };
      guard.memorySeconds = 4;
    }
  }
  // A guard who can see the thief at arm's length gives chase at once.
  if (seen.anyGuard && world.alarm > 55) {
    for (const guard of world.guards) {
      if (guard.seesThief && guard.mode !== GUARD_CHASE) {
        guard.mode = GUARD_CHASE;
        guard.target = { x: world.thief.x, y: world.thief.y };
        guard.memorySeconds = 2.5;
      }
    }
  }
}

function stepCameras(world, dt) {
  for (const camera of world.cameras) {
    camera.angle = camera.baseAngle + Math.sin(world.time * CAMERA_SWEEP_SPEED + camera.phase) * CAMERA_SWEEP_SPAN;
  }
}

/**
 * Toss a coin toward (x, y): it rings where it lands and pulls every guard in
 * earshot off their beat for a few seconds. Coins are the thief's only tool,
 * and there are just three of them.
 */
export function tossCoin(world, x, y) {
  if (world.screen !== SCREEN_PLAY || world.coinsLeft <= 0 || world.coin !== null) return false;
  const thief = world.thief;
  const dx = x - thief.x;
  const dy = y - thief.y;
  const dist = Math.hypot(dx, dy);
  const reach = Math.min(dist, COIN_THROW_RANGE);
  const scale = dist < 1e-6 ? 0 : reach / dist;
  const landing = { x: thief.x + dx * scale, y: thief.y + dy * scale };
  world.coinsLeft -= 1;
  world.coin = { ...landing, secondsLeft: COIN_LURE_SECONDS };
  for (const guard of world.guards) {
    if (Math.hypot(guard.x - landing.x, guard.y - landing.y) <= COIN_LURE_RADIUS) {
      sendGuardTo(guard, landing.x, landing.y, GUARD_INVESTIGATE, COIN_LURE_SECONDS + 1.5);
    }
  }
  return true;
}

function stepCoin(world, dt) {
  if (world.coin === null) return;
  world.coin.secondsLeft -= dt;
  if (world.coin.secondsLeft <= 0) world.coin = null;
}

/** Standing against a case (or the Star's plinth) cracks it open. */
function stepLoot(world) {
  const thief = world.thief;
  const reach = { ...thief, radius: thief.radius + 7 };
  for (const item of [...world.level.cases, world.level.star]) {
    if (world.lootTaken.has(item.id)) continue;
    if (!circleHitsRect(reach, item)) continue;
    world.lootTaken.add(item.id);
    world.lootValue += item.value;
    if (item.id === 'star') {
      world.starTaken = true;
      world.alarm = Math.min(100, world.alarm + ALARM_STAR_TRIPWIRE);
      world.message = 'The Star is yours — its plinth just screamed. RUN!';
    } else {
      world.alarm = Math.min(100, world.alarm + ALARM_CASE_CRACK);
      world.message = `${item.label} lifted (+$${item.value.toLocaleString('en-US')})`;
    }
    world.messageSeconds = 2.6;
  }
}

function stepEndings(world) {
  const thief = world.thief;
  for (const guard of world.guards) {
    if (Math.hypot(guard.x - thief.x, guard.y - thief.y) < guard.radius + thief.radius - 2) {
      world.screen = SCREEN_CAUGHT;
      world.caughtReason = world.alarmTripped
        ? 'Caught in the open with the alarm ringing.'
        : 'A guard grabbed you by the collar.';
      return;
    }
  }
  const exit = world.level.exit;
  if (thief.x - thief.radius < exit.x + exit.w && thief.x > exit.x && thief.y > exit.y && thief.y < exit.y + exit.h) {
    if (world.lootTaken.size === 0) {
      world.message = 'The getaway driver waves you off: grab some loot first!';
      world.messageSeconds = 1.6;
      return;
    }
    world.screen = SCREEN_GETAWAY;
  }
}

/** Advance the whole heist by one fixed step. Input: {left, right, up, down, sneak}. */
export function stepWorld(world, input, dt) {
  if (world.screen !== SCREEN_PLAY) return;
  world.time += dt;
  if (world.messageSeconds > 0) world.messageSeconds -= dt;
  stepThief(world, input, dt);
  stepCameras(world, dt);
  const seen = detection(world);
  stepAlarm(world, dt, seen);
  const mover = (body, dx, dy) => moveCircle(world, body, dx, dy);
  for (const guard of world.guards) stepGuard(guard, dt, world.thief, mover);
  stepCoin(world, dt);
  stepLoot(world);
  stepEndings(world);
}

export function startHeist(world) {
  const fresh = createWorld();
  Object.assign(world, fresh);
  world.screen = SCREEN_PLAY;
}

/** The score the getaway screen shows: loot, plus bonuses for nerve and silence. */
export function scoreBreakdown(world) {
  const loot = world.lootValue;
  const starBonus = world.starTaken ? 2500 : 0;
  const ghostBonus = world.alarmTripped ? 0 : 1500;
  const timeBonus = Math.max(0, 1200 - Math.floor(world.time) * 4);
  return { loot, starBonus, ghostBonus, timeBonus, total: loot + starBonus + ghostBonus + timeBonus };
}
