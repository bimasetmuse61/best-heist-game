[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/bimasetmuse61/best-heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/bimasetmuse61/best-heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

# Vaultbreak — The Meridian Job

An original top-down stealth heist game, built for the [make.fun bounty best-heist-game-20261122-0559](https://make.fun/bounty/best-heist-game-20261122-0559) by @mellow-comet-80.

You are the thief. Cross the Meridian Gallery under the sweep of guard vision
cones and security cameras, crack the display cases, lift the Star of Meridian
from the vault, and reach the getaway door before the alarm meter fills.
Move with WASD or the arrow keys, hold Shift to sneak, and click anywhere to
toss a coin that lures guards away — you carry only three.

The game is plain static files under `game/` (vanilla JS and canvas, no
libraries, no network). `main.ts` hands it in: it copies `game/` and
`screenshots/` to the output directory and writes `dossier.json` with the
vendored make.fun library in `vendor/makefun-game.ts`.

Run it locally:

```sh
python3 -m http.server 8080 --directory game
# then open http://localhost:8080 in a desktop browser
```

Hand it in:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```
