// Guards: patrol their waypoint loop, investigate noises and last-seen spots,
// and chase the thief on sight. Movement and facing live here; detection and
// the alarm live in world.js, which reads each guard's mode and position.
import {
  GUARD_CHASE_SPEED,
  GUARD_INVESTIGATE_SPEED,
  GUARD_PATROL_SPEED,
  GUARD_RADIUS,
  GUARD_TURN_RATE,
} from './config.js';
import { turnToward } from './vision.js';

export const GUARD_PATROL = 'patrol';
export const GUARD_INVESTIGATE = 'investigate';
export const GUARD_CHASE = 'chase';
export const GUARD_SEARCH = 'search';

export function createGuard(path, index) {
  const start = path[0];
  return {
    id: `guard-${index + 1}`,
    x: start.x,
    y: start.y,
    angle: Math.atan2(path[1].y - start.y, path[1].x - start.x),
    radius: GUARD_RADIUS,
    path,
    pathIndex: 1,
    mode: GUARD_PATROL,
    waitSeconds: 0,
    target: null, // {x, y} while investigating or searching
    memorySeconds: 0, // how long the current chase/search memory lasts
    seesThief: false,
  };
}

function moveToward(guard, tx, ty, speed, dt, moveCircle) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1e-6) return true;
  guard.angle = turnToward(guard.angle, Math.atan2(dy, dx), GUARD_TURN_RATE * dt);
  const step = Math.min(dist, speed * dt);
  moveCircle(guard, (dx / dist) * step, (dy / dist) * step);
  return dist <= Math.max(2, speed * dt);
}

/** Send a guard to look at a point: a coin's landing spot or a glimpse of the thief. */
export function sendGuardTo(guard, x, y, mode, memorySeconds) {
  if (guard.mode === GUARD_CHASE) return; // a chase already under way is not diverted
  guard.mode = mode;
  guard.target = { x, y };
  guard.memorySeconds = memorySeconds;
  guard.waitSeconds = 0;
}

export function stepGuard(guard, dt, thief, moveCircle) {
  if (guard.waitSeconds > 0) {
    guard.waitSeconds -= dt;
    return;
  }

  if (guard.mode === GUARD_CHASE) {
    guard.memorySeconds -= dt;
    if (guard.seesThief) {
      guard.target = { x: thief.x, y: thief.y };
      guard.memorySeconds = 2.5;
    }
    if (guard.memorySeconds <= 0 || guard.target === null) {
      guard.mode = GUARD_PATROL;
      guard.target = null;
      return;
    }
    if (moveToward(guard, guard.target.x, guard.target.y, GUARD_CHASE_SPEED, dt, moveCircle)) {
      guard.mode = GUARD_SEARCH;
      guard.memorySeconds = 2.2;
      guard.waitSeconds = 0.4;
    }
    return;
  }

  if (guard.mode === GUARD_INVESTIGATE || guard.mode === GUARD_SEARCH) {
    guard.memorySeconds -= dt;
    if (guard.target === null || guard.memorySeconds <= 0) {
      guard.mode = GUARD_PATROL;
      guard.target = null;
      return;
    }
    if (moveToward(guard, guard.target.x, guard.target.y, GUARD_INVESTIGATE_SPEED, dt, moveCircle)) {
      guard.waitSeconds = 0.9; // look around the spot, then give up
      guard.target = null;
      guard.mode = GUARD_PATROL;
    }
    return;
  }

  // Patrol: walk the loop, pausing a beat at every waypoint.
  const waypoint = guard.path[guard.pathIndex];
  if (moveToward(guard, waypoint.x, waypoint.y, GUARD_PATROL_SPEED, dt, moveCircle)) {
    guard.pathIndex = (guard.pathIndex + 1) % guard.path.length;
    guard.waitSeconds = 0.7;
  }
}
