// Vaultbreak — The Meridian Job: the hand-in program (Node 22, standard library only).
//
// The game itself is the static site in game/ (game/index.html plus its ES modules; it plays
// offline in a desktop browser and loads nothing over the network). This program copies game/
// and screenshots/ from beside this file into the output directory and writes dossier.json
// there with buildDossier from the vendored make.fun library, exactly as the bounty asks.
// The grader sets the output directory; outside it, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The caps below are the gate's own (game/ at most 993 entries and 48 MiB, screenshots at most
// 4 files of 256 KiB, dossier text capped at 160 KiB); buildDossier refuses anything the
// scorer would refuse, so a clean run here means the hand-in is inside every limit.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
