# AGENTS.md

## Sommario
1. Scopo & principi
2. Come lavorare come agente
3. Mappa del repository
4. Setup rapido
5. Runbook di sviluppo
6. Linee guida di codifica
7. Pipeline asset 3D
8. Budget performance
9. Persistenza locale
10. Comandi ufficiali
11. QA manuale (no test)
12. Convenzioni UI/UX WoW-like
13. Sicurezza & IP
14. Multiplayer (futuro)
15. Troubleshooting
16. Roadmap minima

## Scopo & principi
Gli agenti Codex lavorano come collaboratori tecnici nel repo: esplorano, modificano e documentano il progetto in modo coerente con lo stack attuale (Vite 5, React, Three.js 0.182.0, TS 5, Tailwind 4).  
Principi:
- Non introdurre nuove dipendenze senza approvazione esplicita.
- Preferire cambi piccoli e verificabili.
- Mantenere separazione tra rendering 3D e logica di gioco.
- Rispettare naming e convenzioni esistenti.
- Nessun backend o DB: solo `localStorage`.

## Come lavorare come agente
- Chiedi chiarimenti quando mancano requisiti o asset.
- Commit piccoli e descrittivi; in PR/descrizioni indica il "perche" e l'impatto.
- Non rifattorizzare aree non richieste.
- Evita duplicazione di logica: preferisci funzioni/helper condivisi o classi base estendibili.
- Ogni logica non banale va in un file separato e importata esplicitamente.
- Se tocchi performance/rendering, lascia note su budget e risorse rilasciate.
- Mantieni i comandi esistenti e documenta ogni nuovo script solo se approvato.

## Mappa del repository
Panoramica attuale di `src/`:
- `src/client/`: entrypoint e bootstrap (app iniziale, init UI/Three).
- `src/game.ts`, `src/player.ts`, `src/enemy.ts`, `src/spellFx.ts`: logica core e sistemi principali.
- `src/ui.ts`, `src/dialogs.ts`: UI e dialoghi.
- `src/spells/`, `src/items/`, `src/talents/`: contenuti di gioco per feature.
- `src/enemyScripts/`, `src/waypointScripts.ts`: comportamento AI e navigazione.
- `src/utils/`: helper riusabili.
- `src/chat/`, `src/players/`: moduli social/party.

Struttura destinata a evolvere verso una organizzazione ECS/modulare (es. `src/systems/`, `src/components/`, `src/entities/`).

## Setup rapido
Prerequisiti:
- Node.js `24.9.0`
- npm `11.6.1`

Installazione e avvio:
```bash
node -v
npm -v
npm ci || npm install
npm run dev
```

Build e preview:
```bash
npm run build
npm run preview
```

Dev server: `http://localhost:5173/`

## Runbook di sviluppo
Linee guida operative per nuove feature:
- UI/UX WoW-like: componenti React in `src/ui.ts` o in moduli dedicati (es. `src/ui/` se introdotto).
- Sistemi Three.js: logica in file dedicati con suffisso `.system.ts` (es. `render.system.ts`).
- Effetti spell e particelle: estendere `src/spellFx.ts` o creare `src/spells/*.ts`.
- Import asset: salva modelli/texture in `src/assets/` (se non esiste, creala).

Esempio import modello/texture:
```ts
import heroModelUrl from "./assets/models/hero.glb";
import armorTexUrl from "./assets/textures/armor_basecolor.png";
```

Esempio struttura consigliata per feature:
```txt
src/
  spells/
    frostbolt.system.ts
    frostbolt.component.tsx
  assets/
    models/
    textures/
```

## Linee guida di codifica
- TypeScript obbligatorio.
- Separare logica di gioco e rendering.
- React: distinguere "presentational" e "container".
- Moduli piccoli, coesi, per feature.
- Evitare duplicazione di codice: centralizzare in `src/utils/` o classi base.
- Preferire estensione di classi quando un comportamento deriva da un base comune.
- Evitare file "monolitici": spostare logiche in moduli dedicati.
- Naming:
  - File: `kebab-case` per componenti UI (`action-bar.component.tsx`)
  - Sistemi: suffisso `.system.ts`
  - Componenti React: suffisso `.component.tsx`
  - Tipi: `.types.ts` o in `src/types.ts` se globali
- Evita side effects all'import, preferisci funzioni `init*()` esplicite.

Esempio pattern dispose Three.js:
```ts
const geometry = new THREE.BufferGeometry();
const material = new THREE.MeshStandardMaterial();
const mesh = new THREE.Mesh(geometry, material);

// ...
mesh.geometry.dispose();
if (Array.isArray(mesh.material)) {
  mesh.material.forEach((m) => m.dispose());
} else {
  mesh.material.dispose();
}
```

