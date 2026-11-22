// The Meridian Gallery floor plan: walls, cover, loot cases, cameras, patrols.
// Coordinates are world pixels on a 1280x800 floor; the HUD strip sits above y=48.
// Rooms: entry hall (bottom-left), west gallery (top-left), east gallery (top-middle),
// the vault (top-right, holds the Star of Meridian) and the grand hall (bottom-right).
// Five doorways link them, so every room has more than one way in or out.

function rect(x, y, w, h) {
  return { x, y, w, h };
}

export function buildLevel() {
  const walls = [
    // Outer shell.
    rect(16, 56, 1248, 12),
    rect(16, 772, 1248, 12),
    rect(16, 56, 12, 728),
    rect(1252, 56, 12, 728),
    // West/east gallery divider, with a doorway at y 300..356.
    rect(430, 56, 12, 244),
    rect(430, 356, 12, 114),
    // Gallery/vault divider, with a doorway at y 240..300.
    rect(850, 56, 12, 184),
    rect(850, 300, 12, 170),
    // The long horizontal divider at y 470..482, with doorways at
    // x 250..320 (entry<->west), x 560..630 (entry<->grand) and x 1000..1070 (grand<->vault).
    rect(16, 470, 234, 12),
    rect(320, 470, 240, 12),
    rect(630, 470, 370, 12),
    rect(1070, 470, 194, 12),
  ];

  // Solid furniture that blocks sight and movement: marble pillars and planters.
  // Guards' and cameras' cones stop at these, so they are the safe cover of the floor.
  const covers = [
    rect(200, 200, 44, 44), // west gallery pillar
    rect(660, 180, 44, 44), // east gallery pillar
    rect(700, 556, 44, 44), // grand hall pillar
    rect(1080, 600, 44, 44), // grand hall pillar
    rect(120, 560, 64, 30), // entry hall planter
    rect(950, 320, 64, 30), // vault planter
    rect(560, 330, 64, 30), // east gallery planter
    rect(300, 640, 64, 30), // entry hall planter
  ];

  // Display cases: solid plinths; walk up to one and the thief cracks it quietly.
  const cases = [
    { id: 'case-west-1', label: 'Jeweled Snuffbox', value: 600, ...rect(120, 120, 46, 30) },
    { id: 'case-west-2', label: 'Ivory Chess Set', value: 900, ...rect(300, 380, 46, 30) },
    { id: 'case-entry-1', label: 'Brass Astrolabe', value: 500, ...rect(330, 540, 46, 30) },
    { id: 'case-east-1', label: 'Sapphire Brooch', value: 1100, ...rect(520, 120, 46, 30) },
    { id: 'case-east-2', label: 'Golden Chalice', value: 1300, ...rect(740, 380, 46, 30) },
    { id: 'case-grand-1', label: 'Emerald Tiara', value: 1500, ...rect(520, 700, 46, 30) },
    { id: 'case-grand-2', label: 'Ruby Sceptre', value: 1400, ...rect(880, 560, 46, 30) },
    { id: 'case-grand-3', label: 'Pearl Necklace', value: 1000, ...rect(1150, 700, 46, 30) },
    { id: 'case-vault-1', label: 'Crown Diamond', value: 2500, ...rect(920, 110, 46, 30) },
  ];

  // The Star of Meridian: the vault's prize, on its plinth at the vault's heart.
  const star = { id: 'star', label: 'Star of Meridian', value: 10000, ...rect(1030, 190, 52, 36) };

  // Cameras: wall mounts with a base aim; each sweeps to either side of it.
  const cameras = [
    { id: 'cam-east', x: 640, y: 74, baseAngle: Math.PI / 2, phase: 0 },
    { id: 'cam-grand', x: 1240, y: 500, baseAngle: Math.PI, phase: 2.1 },
    { id: 'cam-vault', x: 1056, y: 74, baseAngle: Math.PI / 2, phase: 4.2 },
  ];

  // Guard patrols: waypoint loops walked in order, pausing briefly at each end of a leg.
  const guardPaths = [
    // West gallery guard: crosses into the east gallery through the y 300..356 door.
    [
      { x: 110, y: 250 },
      { x: 380, y: 325 },
      { x: 640, y: 250 },
      { x: 380, y: 325 },
    ],
    // Grand hall guard: a long beat across the hall and up toward the vault door.
    [
      { x: 520, y: 640 },
      { x: 1035, y: 640 },
      { x: 1035, y: 520 },
      { x: 700, y: 540 },
    ],
    // Vault guard: watches the Star, stepping out into the east gallery and back.
    [
      { x: 1120, y: 330 },
      { x: 1120, y: 150 },
      { x: 790, y: 268 },
      { x: 1120, y: 150 },
    ],
  ];

  return {
    walls,
    covers,
    cases,
    star,
    cameras,
    guardPaths,
    spawn: { x: 92, y: 700 },
    // The getaway door: a gap-sized zone on the entry hall's west wall.
    exit: rect(16, 636, 26, 84),
    blockers: [...walls, ...covers, ...cases, star],
  };
}
