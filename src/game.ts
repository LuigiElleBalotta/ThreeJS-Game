import * as THREE from "three";
import { Player } from "./player";
import { Enemy } from "./enemy";
import { UI } from "./client/ui";
import { ThirdPersonCamera } from "./camera";
import { SPELL_REGISTRY } from "./spells";
import { getSpellsForClass } from "./spells";
import { ITEM_REGISTRY, getRandomLoot, getItemById } from "./items";
import { getTalentsForClass } from "./talents";
import { creatureTemplates, creatureSpawns, CreatureTemplate, creatureTemplateLoot } from "./creatures";
import { handleChatCommand } from "./chat/commands";
import { gameObjectTemplates, gameObjectSpawns, buildGeometryGroup } from "./gameobjects";
import { WarriorPlayer } from "./players/warrior";
import { RoguePlayer } from "./players/rogue";
import { MagePlayer } from "./players/mage";
import { SpellFX } from "./spellFx";
import { gossipMenus, npcTexts } from "./dialogs";

export class Game {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    player!: Player;
    enemies: Enemy[] = [];
    keys: Set<string> = new Set();
    ui!: UI;
    clock!: THREE.Clock;

    cameraControl!: ThirdPersonCamera;
    rightMouseDown: boolean = false;
    mouseLeftDown: boolean = false;
    healthBarsVisible: boolean = true;
    healthBarStatusDiv!: HTMLDivElement;
    sceneObstacles: THREE.Mesh[] = [];

    loaderDiv!: HTMLDivElement;
    fpsDiv!: HTMLDivElement;
    lastFpsUpdate: number = 0;
    frames: number = 0;
    fps: number = 0;
    isDaytime: boolean = true;
    dayNightTimer: number = 0;
    dayNightDuration: number = 120000; // 2 minutes full cycle
    dayNightEnabled: boolean = false;
    ambientLight!: THREE.AmbientLight;
    sunLight!: THREE.DirectionalLight;

    audio: HTMLAudioElement;
    audioStarted: boolean = false;
    mousePos = { x: 0, y: 0 };
    selectedEnemy: Enemy | null = null;
    selectionCircle: THREE.Mesh | null = null;
    damageTexts: { div: HTMLDivElement, start: number, angle: number }[] = [];
    spellLastCast: number[] = Array(12).fill(0);
    globalCooldown: number = 650;
    lastGlobalCast: number = 0;
    spellSlots: (string | null)[] = Array(12).fill(null);
    projectiles: { mesh: THREE.Mesh, target: Enemy, damage: number, isCrit: boolean, speed: number }[] = [];
    casting: { spell: any; slot: number; target: Enemy | null; start: number; end: number } | null = null;
    fx: SpellFX = new SpellFX();
    isGhost: boolean = false;
    corpsePosition: THREE.Vector3 | null = null;
    lastSpawnPosition: THREE.Vector3 = new THREE.Vector3(5, 1, -15);
    corpseMarker: THREE.Mesh | null = null;
    corpseArrow: HTMLDivElement | null = null;
    revivePopup: HTMLDivElement | null = null;
    reviveRadius: number = 8;

    enemyBarDiv: HTMLDivElement | null = null;
    logoutBtn: HTMLButtonElement | null = null;
    inventory: any[] = [];
    gold: number = 0;
    learnedTalents: Set<string> = new Set();
    lootTarget: Enemy | null = null;
    npcs: { mesh: THREE.Object3D; name: string; template: CreatureTemplate }[] = [];
    creaturePrefabs: Record<string, any> = {};
    gameObjectPrefabs: Record<string, any> = {};
    volatileSpawns: { creatures: any[]; gameobjects: any[] } = { creatures: [], gameobjects: [] };
    gossipTarget: Enemy | null = null;
    creatureTemplates = creatureTemplates;
    gameObjectTemplates = gameObjectTemplates;
    paused: boolean = false;
    pauseOverlay: HTMLDivElement | null = null;
    playerWasMoving: boolean = false;
    isGM: boolean = false;

