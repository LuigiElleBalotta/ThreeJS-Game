# WoW-TS

A Three.js + TypeScript RPG sandbox with gameplay systems and a Unity-like world editor.

## Setup
```bash
npm install
npm run dev
```
Open `http://localhost:5173`.

Build/preview:
```bash
npm run build
npm run preview
```

## Core Controls
- Movement: `W/S` forward/back, `A/D` rotate, `Space` jump.
- Combat: `1..0` and `-` cast spells.
- UI hotkeys: `B` bags, `C` character, `P` spellbook, `N` talents.
- Chat: `Enter` focus/send.
- Pause: `Esc`.

## World Editor Controls
- `W/E/R`: translate/rotate/scale
- `F`: focus selection
- `Del`: remove selection
- `RMB + WASD`: fly camera
- `Q`: quick context menu

## World Editor Workflow
1. Enter editor mode from character selection and run `.editor on`.
2. Use the bottom `Project / Assets` panel to search/filter assets.
3. Place assets with drag and drop, double click, or `.editor place <decorId>`.
4. Save world placements with `.editor save` (stored in localStorage).
5. If needed, restore defaults with `.editor defaults` or clear with `.editor clear`.

## All Chat Commands
Commands start with `.`

- `.editscale <value>`
  - Scale currently selected creature (positive number).
- `.spawncreature <TEMPLATE_ID> [friendly]`
  - Spawn creature at player position. Optional `friendly` flag.
- `.spawngameobject <TEMPLATE_ID>`
  - Spawn gameobject at player position.
- `.gm on|off`
  - Enable/disable GM behavior.
- `.fly on|off`
  - Toggle fly mode (`Space` up, `X` down).
- `.movehere`
  - Move selected target to player position.
- `.daynight on|off`
  - Toggle day/night cycle.
- `.hasscript`
  - Show script info for selected creature.
- `.showcollisionrays on|off`
  - Toggle collision debug rays.
- `.collisionrays on|off`
  - Alias of `.showcollisionrays`.
- `.editor help`
- `.editor on|off|list [query]|place <decorId>|clear|save|reload|defaults`
- `.worldeditor ...`
  - Alias of `.editor`.

## Decoration Catalog System
Runtime catalog is merged from:
1. Manual config entries (`src/world/unity-decor.config.ts`)
2. Auto-generated local export entries
3. Imported external catalogs (stored in localStorage)

### Auto-generated local catalog
Generate/update from local Unity export folders:
```bash
node tools/generate-unity-exported-decor.mjs
```

Scanned paths:
- `public/unity-import/Resources/Exported/**/*.{obj,fbx,glb,gltf}`
- `public/unity-import/Extracted/world/wmo/**/*.{obj,fbx,glb,gltf}`

Output:
- `src/world/unity-exported-decor.generated.ts`

## External Asset Catalog Import (remote hosts)
From editor toolbar:
- `Import Catalog`: upload JSON file
- `Reset Imported`: remove imported entries from localStorage

Imported entries are merged by `id`:
- same `id` => updated
- new `id` => added

Storage key:
- `wowts.unity_decor_catalog.external.v1`

### What happens during import
1. The JSON file is parsed.
2. Relative URLs are resolved using `baseUrl`.
3. Imported assets are merged into the runtime catalog by `id`.
4. Imported rows are persisted in localStorage.
5. The asset browser updates immediately and new assets become placeable.

## JSON Catalog Standard (v1)
Primary structure is an **asset library** (not map placement data).  
Recommended minimal format:

```json
{
  "version": "wowts.decor-catalog.v1",
  "baseUrl": "https://cdn.example.com/game-assets/",
  "assets": [
    {
      "id": "orc-banner-01",
      "url": "models/orc/banner_01.glb",
      "preview": "previews/orc/banner_01.png"
    }
  ]
}
```

Notes:
- Required per asset: `id`, `url` (aliases supported: `path`, `model`, `resource`).
- `baseUrl` resolves relative paths for model/preview/animations.
- Absolute `https://...` URLs and root-relative `/...` paths are supported.
- This lets you keep the same logic as local `Exporter`, but physically host files elsewhere per install/user.
- Legacy format `{ decorations: [...] }` is still accepted.
- Optional advanced fields (`position`, `rotationY`, `defaultSpawn`, `light`, etc.) remain supported for compatibility.

### Extended example
```json
{
  "version": "wowts.decor-catalog.v1",
  "baseUrl": "https://cdn.example.com/wow-extra/",
  "assets": [
    {
      "id": "torch-horde-01",
      "url": "models/props/torch_horde_01.fbx",
      "preview": "previews/torch_horde_01.png",
      "animations": ["models/props/torch_horde_01_idle.fbx"],
      "collider": false,
      "placeOnGround": true
    }
  ]
}
```

## Asset Browser Filters
In editor Project/Assets panel:
- Search by id/path
- Category: `All`, `Manual`, `Auto`, `WMO`, `World`, `Maps`, `Creature`, `Item`, `Spell`
- Format: `Any`, `OBJ`, `FBX`, `GLB`, `GLTF`

## Important Files
- `src/editor/world-editor.panel.ts`
- `src/world/unity-decor-catalog.ts`
- `src/world/unity-decor.config.ts`
- `src/world/unity-exported-decor.generated.ts`
- `tools/generate-unity-exported-decor.mjs`
- `src/chat/commands/index.ts`
