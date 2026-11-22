// Vaultbreak — The Meridian Job: shared tuning constants for the whole game.
// Every module imports from here so speeds, sizes and colours stay consistent.

export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 800;
export const HUD_HEIGHT = 48;

/** Fixed simulation step, in seconds: the world advances in these slices only. */
export const STEP = 1 / 120;

export const THIEF_RADIUS = 11;
export const THIEF_WALK_SPEED = 168;
export const THIEF_SNEAK_SPEED = 96;

export const GUARD_RADIUS = 12;
export const GUARD_PATROL_SPEED = 72;
export const GUARD_CHASE_SPEED = 158;
export const GUARD_INVESTIGATE_SPEED = 118;
export const GUARD_TURN_RATE = 3.4; // radians per second toward a heading
export const GUARD_SIGHT_RANGE = 195;
export const GUARD_SIGHT_HALF_ANGLE = 0.56; // ~32 degrees

export const CAMERA_SIGHT_RANGE = 175;
export const CAMERA_SIGHT_HALF_ANGLE = 0.42; // ~24 degrees
export const CAMERA_SWEEP_SPEED = 0.55; // radians per second of the sweep centre
export const CAMERA_SWEEP_SPAN = 0.9; // radians each way from the mount's base angle

/** Alarm gained per second at point-blank range, before distance and sneak scaling. */
export const ALARM_FROM_GUARD = 30;
export const ALARM_FROM_CAMERA = 38;
export const ALARM_DECAY = 8;
export const ALARM_STAR_TRIPWIRE = 30;
export const ALARM_CASE_CRACK = 3;

export const COIN_COUNT = 3;
export const COIN_THROW_RANGE = 280;
export const COIN_LURE_RADIUS = 250;
export const COIN_LURE_SECONDS = 3.2;

export const COLOURS = {
  floor: '#232838',
  floorTile: '#262b3d',
  carpet: '#5d2436',
  carpetEdge: '#7a3049',
  wall: '#8a7a5c',
  wallTop: '#b3a077',
  wallShadow: '#171a26',
  cover: '#2e4a3a',
  coverTop: '#3c6350',
  pillar: '#6d6a80',
  pillarTop: '#8f8ca6',
  caseGlass: '#9fd8e8',
  caseBase: '#4a3b28',
  gem: '#ffd94d',
  star: '#7df0ff',
  exit: '#39d98a',
  thief: '#e8e4da',
  thiefHood: '#31435f',
  guard: '#2b4d9b',
  guardCap: '#16294f',
  cameraBody: '#3a3f4d',
  coneGuard: 'rgba(255, 84, 60, 0.20)',
  coneGuardHot: 'rgba(255, 60, 40, 0.38)',
  coneCamera: 'rgba(255, 190, 60, 0.16)',
  coneCameraHot: 'rgba(255, 170, 40, 0.34)',
  hudBar: '#12141d',
  text: '#f2eee3',
  textDim: '#a9a294',
  alarmLow: '#39d98a',
  alarmMid: '#ffc44d',
  alarmHigh: '#ff5040',
};
