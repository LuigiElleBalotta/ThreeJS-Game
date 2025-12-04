# WoW-TS

A Three.js + TypeScript sandbox inspired by WoW. It ships with a static `Nature.glb` map, multiple villages built from environment models, friendly NPCs, hostile creatures, loot, chat commands, and a pause/save system.

## Controls
- Movement: `W/S` forward/back; `A/D` rotate; `Space` jump.
- Camera: mouse; right-click + left-click together moves forward.
- Combat: number keys `1-0`/`-` cast spells; left-click to select enemies; right-click dead enemies with loot to open loot window.
- UI hotkeys: `B` bags, `C` character, `P` spellbook, `N` talents.
- Pause/menu: `Esc` clears selection if you have one; otherwise opens pause menu (Save/Change Character/Resume).
- Chat: press `Enter` to focus; `Enter` to send. Messages show in the chat box.

## Chat Commands
Commands start with `.` and run at your current position/orientation:
- `.spawnCreature <TEMPLATE_ID>` — spawns a creature (template keys like `villager_woman`, `pirate_bandit`, `zombie`, etc.).
- `.spawnGameobject <TEMPLATE_ID>` — spawns a game object/building (template keys in `gameObjectTemplates`, e.g., `fantasy_inn`, `fantasy_house`, `watch_tower`, etc.).
- `.editScale <value>` — scale the currently selected creature.

Unknown commands fall back to normal chat messages. Successful spawns persist in localStorage and reload on game start.

## Game Systems
- **Map & villages**: `Nature.glb` terrain plus ~10 villages built from `public/environment/buildings/*.glb`.
- **Creatures**: Defined in `src/creatures.ts` with templates/spawns, stats, loot tables, speed/scale, and friendly/enemy flags. Non-flying creatures stick to ground.
- **Loot**: Hostiles always drop gold; item drops follow per-template loot tables.
- **Saving**: Pause menu “Save” writes character state to localStorage per character id (inventory, gold, equipment, talents, stats, position/rotation, spell slots). Loads automatically when you pick the same character.
- **Pause**: Animation/game logic pauses while the menu is open.

## Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the project:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173`

## Useful Files
- `src/creatures.ts`: creature templates, loot tables, spawns.
- `src/gameobjects.ts`: building/environment templates and village layout.
- `src/chat/commands`: chat command handlers.
- `public/environment/maps/Nature.glb`: base terrain.
