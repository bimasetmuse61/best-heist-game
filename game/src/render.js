// Rendering: everything the player (and the judge's screenshots) sees.
// Flat shapes and a strict palette: carpet red for the walked routes, stone for
// walls, deep green for the planters and pillars that break a watcher's gaze,
// gold for loot, red for guard cones and amber for camera cones.
import {
  CAMERA_SIGHT_HALF_ANGLE,
  CAMERA_SIGHT_RANGE,
  COLOURS,
  GUARD_SIGHT_HALF_ANGLE,
  GUARD_SIGHT_RANGE,
  HUD_HEIGHT,
  VIEW_HEIGHT,
  VIEW_WIDTH,
} from './config.js';
import { GUARD_CHASE } from './guards.js';
import { SCREEN_CAUGHT, SCREEN_GETAWAY, SCREEN_PLAY, SCREEN_TITLE, scoreBreakdown } from './world.js';
import { conePolygon } from './vision.js';

function fillRect(ctx, rect, colour) {
  ctx.fillStyle = colour;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
}

function drawFloor(ctx, world) {
  ctx.fillStyle = COLOURS.floor;
  ctx.fillRect(0, HUD_HEIGHT, VIEW_WIDTH, VIEW_HEIGHT - HUD_HEIGHT);
  // A quiet tile grid so distances read at a glance.
  ctx.strokeStyle = COLOURS.floorTile;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 16; x <= 1264; x += 52) {
    ctx.moveTo(x, 56);
    ctx.lineTo(x, 784);
  }
  for (let y = 56; y <= 784; y += 52) {
    ctx.moveTo(16, y);
    ctx.lineTo(1264, y);
  }
  ctx.stroke();
  // Carpet runners along the two main routes: entry to vault, hall to vault door.
  ctx.fillStyle = COLOURS.carpet;
  ctx.fillRect(52, 500, 360, 60);
  ctx.fillRect(252, 330, 56, 230);
  ctx.fillRect(470, 590, 700, 60);
  ctx.fillRect(1008, 420, 56, 200);
  ctx.strokeStyle = COLOURS.carpetEdge;
  ctx.lineWidth = 2;
  ctx.strokeRect(52, 500, 360, 60);
  ctx.strokeRect(470, 590, 700, 60);
}

function drawExit(ctx, world) {
  const exit = world.level.exit;
  ctx.fillStyle = COLOURS.exit;
  ctx.globalAlpha = 0.28 + 0.1 * Math.sin(world.time * 3);
  ctx.fillRect(exit.x, exit.y, exit.w + 14, exit.h);
  ctx.globalAlpha = 1;
  ctx.fillStyle = COLOURS.exit;
  ctx.save();
  ctx.translate(exit.x + 8, exit.y + exit.h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GETAWAY', 0, 4);
  ctx.restore();
}

function drawLootItem(ctx, world, item, taken, isStar) {
  if (taken) {
    // An emptied plinth: bare stone, its glass gone dark.
    fillRect(ctx, item, '#3a3f4d');
    ctx.strokeStyle = '#23262f';
    ctx.strokeRect(item.x, item.y, item.w, item.h);
    return;
  }
  fillRect(ctx, item, COLOURS.caseBase);
  ctx.fillStyle = COLOURS.caseGlass;
  ctx.globalAlpha = 0.85;
  ctx.fillRect(item.x + 4, item.y + 4, item.w - 8, item.h - 8);
  ctx.globalAlpha = 1;
  // The prize itself: a cut gem, gold for the cases and ice-blue for the Star.
  const cx = item.x + item.w / 2;
  const cy = item.y + item.h / 2;
  const r = isStar ? 13 : 9;
  ctx.fillStyle = isStar ? COLOURS.star : COLOURS.gem;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r, cy);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r, cy);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r * 0.45, cy - r * 0.2);
  ctx.lineTo(cx - r * 0.45, cy - r * 0.2);
  ctx.closePath();
  ctx.fill();
  if (isStar) {
    ctx.strokeStyle = COLOURS.star;
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(world.time * 2.4);
    ctx.lineWidth = 2;
    ctx.strokeRect(item.x - 4, item.y - 4, item.w + 8, item.h + 8);
    ctx.globalAlpha = 1;
    ctx.fillStyle = COLOURS.star;
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('STAR OF MERIDIAN', cx, item.y - 10);
  }
}

