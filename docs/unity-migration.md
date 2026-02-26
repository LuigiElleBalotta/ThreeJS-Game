# Unity -> wow-ts migration

## Stato
- Loader runtime esteso per `.glb/.gltf/.fbx/.obj` in [src/game.ts](/c:/repositories/NO_WORK/wow-ts/src/game.ts).
- Script di import disponibile in [tools/unity-migrate.mjs](/c:/repositories/NO_WORK/wow-ts/tools/unity-migrate.mjs).
- Sistema animazioni "intelligente" per modello:
  - inferenza clip (`idle/run/attack/cast/death`) in [src/utils/animationProfile.ts](/c:/repositories/NO_WORK/wow-ts/src/utils/animationProfile.ts)
  - controller condiviso in [src/animationController.ts](/c:/repositories/NO_WORK/wow-ts/src/animationController.ts)
  - applicazione su player/enemy/world prefab in [src/player.ts](/c:/repositories/NO_WORK/wow-ts/src/player.ts), [src/enemy.ts](/c:/repositories/NO_WORK/wow-ts/src/enemy.ts), [src/game.ts](/c:/repositories/NO_WORK/wow-ts/src/game.ts)
- Mappa ambiente Unity attiva tramite configurazione [src/world/unity-world.config.ts](/c:/repositories/NO_WORK/wow-ts/src/world/unity-world.config.ts) (Orgrimmar OBJ).
- Classe `ranger` aggiunta con personaggio selezionabile `Sylvanas` (modello+animazioni Unity) in [src/players/ranger.ts](/c:/repositories/NO_WORK/wow-ts/src/players/ranger.ts).
- Report generati in:
  - `docs/unity-asset-report.json`
  - `docs/unity-script-inventory.json`

## Esecuzione
Dry-run (non copia file, genera solo report):

```bash
node tools/unity-migrate.mjs --source "C:\repositories\NO_WORK\WowStudyProject"
```

Copia asset compatibili in `public/unity-import`:

```bash
node tools/unity-migrate.mjs --source "C:\repositories\NO_WORK\WowStudyProject" --copy
```

Filtro estensioni (opzionale):

```bash
node tools/unity-migrate.mjs --source "C:\repositories\NO_WORK\WowStudyProject" --copy --include-ext ".fbx,.obj,.mtl,.png,.jpg"
```

## Regole conversione C# -> TS
- Priorita 1: `Assets/Scripts/Core/**` e `Assets/Game/Scripts/**` (logica gameplay).
- Priorita 2: script environment e utility non legati a API Unity esclusive.
- Esclusi: `Assets/Editor/**`, `Standard Assets`, plugin terzi (`OBJImport`, pack demo) salvo casi specifici.

## Note
- I file Unity `.meta`, `.unity`, `.prefab`, `.mat`, `.shader` non sono direttamente eseguibili nel runtime Three.js.
- Verificare licenze degli asset prima della pubblicazione.