Esempio pattern classi base/derivate (sistemi o abilita):
```ts
// src/spells/base-spell.system.ts
export abstract class BaseSpellSystem {
  abstract id: string;
  abstract cooldownMs: number;
  abstract cast(): void;

  canCast(lastCastAt: number, now: number) {
    return now - lastCastAt >= this.cooldownMs;
  }
}

// src/spells/fireball.system.ts
import { BaseSpellSystem } from "./base-spell.system";

export class FireballSystem extends BaseSpellSystem {
  id = "fireball";
  cooldownMs = 1500;

  cast() {
    // logica specifica fireball
  }
}
```

## Pipeline asset 3D
Formati supportati:
- Modelli: `GLTF` / `GLB`
- Texture: `PNG`, `JPG`, `KTX2` (se introdotto in futuro)

Linee guida:
- Naming consistente: `snake_case` per file asset (`orc_warrior.glb`).
- Texture atlas quando possibile.
- Se in futuro si introduce compressione (Draco/Meshopt), documentare qui e mantenerla opzionale.

Percorsi consigliati:
```
src/assets/models/
src/assets/textures/
src/assets/vfx/
```

Referenziare asset in codice:
```ts
import modelUrl from "./assets/models/orc_warrior.glb";
```

## Budget performance
Target FPS: 60 (desktop moderni).

Limiti indicativi (per scena):
| Voce | Budget |
| --- | --- |
| Draw calls | <= 200 |
| Polycount (modello singolo) | <= 50k |
| Texture singola | <= 2048x2048 |
| Texture totali in scena | <= 64 MB |

Ottimizzazione Three.js:
- Usa instancing per unita ripetute.
- Attiva frustum culling dove possibile.
- Rilascia geometrie/materiali/texture con `dispose()`.

Ottimizzazione React/Tailwind:
- Riduci re-render con memoization.
- Mantieni la UI in overlay e separata dal render loop 3D.

## Persistenza locale
Solo `localStorage`. Esempio schema chiavi:
- `wowts.save.v1.player`
- `wowts.save.v1.settings`
- `wowts.save.v1.quest_state`

Versionamento e migrazioni:
- Prefisso `vN` in chiave.
- Migrazioni forward-compatible: se la chiave non esiste o ha versione vecchia, fai fallback a default.

Esempio:
```ts
const key = "wowts.save.v1.settings";
const settings = JSON.parse(localStorage.getItem(key) ?? "{}");
```

## Comandi ufficiali
| Comando | Descrizione | Note |
| --- | --- | --- |
| `npm ci` / `npm install` | Installa dipendenze | Usa `npm ci` se lockfile valido |
| `npm run dev` | Avvia dev server | `http://localhost:5173/` |
| `npm run build` | Build produzione | output in `dist/` |
| `npm run preview` | Preview build | serve `dist/` |

## QA manuale (no test)
Checklist minima:
- `npm run build` non fallisce.
- La pagina si carica senza errori in console.
- FPS stabile ~60 nelle scene principali.
- UI coerente con stile WoW-like.
- Nessun warning Three.js persistente su risorse non dispose.

## Convenzioni UI/UX WoW-like
Principi:
- Action bars in basso, minimappa in alto a destra, frame personaggio in alto a sinistra.
- Palette fantasy/bronzo/legno ispirata, senza asset o brand Blizzard.
- Tipografia: scegliere font leggibili e coerenti con il tema (evitare marchi registrati).

Se in futuro esistono riferimenti interni (es. `src/ui/styles.md`), linkarli qui.

## Sicurezza & IP
- Vietati asset, nomi o loghi Blizzard.
- Usare asset originali o licenze compatibili.
- Nessun segreto o token nel repo.

## Multiplayer (futuro)
Placeholder per evoluzione:
- Cartelle attese: `src/net/`, `src/net/messages/`, `src/net/sync/`
- Standard messaggi: JSON versionato, schema chiaro, backward compatibility.
- Autorita server e sincronizzazione stato da definire.

## Troubleshooting
Problemi comuni e fix rapidi:
- HMR Vite instabile: riavvia `npm run dev`, evita side effects all'import.
- Memory leak Three.js: verificare `dispose()` su geometrie/materiali/texture.
- CORS su asset: sposta asset in `src/assets/` o `public/`.
- Performance bassa: ridurre draw calls, usare instancing e texture atlas.
- Driver GPU instabili: testare browser aggiornato o disabilitare estensioni.

## Roadmap minima
Futuro (opzionale, non obbligatorio ora):
- Linting TypeScript/React.
- Test e smoke tests.
- CI/CD base (build + preview).

