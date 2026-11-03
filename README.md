# Hearthwild

[Kata Arcade](https://intrepion.github.io/)

An original peaceful voxel sandbox: gather timber, craft boards and a stoneworker pick, gather stone, build a nook, and place amber glow. Original generated pixel textures and synthesized tones; no Mojang assets or branding. Private repository, local browser play, no public deployment.

## Play locally

Requires Node 24 (tested with 24.20.0).

```sh
cd /Users/intrepion/Documents/Codex/2026-10-10/task-3/kata-inspired-by-minecraft-codex-dot
npm ci
npm run dev
```

Open http://127.0.0.1:5175. This project uses strict port 5175 and does not alter the other games on 5173/5174.

WASD move, Shift sprint, Space jump, mouse look after entering with capture. Select **keyboard / drag look** if capture is unavailable. In that mode drag the scene or use arrow keys to look. Left click/F gathers; right click/G places against the targeted face. Number keys 1–6 or scroll select the hotbar. E opens the pack/workbench; Esc pauses. R returns to a clear position without losing resources. Touch devices have a movement pad, gather/place/jump buttons and drag look. Resume after pause uses drag/keyboard look; reload and use Enter for mouse capture again.

Timber boards: 4 timber → 8 boards. Pick: 2 timber + 2 boards → a permanent equipped tool. Amber glow: 2 boards + 1 stone → 2 luminous blocks. The pick unlocks stone gathering. Nearby timber and a low stone ridge support the opening. Craft another board batch as needed. The optional journey recognizes six currently existing player-placed boards and one glow, not an enclosed-house simulation. Build walls and an overhead canopy, then continue freely.

## Actual scope

Seeded 40 × 40 cells, y=0…23; unmineable foundation at y=0. No infinite world, chunks streaming, multiplayer, creatures, hunger or combat. Each mined cell yields one resource; placement spends one. World edges block movement. Gravity and body collision use bounded movement substeps. Exposed faces are merged by material; geometry is rebuilt after edits. At most 12 glow point lights render; extra glow blocks retain emissive textures. Graphics need WebGL. Rendering has no shadows/day-night simulation. A compact peaceful building game, not a Minecraft reproduction.

Saves are local to this browser/origin, version 1, validated as a whole with a previous-valid-save backup. Invalid snapshots start fresh or recover the backup. Safe player positions recover when embedded/out of bounds. Clearing browser storage loses the world; there is no cloud sync. Saves do not include camera orientation, sound or sensitivity settings. Start a fresh glade requires an in-game confirmation.

## Verification

```sh
npm run typecheck
npm test
npm run build
npm audit --audit-level=moderate
```

See [verification](docs/VERIFICATION.md), [acceptance criteria and delegated decisions](docs/SPEC.md), [glossary](GLOSSARY.md), and [architecture decision](docs/adr/0001-finite-world-and-save.md).

![Built glade](docs/screenshots/built-glade.jpg)

## Play online

[Play the hosted game](https://intrepion.github.io/kata-inspired-by-minecraft-codex-dot/)

## Arcade metadata

See [docs/arcade-metadata.md](docs/arcade-metadata.md) for the game-owned manifest and screenshot provenance.

## Optional Creative building

Pause and enable **Creative building · unlimited blocks & flight**. All six hotbar materials become unlimited. Gathering removes blocks immediately, including stone without a pick, without adding to the stored pack. Crafting is unnecessary in this mode. Hold Space to rise, Ctrl to descend, or release both to hover; touch controls add Descend beside Jump / Rise. Ordinary body collision, the foundation and finite world edges remain active. Flight stops at a save-compatible height cap.

The original gathering mode remains the default for old saves and new glades. Turning Creative off restores finite inventory and gravity; it preserves your stored pack. Edits made in Creative stay in the shared world, so placed blocks can later be gathered in ordinary mode. This is a building option, not a resource-separated challenge or a full Minecraft reproduction. The [official Minecraft mode comparison](https://www.minecraft.net/en-us/article/creative-vs-survival-mode) establishes unlimited materials and flight as Creative features. The 40×40 world, six materials and limited crafting remain unchanged; there is still no health, hunger, combat, mob simulation or streaming terrain.

Review verification: 14 tests, typecheck and production build pass, using existing workspace dependencies (Vitest 5.0.3, Vite 8.3.4) through a temporary symlink removed after testing; no fresh lockfile install was run. Tests cover free placement, stone removal, preserved inventory, collision, immutable foundation, flight/hover/ceiling/floor/cap, old saves and malformed mode values. Browser checks at `http://127.0.0.1:18787/` enabled Creative, placed a board from an empty pack, rose above the clearing, descended to the board, reloaded with the mode and edit retained, and returned to gathering with all original inventory counts still zero. Touch controls and physical multitouch were not tested. The build retains its existing >500 kB chunk warning.