    lastCombatTime: number = 0;
    lastLogTime: number = 0;
    lastHpRegenTime: number = 0;
    worldInitialized: boolean = false;
    authUser: { email: string } | null = null;
    characters: any[] = [];
    currentCharacter: any | null = null;
    loginOverlay: HTMLDivElement | null = null;
    characterOverlay: HTMLDivElement | null = null;

    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1d2433);
        this.scene.fog = new THREE.Fog(0x1f2a38, 25, 180);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        // FPS overlay
        this.fpsDiv = document.createElement("div");
        this.fpsDiv.style.position = "fixed";
        this.fpsDiv.style.bottom = "10px";
        this.fpsDiv.style.right = "20px";
        this.fpsDiv.style.background = "rgba(0,0,0,0.7)";
        this.fpsDiv.style.color = "#0f0";
        this.fpsDiv.style.fontFamily = "monospace";
        this.fpsDiv.style.fontSize = "1.2rem";
        this.fpsDiv.style.padding = "6px 16px";
        this.fpsDiv.style.borderRadius = "8px";
        this.fpsDiv.style.zIndex = "99999";
        this.fpsDiv.innerText = "FPS: ...";
        document.body.appendChild(this.fpsDiv);
        this.fpsDiv.style.display = "block";

        // Subtle vignette overlay
        const vignette = document.createElement("div");
        vignette.style.position = "fixed";
        vignette.style.top = "0";
        vignette.style.left = "0";
        vignette.style.width = "100vw";
        vignette.style.height = "100vh";
        vignette.style.pointerEvents = "none";
        vignette.style.background = "radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(0,0,0,0.45) 100%)";
        vignette.style.zIndex = "2";
        document.body.appendChild(vignette);

        // Loader overlay
        // Loader overlay (with spinner)
        const loaderStyle = document.createElement("style");
        loaderStyle.innerHTML = `
    @keyframes wow-loader-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes wow-loader-pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
    `;
        document.head.appendChild(loaderStyle);
        this.loaderDiv = document.createElement("div");
        this.loaderDiv.style.position = "fixed";
        this.loaderDiv.style.top = "0";
        this.loaderDiv.style.left = "0";
        this.loaderDiv.style.width = "100vw";
        this.loaderDiv.style.height = "100vh";
        this.loaderDiv.style.background = "radial-gradient(circle at 30% 30%, rgba(60,45,30,0.8), rgba(12,8,5,0.95))";
        this.loaderDiv.style.backdropFilter = "blur(4px)";
        this.loaderDiv.style.color = "#f6d48b";
        this.loaderDiv.style.fontSize = "2rem";
        this.loaderDiv.style.display = "flex";
        this.loaderDiv.style.alignItems = "center";
        this.loaderDiv.style.justifyContent = "center";
        this.loaderDiv.style.zIndex = "999999";
        this.loaderDiv.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;gap:16px;padding:24px 32px;border:2px solid #c49a3a;border-radius:14px;background:linear-gradient(135deg, rgba(34,24,16,0.9), rgba(18,12,8,0.95));box-shadow:0 8px 28px rgba(0,0,0,0.6)">
        <div style="width:68px;height:68px;border:4px solid rgba(246,212,139,0.35);border-top-color:#f6d48b;border-radius:50%;animation:wow-loader-spin 1s linear infinite;"></div>
        <div style="font-weight:800;text-shadow:0 0 12px #000;animation:wow-loader-pulse 1.6s ease-in-out infinite;">Loading world...</div>
        <div style="font-size:0.95rem;color:#d8c7a1;text-align:center;max-width:260px;line-height:1.4;">Preparing terrain, villages, creatures, and your character state.</div>
      </div>
    `;
        document.body.appendChild(this.loaderDiv);

        // Crea e aggiungi il div per il messaggio stato healthbar
        this.healthBarStatusDiv = document.createElement("div");
        this.healthBarStatusDiv.style.position = "fixed";
        this.healthBarStatusDiv.style.top = "40px";
        this.healthBarStatusDiv.style.left = "50%";
        this.healthBarStatusDiv.style.transform = "translateX(-50%)";
        this.healthBarStatusDiv.style.display = "none";
        document.body.appendChild(this.healthBarStatusDiv);

        // Mobile overlay
        const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop|Mobile/i.test(navigator.userAgent) || window.innerWidth < 800;
        if (isMobile) {
            const mobileOverlay = document.createElement("div");
            mobileOverlay.id = "mobile-rotate-overlay";
            mobileOverlay.style.position = "fixed";
            mobileOverlay.style.top = "0";
            mobileOverlay.style.left = "0";
            mobileOverlay.style.width = "100vw";
            mobileOverlay.style.height = "100vh";
            mobileOverlay.style.background = "rgba(0,0,0,0.85)";
            mobileOverlay.style.display = "flex";
            mobileOverlay.style.alignItems = "center";
            mobileOverlay.style.justifyContent = "center";
            mobileOverlay.style.zIndex = "9999999";
            mobileOverlay.style.color = "#fff";
            mobileOverlay.style.fontSize = "2.5rem";
            mobileOverlay.style.fontWeight = "bold";
            mobileOverlay.innerText = "Rotate your phone to play";
            document.body.appendChild(mobileOverlay);
            setTimeout(() => {
                mobileOverlay.remove();
            }, 5000);
        }

        // Responsive resize (canvas e camera)
        const resizeCanvas = () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener("resize", resizeCanvas);
        window.addEventListener("orientationchange", resizeCanvas);

        // Fullscreen button (mobile)
        // RIMOSSO: non mostrare più il tasto fullscreen su mobile

        // Musica di sottofondo
        this.audio = new Audio("/music/background.mp3");
        this.audio.loop = true;
        this.audio.volume = 0.35;
        this.audio.muted = false;

        // Avvia la musica al primo input utente (con retry in caso di blocco autoplay)
        const startAudio = async () => {
            if (this.audioStarted) return;
            try {
                this.audio.muted = false;
                this.audio.currentTime = 0;
                await this.audio.play();
                this.audioStarted = true;
            } catch (err) {
                console.warn("Audio play blocked, retry on next input", err);
                this.ui?.addChatMessage("System", "Browser blocked audio. Click/tap again to enable sound.");
            }
        };
        ["keydown", "mousedown", "touchstart", "click", "pointerdown"].forEach(ev => {
            window.addEventListener(ev, startAudio, { once: false });
        });

        // Default loadout for new player
        this.spellSlots[0] = "heroic_strike";
        this.spellSlots[1] = "arcane_bolt";

        this.setupLoginFlow();
        this.setupChatCommands();

        // Gestione hotkey spellbar (1-0,-,click)
        window.addEventListener("keydown", (e) => {
            const target = e.target as HTMLElement | null;
            if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
            const key = e.key;
            if (key === "1") this.castSpell(0);
            if (key === "2") this.castSpell(1);
            if (key === "3") this.castSpell(2);
            if (key === "4") this.castSpell(3);
            if (key === "5") this.castSpell(4);
            if (key === "6") this.castSpell(5);
            if (key === "7") this.castSpell(6);
            if (key === "8") this.castSpell(7);
            if (key === "9") this.castSpell(8);
            if (key === "0") this.castSpell(9);
            if (key === "-") this.castSpell(10);
            if (key === "Escape") {
                if (this.selectedEnemy) {
                    this.selectedEnemy = null;
                } else {
                    this.togglePauseMenu();
                }
            }
        });

        // Talenti
        window.addEventListener("learnTalent", (e: any) => {
            const talentId = e.detail?.talentId;
            if (!talentId) return;
            if (this.learnedTalents.has(talentId)) return;
            const talent = getTalentsForClass(this.player.classId).find(t => t.id === talentId);
            if (talent) {
                talent.apply({ player: this.player, game: this });
                this.learnedTalents.add(talentId);
                this.ui.populateTalents(getTalentsForClass(this.player.classId), this.learnedTalents);
            }
        });

        // Barra vita nemico selezionato in alto a destra
        this.enemyBarDiv = document.createElement("div");
        this.enemyBarDiv.style.position = "fixed";
        this.enemyBarDiv.style.top = "32px";
        this.enemyBarDiv.style.right = "32px";
        this.enemyBarDiv.style.width = "320px";
        this.enemyBarDiv.style.height = "68px";
        this.enemyBarDiv.style.background = "linear-gradient(135deg, rgba(32,24,15,0.95), rgba(18,14,9,0.95))";
        this.enemyBarDiv.style.border = "2px solid #c49a3a";
        this.enemyBarDiv.style.borderRadius = "14px";
        this.enemyBarDiv.style.display = "none";
        this.enemyBarDiv.style.zIndex = "10002";
        this.enemyBarDiv.style.boxShadow = "0 4px 16px rgba(0,0,0,0.65)";
        this.enemyBarDiv.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 14px 0 14px;">
        <div id="enemy-bar-name" style="color:#f7d09b;font-weight:800;font-size:1.05rem;text-shadow:0 0 6px #000;">Enemy</div>
        <div id="enemy-aggro" style="color:#ff6d6d;font-weight:800;font-size:0.95rem;text-shadow:0 0 8px #000;">TARGET</div>
      </div>
      <div style="width:90%;height:18px;background:#221414;border-radius:10px;margin:4px auto 4px auto;position:relative;overflow:hidden;border:1px solid #4b1f1f;">
        <div id="enemy-bar-hp" style="height:100%;background:linear-gradient(90deg,#7d0f0f,#d83d3d);border-radius:10px;width:100%;transition:width 0.2s;"></div>
        <div id="enemy-bar-hp-text" style="position:absolute;left:50%;top:0;transform:translateX(-50%);color:#fff;font-size:0.95rem;font-weight:800;text-shadow:0 0 4px #000;">HP</div>
      </div>
      <div style="width:90%;height:10px;background:#1a1a1a;border-radius:8px;margin:0 auto 6px auto;position:relative;overflow:hidden;border:1px solid #7f5b21;">
        <div id="enemy-bar-cast" style="height:100%;background:linear-gradient(90deg,#e35d2e,#ffb27a);border-radius:8px;width:0%;transition:width 0.05s;"></div>
      </div>
    `;
        document.body.appendChild(this.enemyBarDiv);

        // Click/tap sui vari slot spellbar (mobile e desktop)
        setTimeout(() => {
            const spellbar = document.getElementById("spellbar");
            if (spellbar) {
                spellbar.style.pointerEvents = "auto";
                spellbar.style.zIndex = "100001";
                spellbar.style.position = "fixed";
                spellbar.style.left = "50%";
                spellbar.style.bottom = "0";
                spellbar.style.transform = "translateX(-50%)";
                spellbar.style.width = "auto";
                spellbar.style.display = "flex";
                spellbar.style.flexDirection = "row";
                spellbar.style.justifyContent = "center";
                spellbar.style.alignItems = "center";
                spellbar.style.background = "rgba(0,0,0,0.2)";
                spellbar.style.gap = "8px";
                spellbar.style.padding = "8px 0";
                spellbar.style.touchAction = "auto";
                const slots = spellbar.getElementsByClassName("spell-slot");
                for (let i = 0; i < slots.length; i++) {
                    const slot = slots[i] as HTMLElement;
                    slot.style.pointerEvents = "auto";
                    slot.style.zIndex = "100002";
                    slot.style.touchAction = "auto";
                    slot.style.background = "#222";
                    slot.style.border = "2px solid #fff";
                    slot.style.borderRadius = "10px";
                    slot.style.width = "56px";
                    slot.style.height = "56px";
                    slot.style.display = "flex";
                    slot.style.alignItems = "center";
                    slot.style.justifyContent = "center";
                    const idxFromData = slot.dataset.index ? parseInt(slot.dataset.index) : 0;
                    slot.addEventListener("click", (e) => {
                        console.log("CLICK spell-slot", i + 1, e.type, e, slot);
                        e.stopPropagation();
                        this.castSpell(idxFromData);
                    }, { passive: false });
                    slot.addEventListener("pointerdown", (e) => {
                        console.log("POINTERDOWN spell-slot", i + 1, e.type, e, slot);
                        e.stopPropagation();
                        e.preventDefault();
                        console.log('CAST SPELL SLOT', idxFromData);
                        this.castSpell(idxFromData);
                    }, { passive: false });
                    slot.addEventListener("touchend", (e) => {
                        console.log("TOUCHEND spell-slot", i + 1, e.type, e, slot);
                        e.stopPropagation();
                        e.preventDefault();
                    }, { passive: false });
                }
            }
        }, 500);

        // Mostra testo danno subito
        window.addEventListener("playerDamage", (e: any) => {
            const amount = e.detail.amount;
            // Combat timer: resetta ogni danno subito
            this.lastCombatTime = performance.now();
            // Se chi ha inflitto il danno è noto e non è già selezionato, selezionalo
            if (e.detail && e.detail.sourceEnemy && (!this.selectedEnemy || this.selectedEnemy !== e.detail.sourceEnemy)) {
                this.selectedEnemy = e.detail.sourceEnemy;
            }
            const div = document.createElement("div");
            div.innerText = `-${amount}`;
            div.style.position = "fixed";
            div.style.color = "#ff2222";
            div.style.fontWeight = "bold";
            div.style.fontSize = "28px";
            div.style.pointerEvents = "none";
            div.style.textShadow = "0 0 8px #000, 0 0 2px #fff";
            div.style.zIndex = "99999";
            div.style.padding = "2px 10px";
            div.style.borderRadius = "8px";
            div.style.background = "rgba(0,0,0,0.15)";
            document.body.appendChild(div);
            // Angolo random per effetto circolare
            const angle = Math.random() * Math.PI * 2;
            this.damageTexts.push({ div, start: performance.now(), angle });
        });

        window.addEventListener("spellSlotAssigned", (e: any) => {
            const { slotIndex, spellId } = e.detail;
            if (typeof slotIndex === "number") {
                this.spellSlots[slotIndex] = spellId;
                // Update slot visuals if icon exists
                const slot = document.querySelector(`#spellbar .spell-slot[data-index='${slotIndex}']`) as HTMLElement | null;
                if (slot) {
                    const spell = SPELL_REGISTRY[spellId];
                    slot.innerHTML = "";
                    const number = document.createElement("div");
                    number.textContent = `${slotIndex + 1}`;
                    number.style.position = "absolute";
                    number.style.bottom = "4px";
                    number.style.right = "6px";
                    number.style.fontSize = "0.75rem";
                    number.style.color = "#f7d09b";
                    number.style.textShadow = "0 0 4px #000";
                    slot.appendChild(number);
                    if (spell?.icon) {
                        const icon = document.createElement("img");
                        icon.src = spell.icon;
                        icon.alt = spell.name;
                        icon.style.width = "100%";
                        icon.style.height = "100%";
                        icon.style.objectFit = "cover";
                        icon.style.borderRadius = "6px";
                        slot.appendChild(icon);
                    } else {
                        const label = document.createElement("div");
                        label.textContent = spell?.name ?? spellId;
                        label.style.fontWeight = "800";
                        label.style.fontSize = "0.75rem";
                        label.style.textAlign = "center";
                        label.style.padding = "6px";
                        slot.appendChild(label);
                    }
                    slot.dataset.spellDesc = spell?.description || spell?.name || "";
                    slot.dataset.spellId = spellId;
                }
            }
        });

        window.addEventListener("spellSlotClear", (e: any) => {
            const idx = e.detail?.slotIndex;
            if (typeof idx === "number") {
                this.spellSlots[idx] = null;
                const slot = document.querySelector(`#spellbar .spell-slot[data-index='${idx}']`) as HTMLElement | null;
                if (slot) {
                    slot.innerHTML = "";
                    const number = document.createElement("div");
                    number.textContent = `${idx + 1}`;
                    number.style.position = "absolute";
                    number.style.bottom = "4px";
                    number.style.right = "6px";
                    number.style.fontSize = "0.75rem";
                    number.style.color = "#f7d09b";
                    number.style.textShadow = "0 0 4px #000";
                    slot.appendChild(number);
                }
            }
        });

        window.addEventListener("inventoryMove", (e: any) => {
            const { itemId, from, to, toSlot } = e.detail || {};
            if (!itemId) return;
            const item = getItemById(itemId);
            let removedFromBag = false;
            if (from === "bag") {
                const idx = this.inventory.indexOf(itemId);
                if (idx >= 0) {
                    this.inventory.splice(idx, 1);
                    removedFromBag = true;
                }
            } else if (from === "equip") {
                Object.keys(this.currentCharacter.equipment || {}).forEach(slot => {
                    if (this.currentCharacter.equipment[slot] === itemId) this.currentCharacter.equipment[slot] = null;
                });
            }
            if (to === "bag") {
                this.inventory.push(itemId);
            } else if (to === "equip") {
                if (toSlot) {
                    const existing = this.currentCharacter.equipment[toSlot];
                    this.currentCharacter.equipment[toSlot] = itemId;
                    // Swap back the previous item if there was one
                    if (existing) this.inventory.push(existing);
                }
            } else if (to === "use") {
                if (item?.use) {
                    item.use({ player: this.player, game: this });
                } else if (removedFromBag) {
                    // non-usable; restore to bag
                    this.inventory.push(itemId);
                }
            } else if (to === "void") {
                // drop/delete
            } else {
                // fallback: restore if removed but not placed
                if (removedFromBag) this.inventory.push(itemId);
            }
            this.ui.populateBags(this.inventory.map((id: string) => getItemById(id)), this.gold);
            const equipIds = this.currentCharacter?.equipment || {};
            const equipObj: Record<string, any> = {};
            Object.keys(equipIds || {}).forEach(slot => {
                const id = (equipIds as any)[slot];
                equipObj[slot] = id ? getItemById(id) : null;
            });
            this.ui.populateEquipment(equipObj);
        });

        // Level up banner
        window.addEventListener("playerLevelUp", (e: any) => {
            const div = document.createElement("div");
            div.innerText = `Level Up! (Lv. ${e.detail.level})`;
            div.style.position = "fixed";
            div.style.left = "50%";
            div.style.top = "18%";
            div.style.transform = "translateX(-50%)";
            div.style.color = "#f7e6b5";
            div.style.fontSize = "2.4rem";
            div.style.fontWeight = "900";
            div.style.textShadow = "0 0 14px #000, 0 0 6px #b8863b";
            div.style.zIndex = "100000";
            document.body.appendChild(div);
            setTimeout(() => div.remove(), 1100);
        });

        // Selezione nemico con click
        window.addEventListener("mousedown", (event) => {
            if (event.button !== 0) return; // solo click sinistro
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(this.mousePos, this.camera);
            let found: Enemy | null = null;
            for (const enemy of this.enemies) {
                if (!enemy.isAlive() || !enemy.isEnemy) continue;
                const intersects = raycaster.intersectObject(enemy.mesh, true);
                if (intersects.length > 0) {
                    found = enemy;
                    break;
                }
            }
            this.selectedEnemy = found;
        });

        // Selezione nemico tramite healthbar (click/tap)
        window.addEventListener("selectEnemy", (e: any) => {
            if (e.detail && e.detail.enemy) {
                this.selectedEnemy = e.detail.enemy;
            }
        });

        // Mobile controller
        if (isMobile) {
            // --- CONTROLLER MOBILE CUSTOM ---
            const controller = document.createElement("div");
            controller.id = "mobile-controller";
            controller.style.position = "fixed";
            controller.style.left = "2vw";
            controller.style.right = "2vw";
            controller.style.bottom = "10vh";
            controller.style.zIndex = "99999";
            controller.style.display = "flex";
            controller.style.flexDirection = "row";
            controller.style.alignItems = "center";
            controller.style.justifyContent = "space-between";
            controller.style.width = "96vw";
            controller.style.pointerEvents = "none";

            // Jump button a sinistra del contenitore
            const jumpBtn = document.createElement("button");
            jumpBtn.innerText = "⤒";
            jumpBtn.style.width = "60px";
            jumpBtn.style.height = "60px";
            jumpBtn.style.fontSize = "2rem";
            jumpBtn.style.opacity = "0.9";
            jumpBtn.style.background = "#ff0060";
            jumpBtn.style.color = "#fff";
            jumpBtn.style.border = "2px solid #fff";
            jumpBtn.style.borderRadius = "50%";
            jumpBtn.style.touchAction = "none";
            jumpBtn.style.userSelect = "none";
            jumpBtn.style.outline = "none";
            jumpBtn.style.marginBottom = "10px";
            jumpBtn.style.pointerEvents = "auto";
            jumpBtn.addEventListener("touchstart", e => {
                e.preventDefault();
                this.keys.add(" ");
                this.player && this.player.jump();
            });
            jumpBtn.addEventListener("touchend", () => this.keys.delete(" "));

            // Knob analogico (tipo PlayStation) a destra del contenitore
            const knobArea = document.createElement("div");
            knobArea.style.position = "relative";
            knobArea.style.width = "120px";
            knobArea.style.height = "120px";
            knobArea.style.background = "rgba(40,40,40,0.4)";
            knobArea.style.borderRadius = "50%";
            knobArea.style.touchAction = "none";
            knobArea.style.marginBottom = "10px";
            knobArea.style.marginLeft = "10px";
            knobArea.style.display = "flex";
            knobArea.style.alignItems = "center";
            knobArea.style.justifyContent = "center";
            knobArea.style.zIndex = "100000";

            controller.appendChild(jumpBtn);
            controller.appendChild(knobArea);
            document.body.appendChild(controller);

            const knob = document.createElement("div");
            knob.style.width = "56px";
            knob.style.height = "56px";
            knob.style.background = "#222";
            knob.style.border = "2px solid #fff";
            knob.style.borderRadius = "50%";
            knob.style.position = "absolute";
            knob.style.left = "32px";
            knob.style.top = "32px";
            knob.style.transition = "left 0.1s, top 0.1s";
            knob.style.pointerEvents = "auto";
            knob.style.zIndex = "100002";
            knobArea.appendChild(knob);

            knobArea.style.pointerEvents = "auto";
            knobArea.style.zIndex = "100001";

            let knobActive = false;
            let knobStart = { x: 0, y: 0 };
            let knobDir = { x: 0, y: 0 };

            knobArea.addEventListener("touchstart", (e) => {
                console.log("KNOB-AREA touchstart", e.type, e, knobArea);
                e.stopPropagation();
                e.preventDefault();
                knobActive = true;
                const touch = e.touches[0];
                knobStart = { x: touch.clientX, y: touch.clientY };
            });
            knobArea.addEventListener("touchmove", (e) => {
                console.log("KNOB-AREA touchmove", e.type, e, knobArea);
                e.stopPropagation();
                e.preventDefault();
                if (!knobActive) return;
                const touch = e.touches[0];
                const dx = touch.clientX - knobStart.x;
                const dy = touch.clientY - knobStart.y;
                const dist = Math.min(Math.sqrt(dx * dx + dy * dy), 40);
                const angle = Math.atan2(dy, dx);
                const x = Math.cos(angle) * dist;
                const y = Math.sin(angle) * dist;
                knob.style.left = `${32 + x}px`;
                knob.style.top = `${32 + y}px`;
                knobDir = { x: x / 40, y: y / 40 };
                // Movimento: avanti/indietro/rotazione
                if (Math.abs(knobDir.y) > 0.3) {
                    if (knobDir.y < 0) this.keys.add("w");
                    else this.keys.add("s");
                } else {
                    this.keys.delete("w");
                    this.keys.delete("s");
                }
                if (Math.abs(knobDir.x) > 0.3) {
                    if (knobDir.x < 0) this.keys.add("a");
                    else this.keys.add("d");
                } else {
                    this.keys.delete("a");
                    this.keys.delete("d");
                }
            });
            knobArea.addEventListener("touchend", (e) => {
                console.log("KNOB-AREA touchend", e.type, e, knobArea);
                e.stopPropagation();
                e.preventDefault();
                knobActive = false;
                knob.style.left = "32px";
                knob.style.top = "32px";
                knobDir = { x: 0, y: 0 };
                this.keys.delete("w");
                this.keys.delete("a");
                this.keys.delete("s");
                this.keys.delete("d");
            });

            controller.appendChild(knobArea);

            document.body.appendChild(controller);

            // Swipe sulla canvas: solo rotazione camera, nessun movimento player
            let lastTouchX: number | null = null;
            let isSwiping = false;
            const swipeArea = this.renderer.domElement;
            // RIMUOVI il blocco globale degli eventi touch su spellbar e controller mobile

            swipeArea.addEventListener("touchstart", (e) => {
                // Ignora se il target è knobArea o spellbar o figli
                const target = e.target as HTMLElement;
                if (
                    target.closest("#mobile-controller") ||
                    target.closest("#spellbar")
                ) {
                    return;
                }
                if (e.touches.length === 1) {
                    lastTouchX = e.touches[0].clientX;
                    isSwiping = true;
                }
            });
            swipeArea.addEventListener("touchmove", (e) => {
                if (isSwiping && e.touches.length === 1 && lastTouchX !== null) {
                    e.preventDefault();
                    const dx = e.touches[0].clientX - lastTouchX;
                    lastTouchX = e.touches[0].clientX;
                    // Sensibilità swipe (più basso = più sensibile)
                    this.cameraControl.rotation.y -= dx * 0.008;
                }
            }, { passive: false });
            swipeArea.addEventListener("touchend", () => {
                isSwiping = false;
                lastTouchX = null;
            });
        }
    }

    setupLoginFlow() {
        this.characters = [
            { id: "char-1", name: "Thorin", classId: "warrior", level: 1, gold: 10, inventory: ["training_shield"], equipment: { weapon: "rusty_sword", offhand: "training_shield" } },
            { id: "char-2", name: "Meriel", classId: "mage", level: 1, gold: 10, inventory: ["cloth_gloves"], equipment: { weapon: "apprentice_staff", hands: "cloth_gloves" } },
            { id: "char-3", name: "Shade", classId: "rogue", level: 1, gold: 10, inventory: [], equipment: { weapon: "rogue_daggers" } },
        ];
        this.buildLoginOverlay();
    }

    returnToCharacterSelect() {
        // Stop world updates
        this.worldInitialized = false;
        this.clock = undefined as any;
        this.selectedEnemy = null;
        this.spellSlots = Array(12).fill(null);
        // Remove player and enemies
        if (this.player && this.player.mesh) {
            this.scene.remove(this.player.mesh);
        }
        this.enemies.forEach(e => {
            if (e.mesh) this.scene.remove(e.mesh);
            if (e.healthBarDiv) e.healthBarDiv.remove();
        });
        this.enemies = [];
        // Remove selection ring
        if (this.selectionCircle) {
            this.scene.remove(this.selectionCircle);
            this.selectionCircle = null;
        }
        // Remove enemy bar
        if (this.enemyBarDiv) {
            this.enemyBarDiv.remove();
            this.enemyBarDiv = null;
        }
        // Hide logout button
        if (this.logoutBtn) this.logoutBtn.style.display = "none";
        this.inventory = [];
        this.gold = 0;
        this.learnedTalents.clear();
        // Remove UI overlays created by UI class
        const spellbar = document.getElementById("spellbar");
        if (spellbar) spellbar.remove();
        ["modal-character", "modal-spellbook", "modal-talents", "modal-bags"].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });
        const toolbar = document.getElementById("wow-toolbar");
        if (toolbar) toolbar.remove();

        // Show character selection again
        this.buildCharacterOverlay();
    }

    buildLoginOverlay() {
        // Hide loader while in auth/selection
        if (this.loaderDiv) this.loaderDiv.style.display = "none";
        const overlay = document.createElement("div");
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100vw";
        overlay.style.height = "100vh";
        overlay.style.background = "rgba(0,0,0,0.8)";
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        overlay.style.zIndex = "1000001";
        overlay.innerHTML = `
      <div style="background:#1a140d;border:2px solid #c49a3a;border-radius:12px;padding:24px 28px;box-shadow:0 6px 20px rgba(0,0,0,0.7);width:360px;">
        <div style="color:#f6d48b;font-weight:800;font-size:1.2rem;margin-bottom:12px;text-align:center;">Login</div>
        <label style="color:#d8c7a1;font-size:0.95rem;">Email</label>
        <input id="login-email" style="width:100%;margin-top:4px;margin-bottom:12px;padding:8px;border-radius:8px;border:1px solid #c49a3a;background:#0f0a07;color:#f6d48b;" value="admin@admin.it" />
        <label style="color:#d8c7a1;font-size:0.95rem;">Password</label>
        <input id="login-pass" type="password" style="width:100%;margin-top:4px;margin-bottom:16px;padding:8px;border-radius:8px;border:1px solid #c49a3a;background:#0f0a07;color:#f6d48b;" value="admin" />
        <button id="login-btn" style="width:100%;padding:10px;border-radius:10px;border:1px solid #c49a3a;background:#2b1a0f;color:#f6d48b;font-weight:800;cursor:pointer;">Enter</button>
        <div id="login-error" style="margin-top:10px;color:#ff7b7b;font-size:0.9rem;display:none;text-align:center;">Invalid credentials</div>
      </div>
    `;
        document.body.appendChild(overlay);
        this.loginOverlay = overlay;
        const btn = overlay.querySelector("#login-btn") as HTMLButtonElement;
        btn.onclick = () => {
            const email = (overlay.querySelector("#login-email") as HTMLInputElement).value;
            const pass = (overlay.querySelector("#login-pass") as HTMLInputElement).value;
            if (email === "admin@admin.it" && pass === "admin") {
                this.authUser = { email };
                overlay.remove();
                this.loginOverlay = null;
                this.buildCharacterOverlay();
            } else {
                const err = overlay.querySelector("#login-error") as HTMLDivElement;
                if (err) err.style.display = "block";
            }
        };
    }

    buildCharacterOverlay() {
        if (this.loaderDiv) this.loaderDiv.style.display = "none";
        const overlay = document.createElement("div");
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100vw";
        overlay.style.height = "100vh";
        overlay.style.background = "rgba(0,0,0,0.8)";
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        overlay.style.zIndex = "1000001";

        const wrap = document.createElement("div");
        wrap.style.background = "#1a140d";
        wrap.style.border = "2px solid #c49a3a";
        wrap.style.borderRadius = "12px";
        wrap.style.padding = "18px 22px";
        wrap.style.boxShadow = "0 6px 20px rgba(0,0,0,0.7)";
        wrap.style.width = "560px";
        wrap.style.maxHeight = "80vh";
        wrap.style.overflow = "auto";

        const title = document.createElement("div");
        title.textContent = "Select your character";
        title.style.color = "#f6d48b";
        title.style.fontWeight = "800";
        title.style.fontSize = "1.2rem";
        title.style.marginBottom = "10px";
        wrap.appendChild(title);

        const list = document.createElement("div");
        list.style.display = "grid";
        list.style.gridTemplateColumns = "1fr 1fr";
        list.style.gap = "8px";
        const renderList = () => {
            list.innerHTML = "";
            this.characters.forEach((c) => {
                const card = document.createElement("div");
                card.style.background = "rgba(24,18,12,0.9)";
                card.style.border = "1px solid #c49a3a";
                card.style.borderRadius = "10px";
                card.style.padding = "10px";
                card.style.cursor = "pointer";
                card.innerHTML = `<div style="color:#f6d48b;font-weight:800;">${c.name}</div><div style="color:#d8c7a1;">${c.classId} - Lv ${c.level}</div>`;
                card.onclick = () => {
                    this.currentCharacter = c;
                    overlay.remove();
                    this.characterOverlay = null;
                    this.initWorld();
                };
                list.appendChild(card);
            });
        };
        renderList();
        wrap.appendChild(list);

        const createTitle = document.createElement("div");
        createTitle.textContent = "Create new character";
        createTitle.style.color = "#f6d48b";
        createTitle.style.fontWeight = "800";
        createTitle.style.marginTop = "12px";
        wrap.appendChild(createTitle);

        const nameInput = document.createElement("input");
        nameInput.placeholder = "Name";
        nameInput.style.width = "100%";
        nameInput.style.marginTop = "6px";
        nameInput.style.marginBottom = "6px";
        nameInput.style.padding = "8px";
        nameInput.style.borderRadius = "8px";
        nameInput.style.border = "1px solid #c49a3a";
        nameInput.style.background = "#0f0a07";
        nameInput.style.color = "#f6d48b";
        wrap.appendChild(nameInput);

        const classSelect = document.createElement("select");
        classSelect.style.width = "100%";
        classSelect.style.padding = "8px";
        classSelect.style.borderRadius = "8px";
        classSelect.style.border = "1px solid #c49a3a";
        classSelect.style.background = "#0f0a07";
        classSelect.style.color = "#f6d48b";
        ["warrior", "mage", "rogue"].forEach((id) => {
            const opt = document.createElement("option");
            opt.value = id;
            opt.textContent = id[0].toUpperCase() + id.slice(1);
            classSelect.appendChild(opt);
        });
        wrap.appendChild(classSelect);

        const createBtn = document.createElement("button");
        createBtn.textContent = "Create";
        createBtn.style.marginTop = "10px";
        createBtn.style.width = "100%";
        createBtn.style.padding = "10px";
        createBtn.style.borderRadius = "10px";
        createBtn.style.border = "1px solid #c49a3a";
        createBtn.style.background = "#2b1a0f";
        createBtn.style.color = "#f6d48b";
        createBtn.style.fontWeight = "800";
        createBtn.style.cursor = "pointer";
        createBtn.onclick = () => {
            const name = nameInput.value || "Hero";
            const classId = classSelect.value || "warrior";
            const starter = this.getStarterLoadout(classId);
            const newChar = { id: `char-${Date.now()}`, name, classId, level: 1, gold: starter.gold, inventory: starter.inventory, equipment: starter.equipment };
            this.characters.push(newChar);
            renderList();
        };
        wrap.appendChild(createBtn);

        overlay.appendChild(wrap);
        document.body.appendChild(overlay);
        this.characterOverlay = overlay;
    }

    getStarterLoadout(classId: string) {
        if (classId === "mage") {
            return { gold: 10, inventory: ["apprentice_staff", "cloth_gloves"], equipment: { weapon: "apprentice_staff", hands: "cloth_gloves" } };
        }
        if (classId === "rogue") {
            return { gold: 10, inventory: ["rogue_daggers"], equipment: { weapon: "rogue_daggers" } };
        }
        return { gold: 10, inventory: ["rusty_sword", "training_shield"], equipment: { weapon: "rusty_sword", offhand: "training_shield" } };
    }

    castSpell(slot: number) {
        if (this.casting) {
            this.fx.showSpellMsg("Already casting");
            return;
        }
        const spellId = this.spellSlots[slot] ?? null;
        if (!spellId) return;
        const config = SPELL_REGISTRY[spellId];
        if (!config) return;
        const now = performance.now();

        const spellbar = document.getElementById("spellbar");
        let slots: HTMLCollectionOf<Element> | null = null;
        if (spellbar) slots = spellbar.getElementsByClassName("spell-slot");

        function showCooldownOverlay(slotElem: Element, durationMs: number) {
            let svg = slotElem.querySelector("svg.cooldown-svg") as SVGSVGElement;
            if (!svg) {
                svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                svg.classList.add("cooldown-svg");
                svg.setAttribute("width", "56");
                svg.setAttribute("height", "56");
                svg.style.position = "absolute";
                svg.style.left = "0";
                svg.style.top = "0";
                svg.style.width = "100%";
                svg.style.height = "100%";
                svg.style.pointerEvents = "none";
                svg.style.zIndex = "3";
                slotElem.appendChild(svg);
                slotElem.setAttribute("style", (slotElem.getAttribute("style") || "") + ";position:relative;");
            }
            svg.innerHTML = "";
            let bg = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            bg.setAttribute("cx", "28");
            bg.setAttribute("cy", "28");
            bg.setAttribute("r", "26");
            bg.setAttribute("fill", "rgba(0,0,0,0.55)");
            svg.appendChild(bg);

            let arc = document.createElementNS("http://www.w3.org/2000/svg", "path");
            arc.setAttribute("fill", "#0c0c0c");
            arc.setAttribute("opacity", "0.9");
            svg.appendChild(arc);

            let start = performance.now();
            function animate() {
                let t = (performance.now() - start) / durationMs;
                if (t > 1) t = 1;
                const angle = 2 * Math.PI * (1 - t);
                const x = 28 + 26 * Math.sin(angle);
                const y = 28 - 26 * Math.cos(angle);
                const largeArc = angle < Math.PI ? 0 : 1;
                const d = `
          M 28 2
          A 26 26 0 ${largeArc} 1 ${x} ${y}
          L 28 28 Z
        `;
                arc.setAttribute("d", d);
                arc.setAttribute("opacity", `${0.9 * (1 - t)}`);
                if (t < 1) requestAnimationFrame(animate);
                else svg.remove();
            }
            animate();
        }

        const showSpellMsg = (msg: string) => this.fx.showSpellMsg(msg);

        if (config.cost > this.player.mana) {
            showSpellMsg("Not enough mana");
            return;
        }

        let target = this.selectedEnemy;
        if (!target || !target.isAlive()) {
            showSpellMsg("No enemy selected");
            return;
        }
        const dist = this.player.mesh.position.distanceTo(target.mesh.position);
        if (dist > config.range) {
            showSpellMsg("Too far away");
            return;
        }
        if (now - this.lastGlobalCast < this.globalCooldown) {
            showSpellMsg("On global cooldown");
            return;
        }
        if (now - this.spellLastCast[slot] < config.cooldown) {
            showSpellMsg("Spell not ready");
            return;
        }

        const inCombatBefore = (now - this.lastCombatTime < 5000);
        // Cast handling
        const beginCast = () => {
            if (slots && slots[slot]) showCooldownOverlay(slots[slot], config.cooldown);
            this.spellLastCast[slot] = now;
            this.lastGlobalCast = now;
            this.player.mana -= config.cost;
            this.lastCombatTime = performance.now();
            this.player.onSpellCast(config, { inCombat: inCombatBefore });
        };

        if (config.castTime && config.castTime > 0) {
            beginCast();
            this.fx.startCastBar(config.name, config.castTime);
            this.casting = { spell: config, slot, target, start: now, end: now + config.castTime };
            return;
        }

        beginCast();
        this.resolveSpellDamage(config, target, now);
    }

    resolveSpellDamage(config: any, target: Enemy | null, startTime: number) {
        if (!target || !target.isAlive()) return;
        const dmg = config.execute({ player: this.player, game: this, target });
        if (dmg > 0) {
            this.showFloatingDamage(target, dmg, startTime);
            this.player.onDealDamage(dmg, target, config);
        }
        if (config.kind === "ranged") {
            const origin = this.player.mesh.position.clone();
            origin.y += 1.4;
            const bolt = this.fx.spawnProjectile(config.projectileColor, origin, target, this.scene);
            this.projectiles.push({ mesh: bolt, target, damage: 0, isCrit: false, speed: 0.3 });
        }
        this.player.onSpellImpact(config, { target, damage: dmg });
    }

    showFloatingDamage(target: Enemy, dmg: number, startTime: number) {
        this.fx.showFloatingDamage(target, dmg, startTime, this.camera);
    }

    tryOpenGossip() {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(this.mousePos, this.camera);
        for (const npc of this.enemies) {
            if (npc.isEnemy || !npc.isAlive()) continue;
            if (!npc.templateId) continue;
            const template = creatureTemplates[npc.templateId];
            if (!template?.gossipMenuId) continue;
            const intersects = raycaster.intersectObject(npc.mesh, true);
            if (intersects.length > 0) {
                this.openGossip(npc, template.gossipMenuId);
                return;
            }
        }
    }

    placeFriendlyAwayFromObstacles(npc: Enemy) {
        const basePos = npc.mesh.position.clone();
        const offsets: THREE.Vector3[] = [];
        const radii = [0, 1, 2, 3];
        const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2, Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
        radii.forEach(r => {
            angles.forEach(a => {
                offsets.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
            });
        });
        const npcBox = new THREE.Box3();
        for (const off of offsets) {
            const candidate = basePos.clone().add(off);
            npc.mesh.position.copy(candidate);
            npcBox.setFromObject(npc.mesh);
            let collides = false;
            for (const obs of this.sceneObstacles) {
                const obsBox = new THREE.Box3().setFromObject(obs);
                if (npcBox.intersectsBox(obsBox)) {
                    collides = true;
                    break;
                }
            }
            if (!collides) {
                return;
            }
        }
        // fallback: keep original position
        npc.mesh.position.copy(basePos);
    }

    openGossip(npc: Enemy, menuId: string) {
        const menu = gossipMenus[menuId];
        if (!menu) return;
        const text = npcTexts[menu.npcTextId]?.text || "";
        this.gossipTarget = npc;
        this.ui.showGossip(menu.title, text, menu.options, (id) => {
            if (id === "bye") this.ui.hideGossip();
        });
    }

    async initWorld() {
        if (this.worldInitialized) return;
        this.worldInitialized = true;
        if (this.loaderDiv) this.loaderDiv.style.display = "flex";
        // Luce e atmosfera tipo WoW
        this.ambientLight = new THREE.AmbientLight(0xc7b9a2, 0.55);
        this.scene.add(this.ambientLight);
        this.sunLight = new THREE.DirectionalLight(0xfff0d0, 1.05);
        this.sunLight.position.set(18, 24, 12);
        this.scene.add(this.sunLight);

        // Terreno procedurale (nessun asset remoto)
        const canvas = document.createElement("canvas");
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext("2d");
        if (ctx) {
            const grd = ctx.createLinearGradient(0, 0, 64, 64);
            grd.addColorStop(0, "#3f4b2c");
            grd.addColorStop(1, "#2f381f");
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, 64, 64);
            for (let i = 0; i < 220; i++) {
                ctx.fillStyle = `rgba(255,255,255,${0.05 + Math.random() * 0.08})`;
                ctx.fillRect(Math.random() * 64, Math.random() * 64, 1 + Math.random() * 2, 1 + Math.random() * 2);
            }
        }
        const grassTexture = new THREE.CanvasTexture(canvas);
        grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
        grassTexture.repeat.set(120, 120);
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(1000, 1000),
            new THREE.MeshStandardMaterial({ map: grassTexture, roughness: 1, metalness: 0 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Alberi semplici (leggermente ridotti per FPS)
        for (let i = 0; i < 140; i++) {
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.3, 0.5, 3),
                new THREE.MeshStandardMaterial({ color: 0x8b5a2b })
            );
            trunk.position.set(
                Math.random() * 980 - 490,
                1.5,
                Math.random() * 980 - 490
            );
            this.scene.add(trunk);
            this.sceneObstacles.push(trunk);

            const leaves = new THREE.Mesh(
                new THREE.SphereGeometry(1.2, 12, 12),
                new THREE.MeshStandardMaterial({ color: 0x228b22 })
            );
            leaves.position.set(trunk.position.x, trunk.position.y + 2, trunk.position.z);
            this.scene.add(leaves);
            if (i % 20 === 0) await new Promise(r => setTimeout(r, 0));
        }

        // Rocce semplici (ridotte per FPS)
        for (let i = 0; i < 80; i++) {
            const rock = new THREE.Mesh(
                new THREE.IcosahedronGeometry(1, 0),
                new THREE.MeshStandardMaterial({ color: 0x888888 })
            );
            rock.position.set(
                Math.random() * 980 - 490,
                1,
                Math.random() * 980 - 490
            );
            rock.scale.setScalar(0.6 + Math.random() * 1.2);
            this.scene.add(rock);
            this.sceneObstacles.push(rock);
            if (i % 20 === 0) await new Promise(r => setTimeout(r, 0));
        }

        // Inserisci qualche asset infernale come decorazione
        try {
            const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader");
            const decoLoader = new GLTFLoader();
            decoLoader.load("/inferno_world_free/Separate_assets_glb/TowerBig_001.glb", (gltf) => {
                gltf.scene.scale.set(0.5, 0.5, 0.5);
                gltf.scene.position.set(120, 0, 80);
                gltf.scene.traverse((obj: any) => {
                    if (obj.isMesh) {
                        obj.castShadow = true;
                        obj.receiveShadow = true;
                    }
                });
                this.scene.add(gltf.scene);
                this.sceneObstacles.push(gltf.scene as any);
            });
        } catch (err) {
            console.warn("Inferno deco load failed", err);
        }

        // Posiziona il player lontano dal nemico e rivolto verso di lui
        const savedState = this.loadSavedState();
        if (savedState) {
            if (savedState.inventory) this.inventory = savedState.inventory;
            if (typeof savedState.gold === "number") this.gold = savedState.gold;
            if (savedState.learnedTalents) this.learnedTalents = new Set(savedState.learnedTalents);
            if (savedState.equipment && this.currentCharacter) this.currentCharacter.equipment = savedState.equipment;
        }

        const classId = this.currentCharacter?.classId ?? "warrior";
        if (classId === "warrior") {
            this.player = new WarriorPlayer();
        } else if (classId === "rogue") {
            this.player = new RoguePlayer();
        } else if (classId === "mage") {
            this.player = new MagePlayer();
        } else {
            this.player = new Player(classId);
        }
        this.player.mesh.position.copy(this.lastSpawnPosition); // default spawn

        if (savedState) {
            if (savedState.position) {
                this.player.mesh.position.set(savedState.position.x, savedState.position.y, savedState.position.z);
                this.lastSpawnPosition.copy(this.player.mesh.position);
            }
            if (typeof savedState.rotationY === "number") this.player.mesh.rotation.y = savedState.rotationY;
            if (typeof savedState.hp === "number") this.player.hp = savedState.hp;
            if (typeof savedState.mana === "number") this.player.mana = savedState.mana;
            if (typeof savedState.level === "number") this.player.level = savedState.level;
            if (typeof savedState.xp === "number") this.player.xp = savedState.xp;
            if (typeof savedState.xpToNext === "number") this.player.xpToNext = savedState.xpToNext;
        }

        // Calcola direzione verso il nemico (5, 1, 5)
        const toEnemy = new THREE.Vector3(5, 1, 5).sub(this.player.mesh.position);
        const angle = Math.atan2(toEnemy.x, toEnemy.z);
        this.player.mesh.rotation.y = angle;

        this.cameraControl = new ThirdPersonCamera(this.camera, this.player);
        this.scene.add(this.player.mesh);

        // Popola spellbook UI con le spell della classe
        const classSpells = getSpellsForClass(this.player.classId);
        this.ui = new UI();
        this.ui.populateSpellbook(classSpells.map(s => ({ id: s.id, name: s.name, icon: s.icon, description: s.description })));
        this.ui.populateBags(this.inventory.map(id => getItemById(id)), this.gold);
        this.ui.populateTalents(getTalentsForClass(this.player.classId), this.learnedTalents);
        const equipObj: Record<string, any> = {};
        const equipIds = this.currentCharacter?.equipment || {};
        Object.keys(equipIds || {}).forEach(slot => {
            const id = (equipIds as any)[slot];
            equipObj[slot] = id ? getItemById(id) : null;
        });
        this.ui.populateEquipment(equipObj);
        this.clock = new THREE.Clock();
        if (savedState && savedState.spellSlots) {
            this.spellSlots = savedState.spellSlots;
            this.spellSlots.forEach((sid, idx) => {
                if (sid) window.dispatchEvent(new CustomEvent("spellSlotAssigned", { detail: { slotIndex: idx, spellId: sid } }));
            });
        }

        // Logout button
        if (!this.logoutBtn) {
            const btn = document.createElement("button");
            btn.id = "logout-btn";
            btn.textContent = "Exit Character";
            btn.style.position = "fixed";
            btn.style.left = "20px";
            btn.style.bottom = "20px";
            btn.style.padding = "10px 14px";
            btn.style.borderRadius = "10px";
            btn.style.border = "1px solid #c49a3a";
            btn.style.background = "linear-gradient(135deg, #2a1e14, #1a120c)";
            btn.style.color = "#f6d48b";
            btn.style.fontWeight = "800";
            btn.style.zIndex = "10004";
            btn.onclick = () => this.returnToCharacterSelect();
            document.body.appendChild(btn);
            this.logoutBtn = btn;
        } else {
            this.logoutBtn.style.display = "block";
        }

        // Riempie gli slot iniziali
        classSpells.slice(0, 2).forEach((spell, idx) => {
            this.spellSlots[idx] = spell.id;
            window.dispatchEvent(new CustomEvent("spellSlotAssigned", { detail: { slotIndex: idx, spellId: spell.id } }));
        });

        // Carica prefab zombie
        // Usa GLTFLoader importato
        const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader");
        const gltfLoader = new GLTFLoader();
        const zombiePrefab = await new Promise<any>((resolve) => {
            gltfLoader.load(
                "/characters/zombie/scene.gltf",
                (gltf) => {
                    // DEBUG: log struttura prefab
                    // @ts-ignore
                    window.zombiePrefabDebug = gltf;
                    // gltf.scene.scale.set(0.01, 0.01, 0.01); // Spostato nella classe Enemy per evitare zombie gigante
                    gltf.scene.position.y = -1;
                    resolve(gltf);
                }
            );
        });

        const loadByExtension = (path: string) => {
            const ext = path.split(".").pop()?.toLowerCase();
            const url = encodeURI(path);
            if (ext === "glb" || ext === "gltf") {
                return new Promise<any>((resolve) => {
                    gltfLoader.load(
                        url,
                        (gltf) => resolve(gltf),
                        undefined,
                        (err) => {
                            console.error("Failed loading GLTF", url, err);
                            resolve(null);
                        }
                    );
                });
            }
            console.warn("No loader registered for model extension", ext, path);
            return Promise.resolve(null);
        };

        // Carica prefab NPC/enemy da tabella
        const prefabs: Record<string, any> = {};
        const uniqueModels = Array.from(new Set(Object.values(creatureTemplates).map(t => t.model)));
        for (const model of uniqueModels) {
            prefabs[model] = await loadByExtension(model);
        }
        this.creaturePrefabs = prefabs;

        // Carica la mappa statica Nature.glb al posto del layout procedurale
        await this.loadWorldMap(loadByExtension);

        // Carica prefab gameobject models
        const gameObjPrefabs: Record<string, any> = {};
        const uniqueGoModels = Array.from(new Set(Object.values(gameObjectTemplates).map(t => t.model).filter(Boolean))) as string[];
        for (const model of uniqueGoModels) {
            gameObjPrefabs[model] = await loadByExtension(model);
        }
        this.gameObjectPrefabs = gameObjPrefabs;

        // Costruisci world objects e creature
        this.spawnGameObjects(gameObjPrefabs);
        this.spawnCreaturesFromTable(prefabs);
        this.loadVolatileSpawns();

        window.addEventListener("keydown", (e) => {
            const target = e.target as HTMLElement | null;
            if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
            this.keys.add(e.key.toLowerCase());
            if (e.key === " ") {
                this.player.jump();
            }
            if (e.key.toLowerCase() === "v") {
                this.healthBarsVisible = !this.healthBarsVisible;

                // Mostra/nasconde le nuove healthbar dei nemici
                this.enemies.forEach(enemy => {
                    if (enemy.healthBarDiv) {
                        enemy.healthBarDiv.style.display = this.healthBarsVisible && enemy.isAlive() ? "block" : "none";
                    }
                });

                // Mostra messaggio stato healthbar per 3 secondi
                this.healthBarStatusDiv.textContent = this.healthBarsVisible ? "healthbar attivate" : "healthbar disattivate";
                this.healthBarStatusDiv.style.display = "block";
                this.healthBarStatusDiv.style.background = "#ff0060";
                this.healthBarStatusDiv.style.color = "#fff";
                this.healthBarStatusDiv.style.fontWeight = "bold";
                this.healthBarStatusDiv.style.fontSize = "2rem";
                this.healthBarStatusDiv.style.border = "4px solid #fff";
                this.healthBarStatusDiv.style.boxShadow = "0 0 24px #000";
                this.healthBarStatusDiv.style.zIndex = "99999";
                setTimeout(() => {
                    this.healthBarStatusDiv.style.display = "none";
                }, 3000);
            }
        });
        window.addEventListener("keyup", (e) => this.keys.delete(e.key.toLowerCase()));

        window.addEventListener("mousedown", (e) => {
            if (e.button === 2) this.rightMouseDown = true;
            if (e.button === 0) this.mouseLeftDown = true;
            if (e.button === 0) this.tryOpenGossip();
        });
        // Right click loot on dead enemies
        window.addEventListener("mousedown", (event) => {
            if (event.button !== 2) return;
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(this.mousePos, this.camera);
            let found: Enemy | null = null;
            for (const enemy of this.enemies) {
                if (!enemy.isEnemy) continue;
                const intersects = raycaster.intersectObject(enemy.mesh, true);
                if (intersects.length > 0) {
                    found = enemy;
                    break;
                }
            }
            if (found && !found.isAlive()) {
                // despawn if empty loot
                if (!found.loot || found.loot.length === 0) {
                    this.scene.remove(found.mesh);
                    return;
                }
                this.lootTarget = found;
                const handleTake = (itemId: string) => {
                    if (!this.lootTarget) return;
                    const idx = this.lootTarget.loot.indexOf(itemId);
                    if (idx >= 0) this.lootTarget.loot.splice(idx, 1);
                    if (itemId.startsWith("gold_")) {
                        const amt = parseInt(itemId.replace("gold_", ""), 10) || 0;
                        this.gold += amt;
                    } else {
                        this.inventory.push(itemId);
                    }
                    this.ui.populateBags(this.inventory.map(id => getItemById(id)), this.gold);
                    if (this.lootTarget.loot.length === 0) {
                        this.ui.hideLootWindow();
                        this.lootTarget = null;
                        this.scene.remove(found.mesh);
                    } else {
                        this.ui.showLootWindow(this.lootTarget.loot, handleTake);
                    }
                };
                this.ui.showLootWindow(found.loot, handleTake);
            }
        });
        window.addEventListener("mouseup", (e) => {
            if (e.button === 2) this.rightMouseDown = false;
            if (e.button === 0) this.mouseLeftDown = false;
        });

        window.addEventListener("playerAttack", () => this.handleAttack());

        // Disabilita context menu browser su tasto destro
        window.addEventListener("contextmenu", e => e.preventDefault());

        this.loaderDiv.style.display = "none";
        this.animate();

        // Gestione cursore custom: aggiorna anche se la camera si muove
        window.addEventListener("mousemove", (event) => {
            const rect = this.renderer.domElement.getBoundingClientRect();
            this.mousePos.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            this.mousePos.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        });

        // Imposta cursore di default all'avvio
        document.body.style.cursor = "url('/cursors/Pointer_gauntlet_on_32x32.cur'), auto";
    }

    handleAttack() {
        this.lastCombatTime = performance.now();
        const ray = this.player.getAttackRay();
        const enemyMeshes = this.enemies.filter(e => e.isEnemy && e.isAlive()).map(e => e.mesh);
        const intersects = ray.intersectObjects(enemyMeshes);
        if (intersects.length > 0) {
            const hitEnemy = this.enemies.find(e => e.mesh === intersects[0].object);
            if (hitEnemy) {
                hitEnemy.takeDamage(this.player.attackDamage);
                this.player.onDealDamage(this.player.attackDamage, hitEnemy, null as any);
            }
        }
    }

    reset() {
        this.scene.remove(this.player.mesh);
        this.enemies.forEach(e => this.scene.remove(e.mesh));

        this.player = new Player();
        this.scene.add(this.player.mesh);

        this.enemies = [];
        for (let i = 0; i < 5; i++) {
            const enemy = new Enemy(5 * i, 5 * i);
            this.enemies.push(enemy);
            this.scene.add(enemy.mesh);
        }

        this.ui.updatePlayerHealth(this.player.hp, this.player.mana ?? 100, this.player.maxHp ?? 100, this.player.maxMana ?? 100, this.player.xp, this.player.xpToNext, this.player.level);
    }

    animate = () => {
        requestAnimationFrame(this.animate);

        if (!this.worldInitialized || !this.clock || !this.player) {
            return;
        }

        const delta = this.clock.getDelta();

        if (this.paused) {
            this.renderer.render(this.scene, this.camera);
            return;
        }

        if (!this.player.isAlive()) {
            this.enterGhostState();
        }

        // FPS
        if (this.fpsDiv) {
            this.frames++;
            const now = performance.now();
            if (now - this.lastFpsUpdate > 500) {
                this.fps = Math.round((this.frames * 1000) / (now - this.lastFpsUpdate));
                this.fpsDiv.innerText = `FPS: ${this.fps}`;
                this.lastFpsUpdate = now;
                this.frames = 0;
            }
        }

        // Aggiorna posizione e animazione dei testi danno
        const now = performance.now();
        if (!this.isGhost && this.dayNightEnabled) {
            this.updateDayNight(now);
        }

        // Logga ANIMATE FRAME e now ogni ciclo
        // console.log("ANIMATE FRAME", now);

        // Avanza i proiettili magici
        this.projectiles = this.projectiles.filter(p => {
            if (!p.target || !p.target.isAlive()) {
                this.scene.remove(p.mesh);
                return false;
            }
            const targetPos = p.target.mesh.position.clone();
            targetPos.y += 1.2;
            const dir = targetPos.clone().sub(p.mesh.position);
            const dist = dir.length();
            dir.normalize();
            p.mesh.position.addScaledVector(dir, p.speed);
            if (dist < 0.25) {
                if (p.damage > 0) {
                    p.target.takeDamage(p.damage);
                }
                this.scene.remove(p.mesh);
                return false;
            }
            return true;
        });

        this.damageTexts = this.damageTexts.filter(({ div, start, angle }) => {
            const t = (now - start) / 1000;
            if (t > 1) {
                div.remove();
                return false;
            }
            // Movimento circolare attorno al player (più lento)
            const radius = 60;
            const theta = angle + t * Math.PI;
            // Proietta posizione player su schermo
            const pos = this.player.mesh.position.clone();
            pos.y += 2.2;
            const vector = pos.project(this.camera);
            const x = (vector.x * 0.5 + 0.5) * window.innerWidth + Math.cos(theta) * radius;
            const y = (-vector.y * 0.5 + 0.5) * window.innerHeight + Math.sin(theta) * radius;
            div.style.left = `${x}px`;
            div.style.top = `${y}px`;
            div.style.opacity = `${1 - t}`;
            return true;
        });

        // --- Spostato fuori dal filter ---
        // Rigenerazione hp/mana (al secondo, non per tick)
        const maxHp = this.player.maxHp ?? 100;
        const maxMana = this.player.maxMana ?? 100;
        const isOutOfCombat = (now - this.lastCombatTime > 5000);
        if (isOutOfCombat && this.player.isInCombat) {
            this.player.onLeaveCombat();
        } else if (!isOutOfCombat && !this.player.isInCombat) {
            this.player.onEnterCombat();
        }

        // Logga isOutOfCombat ogni 2 secondi
        if (!this.lastLogTime) this.lastLogTime = now;
        if (now - this.lastLogTime > 2000) {
            this.lastLogTime = now;
        }

        // HP: solo fuori combattimento, recupero ogni 3 secondi
        if (isOutOfCombat && this.player.hp < maxHp) {
            if (!this.lastHpRegenTime) this.lastHpRegenTime = now;
            if (now - this.lastHpRegenTime > 3000) {
                const hpRegen = Math.ceil(maxHp * 0.03);
                this.player.hp = Math.min(this.player.hp + hpRegen, maxHp);
                this.lastHpRegenTime = now;
            }
        } else {
            this.lastHpRegenTime = now;
        }
        // Mana: 10% fuori combattimento, 2% in combattimento (al secondo)
        const manaRegenRate = isOutOfCombat ? 0.10 : 0.02;
        if (this.player.mana < maxMana) {
            const manaRegen = Math.ceil(maxMana * manaRegenRate * delta);
            this.player.mana = Math.min(this.player.mana + manaRegen, maxMana);
        }

        // Aggiorna barra vita nemico selezionato
        if (this.enemyBarDiv) {
            if (this.selectedEnemy && this.selectedEnemy.isAlive()) {
                this.enemyBarDiv.style.display = "block";
                const nameDiv = this.enemyBarDiv.querySelector("#enemy-bar-name") as HTMLDivElement;
                const hpDiv = this.enemyBarDiv.querySelector("#enemy-bar-hp") as HTMLDivElement;
                const hpText = this.enemyBarDiv.querySelector("#enemy-bar-hp-text") as HTMLDivElement;
                const castDiv = this.enemyBarDiv.querySelector("#enemy-bar-cast") as HTMLDivElement;
                const aggro = this.enemyBarDiv.querySelector("#enemy-aggro") as HTMLDivElement;
                if (nameDiv) nameDiv.innerText = this.selectedEnemy.mesh.name || "Creature";
                if (aggro) aggro.innerText = this.selectedEnemy.isEnemy ? "TARGET" : "FRIENDLY";
                if (hpDiv && hpText) {
                    const hp = Math.max(0, this.selectedEnemy.hp);
                    const maxHp = this.selectedEnemy.maxHp || 100;
                    hpDiv.style.width = `${(hp / maxHp) * 100}%`;
                    hpText.innerText = `${hp} / ${maxHp}`;
                }
                if (castDiv) {
                    const castProg = this.selectedEnemy.getCastProgress(Date.now());
                    if (castProg) {
                        castDiv.style.width = `${castProg.pct * 100}%`;
                        castDiv.style.display = "block";
                    } else {
                        castDiv.style.width = "0%";
                        castDiv.style.display = "none";
                    }
                }
            } else {
                this.enemyBarDiv.style.display = "none";
            }
        }

        // Aggiorna cursore anche se la camera si muove
        {
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(this.mousePos, this.camera);

            let foundEnemy: Enemy | null = null;
            for (const enemy of this.enemies) {
                if (!enemy.isAlive()) continue;
                const intersects = raycaster.intersectObject(enemy.mesh, true);
                if (intersects.length > 0) {
                    foundEnemy = enemy;
                    break;
                }
            }
            if (foundEnemy && foundEnemy.isEnemy) {
                document.body.style.cursor = "url('/cursors/Pointer_sword_on_32x32.cur'), auto";
            } else if (foundEnemy && !foundEnemy.isEnemy && foundEnemy.templateId && creatureTemplates[foundEnemy.templateId]?.gossipMenuId) {
                document.body.style.cursor = "url('/cursors/Pointer_talk_on_32x32.cur'), auto";
            } else {
                document.body.style.cursor = "url('/cursors/Pointer_gauntlet_on_32x32.cur'), auto";
            }

            // Cerchio di selezione
            if (this.selectedEnemy && this.selectedEnemy.isAlive() && this.selectedEnemy.isEnemy) {
                if (!this.selectionCircle) {
                    const geometry = new THREE.RingGeometry(1.5, 2, 48);
                    const material = new THREE.MeshBasicMaterial({ color: 0xffd38a, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
                    this.selectionCircle = new THREE.Mesh(geometry, material);
                    this.selectionCircle.rotation.x = -Math.PI / 2;
                    this.selectionCircle.renderOrder = 999;
                    this.selectionCircle.material.depthTest = false;
                    this.scene.add(this.selectionCircle);
                }
                // Aggiorna posizione sotto il nemico selezionato
                // Calcola bounding box reale su tutti i discendenti mesh
                const box = new THREE.Box3().setFromObject(this.selectedEnemy.mesh, true);
                const center = new THREE.Vector3();
                box.getCenter(center);
                this.selectionCircle.position.set(
                    center.x,
                    box.min.y + 0.01,
                    center.z
                );
                this.selectionCircle.rotation.set(-Math.PI / 2, 0, 0);
                this.selectionCircle.visible = true;
                // Debug: colore/materiale ben visibile
                if (this.selectionCircle.material instanceof THREE.MeshBasicMaterial) {
                    this.selectionCircle.material.color.set(0xffd38a);
                    this.selectionCircle.material.opacity = 0.55;
                }
            } else if (this.selectionCircle) {
                this.selectionCircle.visible = false;
            }
        }

        // Movimento WoW: w/s avanti/indietro, a/d ruotano la camera
        let cameraDir = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDir);
        cameraDir.y = 0;
        cameraDir.normalize();

        // Ruota la camera con A/D
        const rotateSpeed = 0.03;
        if (this.keys.has("a")) {
            this.cameraControl.rotation.y += rotateSpeed;
        }
        if (this.keys.has("d")) {
            this.cameraControl.rotation.y -= rotateSpeed;
        }

        // Movimento avanti/indietro
        // Collisione player con ostacoli
        const tryMovePlayer = (dir: THREE.Vector3) => {
            const nextPos = this.player.mesh.position.clone().add(dir);

            // Limiti terreno
            if (
                nextPos.x < -499.5 || nextPos.x > 499.5 ||
                nextPos.z < -499.5 || nextPos.z > 499.5
            ) {
                return;
            }

            // Bounding box player reale
            const playerBox = this.player.getBoundingBox(nextPos);

            // Collisione con ostacoli
            let collision = false;
            for (const obs of this.sceneObstacles) {
                const obsBox = new THREE.Box3().setFromObject(obs);
                if (playerBox.intersectsBox(obsBox)) {
                    collision = true;
                    break;
                }
            }
            if (!collision) {
                this.player.mesh.position.copy(nextPos);
            }
        };

        // Movimento diagonale (w+q, w+e, s+q, s+e)
        let moveDir = new THREE.Vector3();
        let moving = false;

        if (this.keys.has("w")) {
            moveDir.add(cameraDir);
            moving = true;
        }
        if (this.keys.has("s")) {
            moveDir.add(cameraDir.clone().negate());
            moving = true;
        }
        // Calcola vettore laterale rispetto alla camera (sinistra)
        const leftDir = new THREE.Vector3(cameraDir.z, 0, -cameraDir.x).normalize();
        if (this.keys.has("q")) {
            moveDir.add(leftDir);
            moving = true;
        }
        if (this.keys.has("e")) {
            moveDir.add(leftDir.clone().negate());
            moving = true;
        }

        // Mouse sinistro+destro: cammina dritto seguendo la camera
        if (this.mouseLeftDown && this.rightMouseDown) {
            let cameraDirCopy = cameraDir.clone().normalize().multiplyScalar(this.player.speed);
            tryMovePlayer(cameraDirCopy);
            this.player.mesh.rotation.y = Math.atan2(cameraDirCopy.x, cameraDirCopy.z);
            this.player.setMovementState(true, false);
        } else if (moving && moveDir.lengthSq() > 0) {
            const backwards = this.keys.has("s") && !this.keys.has("w");
            const speedMult = backwards ? 0.5 : 1;
            moveDir.normalize().multiplyScalar(this.player.speed * speedMult);
            tryMovePlayer(moveDir);
            // Ruota il player verso la direzione di movimento solo quando si avanza
            if (!backwards) {
                this.player.mesh.rotation.y = Math.atan2(moveDir.x, moveDir.z);
            }
            this.player.setMovementState(true, backwards);
        } else {
            this.player.move(this.keys);
        }
        // Movement hooks
        const isCurrentlyMoving = moving || (this.mouseLeftDown && this.rightMouseDown);
        if (isCurrentlyMoving && !this.playerWasMoving) {
            const dir = moveDir.lengthSq() > 0 ? moveDir.clone().normalize() : new THREE.Vector3(0, 0, 0);
            this.player.onMoveStart(dir);
        }
        if (!isCurrentlyMoving && this.playerWasMoving) {
            this.player.onMoveStop();
        }
        this.playerWasMoving = isCurrentlyMoving;
        if (this.player.canFly) {
            const flySpeed = this.player.speed;
            if (this.keys.has(" ")) {
                this.player.mesh.position.y += flySpeed;
            }
            if (this.keys.has("x")) {
                this.player.mesh.position.y = Math.max(1, this.player.mesh.position.y - flySpeed);
            }
        }
        this.player.update(delta);

        this.enemies.forEach(e => {
            e.update(this.player, this.camera, this.isGhost);
            // Nasconde la healthbar se disattivata
            if (e.healthBarDiv) {
                e.healthBarDiv.style.display = this.healthBarsVisible && e.isAlive() ? "block" : "none";
            }
            // Cursor changes if corpse has loot
            if (!e.isAlive() && e.loot && e.loot.length > 0) {
                const raycaster = new THREE.Raycaster();
                raycaster.setFromCamera(this.mousePos, this.camera);
                const intersects = raycaster.intersectObject(e.mesh, true);
                if (intersects.length > 0) {
                    document.body.style.cursor = "url('/cursors/Pointer_bag_on_32x32.cur'), auto";
                }
            }
        });

        // Consegna XP; loot resta sul corpo
        this.enemies.forEach(e => {
            if (!e.isAlive() && !e.rewardGranted) {
                e.rewardGranted = true;
                if (e.isEnemy) {
                    this.player.gainXp(e.xpWorth);
                    e.loot = this.generateLootFor(e);
                    if (this.selectedEnemy === e) this.selectedEnemy = null;
                    const msg = document.createElement("div");
                    msg.innerText = `+${e.xpWorth} XP`;
                    msg.style.position = "fixed";
                    msg.style.left = "50%";
                    msg.style.top = "22%";
                    msg.style.transform = "translateX(-50%)";
                    msg.style.color = "#d9c07a";
                    msg.style.fontSize = "1.5rem";
                    msg.style.fontWeight = "bold";
                    msg.style.textShadow = "0 0 8px #000";
                    msg.style.zIndex = "100000";
                    document.body.appendChild(msg);
                    setTimeout(() => msg.remove(), 600);
                } else {
                    e.loot = [];
                }
            }
        });

        this.ui.updatePlayerHealth(this.player.hp, this.player.mana, this.player.maxHp, this.player.maxMana, this.player.xp, this.player.xpToNext, this.player.level);

        // Rimuovi le healthbar degli enemy morti
        this.enemies.forEach(e => {
            if (!e.isAlive()) e.destroyHealthBar();
        });

        this.cameraControl.update();
        this.camera.lookAt(this.player.mesh.position);

        this.updateGhostUI();
        this.updateCasting(performance.now());
        this.renderer.render(this.scene, this.camera);
    }

    enterGhostState() {
        if (this.isGhost) return;
        this.isGhost = true;
        this.player.hp = 0;
        this.corpsePosition = this.player.mesh.position.clone();
        this.createCorpseMarker();
        // Teleport ghost to last saved spawn immediately
        if (this.lastSpawnPosition) {
            this.player.mesh.position.copy(this.lastSpawnPosition);
        }
        this.applyGhostVisuals(true);
        this.ensureGhostUI();
        this.ui.addChatMessage("System", "You died. Return to your corpse to revive.");
    }

    reviveAtCorpse() {
        if (!this.isGhost || !this.corpsePosition) return;
        this.isGhost = false;
        this.player.hp = this.player.maxHp;
        // Resurrect at corpse if desired; otherwise at spawn. Here we keep corpse position as requested revive point.
        this.player.mesh.position.copy(this.corpsePosition);
        this.player.isOnGround = true;
        if (this.corpseMarker) {
            this.scene.remove(this.corpseMarker);
            this.corpseMarker = null;
        }
        this.corpsePosition = null;
        this.applyGhostVisuals(false);
        if (this.corpseArrow) this.corpseArrow.style.display = "none";
        if (this.revivePopup) this.revivePopup.style.display = "none";
        this.ui.updatePlayerHealth(this.player.hp, this.player.mana, this.player.maxHp, this.player.maxMana, this.player.xp, this.player.xpToNext, this.player.level);
    }

    ensureGhostUI() {
        if (!this.corpseArrow) {
            const arrow = document.createElement("div");
            arrow.id = "corpse-arrow";
            arrow.style.position = "fixed";
            arrow.style.top = "18px";
            arrow.style.left = "50%";
            arrow.style.transform = "translate(-50%,0)";
            arrow.style.width = "0";
            arrow.style.height = "0";
            arrow.style.borderLeft = "12px solid transparent";
            arrow.style.borderRight = "12px solid transparent";
            arrow.style.borderBottom = "18px solid #d1d1d1";
            arrow.style.zIndex = "10006";
            arrow.style.opacity = "0.9";
            arrow.style.display = "none";
            document.body.appendChild(arrow);
            this.corpseArrow = arrow;
        }

        if (!this.revivePopup) {
            const pop = document.createElement("div");
            pop.id = "corpse-popup";
            pop.style.position = "fixed";
            pop.style.bottom = "32px";
            pop.style.left = "50%";
            pop.style.transform = "translate(-50%, 0)";
            pop.style.padding = "12px 18px";
            pop.style.background = "rgba(30,30,30,0.9)";
            pop.style.border = "1px solid #c9c9c9";
            pop.style.borderRadius = "10px";
            pop.style.color = "#f0f0f0";
            pop.style.boxShadow = "0 4px 12px rgba(0,0,0,0.6)";
            pop.style.display = "none";
            pop.style.zIndex = "10006";
            const label = document.createElement("div");
            label.textContent = "Your spirit finds the corpse.";
            label.style.marginBottom = "8px";
            const btn = document.createElement("button");
            btn.textContent = "Revive";
            btn.style.padding = "6px 12px";
            btn.style.background = "#2e7d32";
            btn.style.color = "#fff";
            btn.style.border = "1px solid #9be3a7";
            btn.style.borderRadius = "6px";
            btn.style.cursor = "pointer";
            btn.onclick = () => this.reviveAtCorpse();
            pop.appendChild(label);
            pop.appendChild(btn);
            document.body.appendChild(pop);
            this.revivePopup = pop;
        }
    }

    createCorpseMarker() {
        if (!this.corpsePosition) return;
        if (this.corpseMarker) this.scene.remove(this.corpseMarker);
        const geo = new THREE.SphereGeometry(0.4, 16, 16);
        const mat = new THREE.MeshBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.6 });
        const marker = new THREE.Mesh(geo, mat);
        marker.position.copy(this.corpsePosition);
        this.scene.add(marker);
        this.corpseMarker = marker;
    }

    applyGhostVisuals(on: boolean) {
        const filter = on ? "grayscale(1)" : "";
        if (this.renderer?.domElement) this.renderer.domElement.style.filter = filter;
        document.body.style.filter = filter;
    }

    updateCasting(now: number) {
        if (!this.casting) return;
        const { start, end, spell, target } = this.casting;
        this.fx.updateCastBar(now, start, end, spell.name);
        if (now >= end) {
            this.fx.hideCastBar();
            this.casting = null;
            this.resolveSpellDamage(spell, target, now);
        }
    }


    updateGhostUI() {
        if (!this.isGhost || !this.corpsePosition) {
            if (this.corpseArrow) this.corpseArrow.style.display = "none";
            if (this.revivePopup) this.revivePopup.style.display = "none";
            return;
        }
        if (this.corpseArrow) {
            const toCorpse = this.corpsePosition.clone().sub(this.player.mesh.position);
            const dist = toCorpse.length();
            if (dist < 0.5) {
                this.corpseArrow.style.display = "none";
            } else {
                const camDir = new THREE.Vector3();
                this.camera.getWorldDirection(camDir);
                const angle = Math.atan2(toCorpse.x, toCorpse.z) - Math.atan2(camDir.x, camDir.z);
                this.corpseArrow.style.display = "block";
                this.corpseArrow.style.transform = `translate(-50%,0) rotate(${angle}rad)`;
            }
            if (this.revivePopup) {
                this.revivePopup.style.display = dist < this.reviveRadius ? "block" : "none";
            }
        }
    }

    spawnCreaturesFromTable(prefabs: Record<string, any>) {
        creatureSpawns.forEach(spawn => {
            const template = creatureTemplates[spawn.templateId];
            if (!template) return;
            const prefab = prefabs[template.model];
            if (!prefab) return;
            const scale = template.scale ?? 0.08;
            const enemy = new Enemy(spawn.position.x, spawn.position.z, prefab, spawn.isEnemy, scale, 0, template.id);
            enemy.mesh.name = template.name;
            enemy.mesh.position.y = spawn.position.y + 1;
            if (!template.canFly) enemy.mesh.position.y = Math.max(enemy.mesh.position.y, 0.1);
            enemy.maxHp = template.hp;
            enemy.hp = template.hp;
            enemy.xpWorth = template.exp;
            if (template.damage) enemy.damage = template.damage;
            if (template.speed) enemy.speed = template.speed;
            if (template.scriptId) enemy.scriptId = template.scriptId;
            if (typeof spawn.orientation === "number") enemy.mesh.rotation.y = spawn.orientation;
            if (!spawn.isEnemy) this.placeFriendlyAwayFromObstacles(enemy);
            this.enemies.push(enemy);
            this.scene.add(enemy.mesh);
            if (!spawn.isEnemy) this.npcs.push({ mesh: enemy.mesh, name: template.name, template });
        });
        if (this.ui) {
            this.ui.addChatMessage("System", "You arrive at a small outpost bustling with NPCs. Press Enter to chat.");
        }
    }

    spawnGameObjects(prefabs: Record<string, any>) {
        gameObjectSpawns.forEach(spawn => {
            const template = gameObjectTemplates[spawn.templateId];
            if (!template) return;
            let obj: THREE.Object3D | null = null;
            if (template.model) {
                const prefab = prefabs[template.model];
                if (!prefab) return;
                obj = prefab.scene.clone(true);
                const scale = template.scale ?? 1;
                obj.scale.setScalar(scale);
            } else {
                obj = buildGeometryGroup(template.geometry) || null;
            }
            if (!obj) return;
            obj.position.set(spawn.position.x, spawn.position.y, spawn.position.z);
            if (typeof spawn.orientation === "number") obj.rotation.y = spawn.orientation;
            obj.traverse((child: any) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    this.sceneObstacles.push(child);
                }
            });
            this.scene.add(obj);
        });
    }

    spawnVolatileCreature(templateId: string, position: { x: number; y: number; z: number }, orientation: number = 0, register: boolean = true, asEnemy: boolean = true) {
        const template = creatureTemplates[templateId];
        if (!template) return false;
        const prefab = this.creaturePrefabs[template.model];
        if (!prefab) return false;
        const enemy = new Enemy(position.x, position.z, prefab, asEnemy, template.scale ?? 0.08, 0, template.id);
        enemy.mesh.name = template.name;
        enemy.mesh.position.y = position.y + 1;
        if (!template.canFly) enemy.mesh.position.y = Math.max(enemy.mesh.position.y, 0.1);
        enemy.maxHp = template.hp;
        enemy.hp = template.hp;
        enemy.xpWorth = template.exp;
        if (template.damage) enemy.damage = template.damage;
        if (template.speed) enemy.speed = template.speed;
        if (template.scriptId) enemy.scriptId = template.scriptId;
        enemy.mesh.rotation.y = orientation;
        if (!enemy.isEnemy) this.placeFriendlyAwayFromObstacles(enemy);
        this.enemies.push(enemy);
        this.scene.add(enemy.mesh);
        if (register) {
            this.volatileSpawns.creatures.push({ templateId, position, orientation, isEnemy: asEnemy });
        }
        return true;
    }

    spawnVolatileGameObject(templateId: string, position: { x: number; y: number; z: number }, orientation: number = 0, register: boolean = true) {
        const template = gameObjectTemplates[templateId];
        if (!template) return false;
        let obj: THREE.Object3D | null = null;
        if (template.model) {
            const prefab = this.gameObjectPrefabs[template.model];
            if (!prefab) return false;
            obj = prefab.scene.clone(true);
            obj.scale.setScalar(template.scale ?? 1);
        } else {
            obj = buildGeometryGroup(template.geometry) || null;
        }
        if (!obj) return false;
        obj.position.set(position.x, position.y, position.z);
        obj.rotation.y = orientation;
        obj.traverse((child: any) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                this.sceneObstacles.push(child);
            }
        });
        this.scene.add(obj);
        if (register) {
            this.volatileSpawns.gameobjects.push({ templateId, position, orientation });
        }
        return true;
    }

    persistVolatileSpawns() {
        try {
            localStorage.setItem("wowts_volatile_spawns", JSON.stringify(this.volatileSpawns));
        } catch (err) {
            console.warn("Failed to persist volatile spawns", err);
        }
    }

    loadVolatileSpawns() {
        try {
            const raw = localStorage.getItem("wowts_volatile_spawns");
            if (raw) {
                this.volatileSpawns = JSON.parse(raw);
            }
        } catch (err) {
            console.warn("Failed to load volatile spawns", err);
        }
        (this.volatileSpawns.creatures || []).forEach((c: any) => {
            this.spawnVolatileCreature(c.templateId, c.position, c.orientation ?? 0, false, c.isEnemy ?? true);
        });
        (this.volatileSpawns.gameobjects || []).forEach((g: any) => {
            this.spawnVolatileGameObject(g.templateId, g.position, g.orientation ?? 0, false);
        });
    }

    generateLootFor(enemy: Enemy): string[] {
        const loot: string[] = [];
        const templateId = enemy.templateId;
        const table = templateId ? creatureTemplateLoot[templateId] : null;
        if (table) {
            const goldMult = table.goldMultiplier ?? 1;
            const gold = Math.max(1, Math.round((5 + Math.random() * 10) * goldMult));
            loot.push(`gold_${gold}`);
            table.items.forEach(entry => {
                if (Math.random() <= entry.chance) {
                    const qty = entry.quantity ?? 1;
                    for (let i = 0; i < qty; i++) loot.push(entry.itemId);
                }
            });
            if (!loot.length) loot.push(`gold_${Math.max(1, Math.round(10 * (table.goldMultiplier ?? 1)))}`);
        } else {
            const lootCount = 1 + Math.floor(Math.random() * 3);
            for (let i = 0; i < lootCount; i++) loot.push(getRandomLoot().id);
            loot.push("gold_" + (5 + Math.floor(Math.random() * 10)));
        }
        return loot;
    }

    setupChatCommands() {
        window.addEventListener("playerChat", (e: any) => {
            const text = e.detail?.text;
            if (!text) return;
            const isCommand = text.trim().startsWith(".");
            if (isCommand) {
                const executed = handleChatCommand(text.trim(), { game: this });
                // If not executed, treat as normal message (already added to chat by UI)
                if (executed) return;
            }
            // Non-command: nothing to do here; message already displayed by UI.
        });
    }

    togglePauseMenu() {
        this.paused = !this.paused;
        if (this.paused) {
            this.showPauseMenu();
        } else {
            this.hidePauseMenu();
        }
    }

    showPauseMenu() {
        if (this.pauseOverlay) {
            this.pauseOverlay.style.display = "flex";
            return;
        }
        const overlay = document.createElement("div");
        overlay.id = "pause-overlay";
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100vw";
        overlay.style.height = "100vh";
        overlay.style.background = "rgba(0,0,0,0.7)";
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        overlay.style.zIndex = "999998";

        const menu = document.createElement("div");
        menu.style.background = "linear-gradient(135deg, #1e140c, #2a1e14)";
        menu.style.border = "2px solid #c49a3a";
        menu.style.borderRadius = "12px";
        menu.style.padding = "16px";
        menu.style.display = "flex";
        menu.style.flexDirection = "column";
        menu.style.gap = "10px";
        menu.style.minWidth = "240px";
        menu.style.boxShadow = "0 6px 18px rgba(0,0,0,0.7)";

        const title = document.createElement("div");
        title.textContent = "Paused";
        title.style.color = "#f6d48b";
        title.style.fontWeight = "800";
        title.style.fontSize = "1.2rem";
        title.style.textAlign = "center";
        menu.appendChild(title);

        const saveBtn = document.createElement("button");
        saveBtn.textContent = "Save";
        saveBtn.style.padding = "10px 12px";
        saveBtn.style.borderRadius = "10px";
        saveBtn.style.border = "1px solid #c49a3a";
        saveBtn.style.background = "linear-gradient(135deg, #2a1e14, #1a120c)";
        saveBtn.style.color = "#f6d48b";
        saveBtn.style.fontWeight = "800";
        saveBtn.style.cursor = "pointer";
        saveBtn.onclick = () => {
            this.saveCurrentState();
            this.ui?.addChatMessage("System", "Game saved.");
        };
        menu.appendChild(saveBtn);

        const changeBtn = document.createElement("button");
        changeBtn.textContent = "Change Character";
        changeBtn.style.padding = "10px 12px";
        changeBtn.style.borderRadius = "10px";
        changeBtn.style.border = "1px solid #c49a3a";
        changeBtn.style.background = "linear-gradient(135deg, #2a1e14, #1a120c)";
        changeBtn.style.color = "#f6d48b";
        changeBtn.style.fontWeight = "800";
        changeBtn.style.cursor = "pointer";
        changeBtn.onclick = () => {
            this.hidePauseMenu();
            this.paused = false;
            this.returnToCharacterSelect();
        };
        menu.appendChild(changeBtn);

        const resumeBtn = document.createElement("button");
        resumeBtn.textContent = "Resume";
        resumeBtn.style.padding = "10px 12px";
        resumeBtn.style.borderRadius = "10px";
        resumeBtn.style.border = "1px solid #c49a3a";
        resumeBtn.style.background = "linear-gradient(135deg, #2a1e14, #1a120c)";
        resumeBtn.style.color = "#f6d48b";
        resumeBtn.style.fontWeight = "800";
        resumeBtn.style.cursor = "pointer";
        resumeBtn.onclick = () => this.togglePauseMenu();
        menu.appendChild(resumeBtn);

        overlay.appendChild(menu);
        document.body.appendChild(overlay);
        this.pauseOverlay = overlay;
    }

    hidePauseMenu() {
        if (this.pauseOverlay) this.pauseOverlay.style.display = "none";
    }

    saveCurrentState() {
        if (!this.currentCharacter) return;
        const key = `wowts_save_${this.currentCharacter.id}`;
        const state = {
            inventory: this.inventory,
            gold: this.gold,
            equipment: this.currentCharacter.equipment,
            learnedTalents: Array.from(this.learnedTalents),
            hp: this.player?.hp,
            mana: this.player?.mana,
            level: this.player?.level,
            xp: this.player?.xp,
            xpToNext: this.player?.xpToNext,
            position: this.player?.mesh?.position ? { x: this.player.mesh.position.x, y: this.player.mesh.position.y, z: this.player.mesh.position.z } : null,
            rotationY: this.player?.mesh?.rotation ? this.player.mesh.rotation.y : null,
            spellSlots: this.spellSlots,
        };
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch (err) {
            console.warn("Failed to save state", err);
        }
    }

    loadSavedState(): any | null {
        if (!this.currentCharacter) return null;
        const key = `wowts_save_${this.currentCharacter.id}`;
        try {
            const raw = localStorage.getItem(key);
            if (raw) return JSON.parse(raw);
        } catch (err) {
            console.warn("Failed to load saved state", err);
        }
        return null;
    }

    async loadWorldMap(loadByExtension: (path: string) => Promise<any>) {
        const map = await loadByExtension("/environment/maps/Nature.glb");
        if (map && map.scene) {
            const mapScene = map.scene.clone(true);
            mapScene.traverse((child: any) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    this.sceneObstacles.push(child);
                }
            });
            this.scene.add(mapScene);
        }
    }

    updateDayNight(now: number) {
        if (!this.ambientLight || !this.sunLight) return;
        if (!this.dayNightTimer) this.dayNightTimer = now;
        const t = (now - this.dayNightTimer) % this.dayNightDuration;
        const phase = t / this.dayNightDuration; // 0..1
        // phase 0 -> day start, 0.5 -> night, 1 -> day again
        const isNight = phase > 0.5;
        const mix = isNight ? (phase - 0.5) * 2 : (1 - phase * 2);
        // Ambient: keep nights brighter by raising the baseline further
        const ambientIntensity = 0.35 * mix + 0.35;
        this.ambientLight.intensity = ambientIntensity;
        this.ambientLight.color.set(isNight ? 0x323b55 : 0xc7b9a2);
        // Sun/Moon
        this.sunLight.intensity = isNight ? 0.65 : 1.05;
        this.sunLight.color.set(isNight ? 0xc3d6ff : 0xfff0d0);
        const angle = phase * Math.PI * 2;
        this.sunLight.position.set(Math.cos(angle) * 30, Math.sin(angle) * 30, Math.sin(angle) * 10);
        // Fog/sky
        const sky = isNight ? 0x243043 : 0x1f2a38;
        const fogNear = isNight ? 18 : 25;
        const fogFar = isNight ? 200 : 180;
        this.scene.background = new THREE.Color(sky);
        this.scene.fog = new THREE.Fog(sky, fogNear, fogFar);
    }
}