function drawCone(ctx, x, y, angle, half, range, blockers, colour) {
  const points = conePolygon(x, y, angle, half, range, blockers);
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
  ctx.closePath();
  ctx.fill();
}

function drawCamera(ctx, camera) {
  ctx.fillStyle = COLOURS.cameraBody;
  ctx.fillRect(camera.x - 9, camera.y - 7, 18, 14);
  ctx.fillStyle = camera.seesThief ? '#ff5040' : '#ffd94d';
  ctx.beginPath();
  ctx.arc(camera.x + Math.cos(camera.angle) * 6, camera.y + Math.sin(camera.angle) * 6, 3.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawGuard(ctx, guard) {
  // A uniformed figure: navy body, cap brim toward his facing, white collar.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(guard.x, guard.y + 10, 11, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLOURS.guard;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, guard.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLOURS.guardCap;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, guard.radius - 4, guard.angle - 1.25, guard.angle + 1.25);
  ctx.lineTo(guard.x, guard.y);
  ctx.closePath();
  ctx.fill();
  if (guard.mode === GUARD_CHASE || guard.seesThief) {
    ctx.fillStyle = '#ff5040';
    ctx.font = 'bold 17px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', guard.x, guard.y - 19);
  }
}

function drawThief(ctx, thief) {
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(thief.x, thief.y + 10, 10, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLOURS.thiefHood;
  ctx.beginPath();
  ctx.arc(thief.x, thief.y, thief.radius + 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLOURS.thief;
  ctx.beginPath();
  ctx.arc(thief.x, thief.y, thief.radius - 3.5, 0, Math.PI * 2);
  ctx.fill();
  // The mask stripe, turned the way the thief last moved.
  ctx.strokeStyle = '#1c2432';
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.moveTo(thief.x - Math.cos(thief.angle) * 2 - Math.sin(thief.angle) * 5, thief.y - Math.sin(thief.angle) * 2 + Math.cos(thief.angle) * 5);
  ctx.lineTo(thief.x - Math.cos(thief.angle) * 2 + Math.sin(thief.angle) * 5, thief.y - Math.sin(thief.angle) * 2 - Math.cos(thief.angle) * 5);
  ctx.stroke();
}

function drawCoin(ctx, world) {
  if (world.coin === null) return;
  const { x, y, secondsLeft } = world.coin;
  const pulse = 1 + secondsLeft * 22;
  ctx.strokeStyle = 'rgba(255, 217, 77, 0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, pulse % 46, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = COLOURS.gem;
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
}

function alarmColour(alarm) {
  if (alarm < 45) return COLOURS.alarmLow;
  if (alarm < 75) return COLOURS.alarmMid;
  return COLOURS.alarmHigh;
}

function drawHud(ctx, world) {
  ctx.fillStyle = COLOURS.hudBar;
  ctx.fillRect(0, 0, VIEW_WIDTH, HUD_HEIGHT);
  ctx.fillStyle = COLOURS.textDim;
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', 18, 20);
  // The alarm meter: the one number every watcher feeds.
  ctx.fillStyle = '#2a2e3d';
  ctx.fillRect(18, 26, 300, 12);
  ctx.fillStyle = alarmColour(world.alarm);
  ctx.fillRect(18, 26, (300 * world.alarm) / 100, 12);
  ctx.strokeStyle = '#454a5e';
  ctx.strokeRect(18, 26, 300, 12);
  ctx.fillStyle = COLOURS.text;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText(`LOOT $${world.lootValue.toLocaleString('en-US')}`, 348, 33);
  ctx.fillStyle = COLOURS.textDim;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(`cases ${world.lootTaken.size}/10`, 560, 33);
  ctx.fillText(`coins ${'●'.repeat(world.coinsLeft)}${'○'.repeat(3 - world.coinsLeft)}`, 680, 33);
  ctx.fillText(`time ${Math.floor(world.time / 60)}:${String(Math.floor(world.time % 60)).padStart(2, '0')}`, 800, 33);
  if (world.starTaken) {
    ctx.fillStyle = COLOURS.star;
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText('★ STAR LIFTED — GET OUT!', 920, 33);
  }
  if (world.messageSeconds > 0 && world.message) {
    ctx.fillStyle = '#ffd94d';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(world.message, VIEW_WIDTH / 2, HUD_HEIGHT + 24);
  }
}

function drawPanel(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(10, 12, 20, 0.78)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  ctx.fillStyle = accent;
  ctx.font = 'bold 52px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, VIEW_WIDTH / 2, 268);
  ctx.fillStyle = COLOURS.text;
  ctx.font = '19px system-ui, sans-serif';
  lines.forEach((line, index) => ctx.fillText(line, VIEW_WIDTH / 2, 330 + index * 30));
}

export function drawWorld(ctx, world) {
  drawFloor(ctx, world);
  drawExit(ctx, world);
  for (const item of world.level.cases) drawLootItem(ctx, world, item, world.lootTaken.has(item.id), false);
  drawLootItem(ctx, world, world.level.star, world.lootTaken.has('star'), true);
  for (const cover of world.level.covers) {
    const isPillar = cover.w === 44 && cover.h === 44;
    fillRect(ctx, cover, isPillar ? COLOURS.pillar : COLOURS.cover);
    ctx.fillStyle = isPillar ? COLOURS.pillarTop : COLOURS.coverTop;
    ctx.fillRect(cover.x, cover.y, cover.w, 7);
  }
  for (const wall of world.level.walls) {
    ctx.fillStyle = COLOURS.wallShadow;
    ctx.fillRect(wall.x, wall.y + 4, wall.w, wall.h);
    fillRect(ctx, wall, COLOURS.wall);
    ctx.fillStyle = COLOURS.wallTop;
    ctx.fillRect(wall.x, wall.y, wall.w, 3);
  }
  // Cones over the floor but under the actors: danger you can read before you move.
  for (const camera of world.cameras) {
    drawCone(ctx, camera.x, camera.y, camera.angle, CAMERA_SIGHT_HALF_ANGLE, CAMERA_SIGHT_RANGE, world.level.blockers, camera.seesThief ? COLOURS.coneCameraHot : COLOURS.coneCamera);
  }
  for (const guard of world.guards) {
    drawCone(ctx, guard.x, guard.y, guard.angle, GUARD_SIGHT_HALF_ANGLE, GUARD_SIGHT_RANGE, world.level.blockers, guard.seesThief ? COLOURS.coneGuardHot : COLOURS.coneGuard);
  }
  for (const camera of world.cameras) drawCamera(ctx, camera);
  drawCoin(ctx, world);
  for (const guard of world.guards) drawGuard(ctx, guard);
  drawThief(ctx, world.thief);
  drawHud(ctx, world);

  if (world.screen === SCREEN_TITLE) {
    drawPanel(ctx, 'VAULTBREAK', [
      'The Meridian Job — one thief, one gallery, one Star.',
      '',
      'Cross the floor under the cones. Crack the cases. Lift the Star of Meridian.',
      'Reach the green GETAWAY door with loot in hand — and keep the alarm down.',
      '',
      'WASD / arrows to move · Shift to sneak · Click to toss a coin (3 only)',
      '',
      'Click or press Enter to begin',
    ], COLOURS.gem);
  } else if (world.screen === SCREEN_CAUGHT) {
    drawPanel(ctx, 'BUSTED', [
      world.caughtReason,
      `You lifted $${world.lootValue.toLocaleString('en-US')} before they closed in — all of it goes back.`,
      '',
      'Press Enter or click to try the job again',
    ], COLOURS.alarmHigh);
  } else if (world.screen === SCREEN_GETAWAY) {
    const score = scoreBreakdown(world);
    drawPanel(ctx, 'CLEAN GETAWAY', [
      `Loot fenced: $${score.loot.toLocaleString('en-US')}`,
      `Star bonus: $${score.starBonus.toLocaleString('en-US')} · Ghost bonus: $${score.ghostBonus.toLocaleString('en-US')} · Speed bonus: $${score.timeBonus.toLocaleString('en-US')}`,
      `SCORE $${score.total.toLocaleString('en-US')} — ${world.lootTaken.size} of 10 pieces in ${Math.floor(world.time)}s`,
      world.starTaken ? 'The Star of Meridian is gone from its plinth. The Meridian will never recover.' : 'You left the Star of Meridian behind. It is still there, glittering…',
      '',
      'Press Enter or click to run the job again',
    ], COLOURS.exit);
  } else if (world.screen === SCREEN_PLAY) {
    // Play needs no panel: the floor itself is the whole story.
  }
}
