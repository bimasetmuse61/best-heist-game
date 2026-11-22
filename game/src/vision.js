// Sight geometry: vision cones clipped by walls, and line-of-sight tests.
// Blockers are axis-aligned rectangles; every test works on their edges as segments.

export function angleDifference(a, b) {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function turnToward(angle, target, maxTurn) {
  const d = angleDifference(target, angle);
  if (Math.abs(d) <= maxTurn) return target;
  return angle + Math.sign(d) * maxTurn;
}

/** The four edges of a rect as [x1, y1, x2, y2] segments. */
export function rectSegments(rect) {
  const { x, y, w, h } = rect;
  return [
    [x, y, x + w, y],
    [x + w, y, x + w, y + h],
    [x + w, y + h, x, y + h],
    [x, y + h, x, y],
  ];
}

/** Distance along ray (ox, oy) + t*(dx, dy) to a segment, or Infinity when it misses. */
function raySegment(ox, oy, dx, dy, seg) {
  const [x1, y1, x2, y2] = seg;
  const ex = x2 - x1;
  const ey = y2 - y1;
  const denom = dx * ey - dy * ex;
  if (Math.abs(denom) < 1e-9) return Infinity;
  const t = ((x1 - ox) * ey - (y1 - oy) * ex) / denom;
  const u = ((x1 - ox) * dy - (y1 - oy) * dx) / denom;
  if (t < 0 || u < 0 || u > 1) return Infinity;
  return t;
}

/** How far a ray travels from (ox, oy) along `angle` before it hits any blocker. */
export function rayDistance(ox, oy, angle, blockers) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let best = Infinity;
  for (const rect of blockers) {
    for (const seg of rectSegments(rect)) {
      const t = raySegment(ox, oy, dx, dy, seg);
      // A hair of clearance: a watcher standing flush with a wall (a camera on
      // its mount) must not read the wall face it touches as blocking every ray.
      if (t > 1.5 && t < best) best = t;
    }
  }
  return best;
}

/** True when the straight line from a to b crosses no blocker edge. */
export function lineOfSight(ax, ay, bx, by, blockers) {
  const dx = bx - ax;
  const dy = by - ay;
  const dist = Math.hypot(dx, dy);
  if (dist < 1e-6) return true;
  for (const rect of blockers) {
    for (const seg of rectSegments(rect)) {
      const t = raySegment(ax, ay, dx / dist, dy / dist, seg);
      if (t > 1.5 && t < dist - 0.5) return false;
    }
  }
  return true;
}

/**
 * The visible polygon of a vision cone: rays fanned across the arc, each stopped
 * at the first blocker or at the cone's range, whichever comes first.
 */
export function conePolygon(x, y, angle, halfAngle, range, blockers, rays = 26) {
  const points = [{ x, y }];
  for (let i = 0; i <= rays; i += 1) {
    const a = angle - halfAngle + (2 * halfAngle * i) / rays;
    const d = Math.min(range, rayDistance(x, y, a, blockers));
    points.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d });
  }
  return points;
}

/** True when (px, py) is inside the cone of a watcher at (x, y) with a clear line of sight. */
export function inCone(x, y, angle, halfAngle, range, px, py, blockers) {
  const dx = px - x;
  const dy = py - y;
  const dist = Math.hypot(dx, dy);
  if (dist > range || dist < 1e-6) return false;
  if (Math.abs(angleDifference(Math.atan2(dy, dx), angle)) > halfAngle) return false;
  return lineOfSight(x, y, px, py, blockers);
}
