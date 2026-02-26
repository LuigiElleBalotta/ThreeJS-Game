import * as THREE from "three";
import { Player } from "./player";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { clone } from "./utils/skeletonutils.js";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import { enemyScripts } from "./enemyScripts";
import { evilWizardAI } from "./enemyScripts/evilWizard";
import { waypointScripts, WaypointScriptFn } from "./waypointScripts";
import { CreatureSpawn } from "./creatures";
import { AnimationController } from "./animationController";
import { inferClipMapFromAnimations } from "./utils/animationProfile";

export class Enemy {
    mesh: THREE.Group;
    speed: number;
    maxHp: number = 50;
    hp: number = this.maxHp;
    isEnemy: boolean = true;
    templateId?: string;
    spawnId?: string;
    factionId: string = "hostile";
    canRespawn: boolean = false;
    respawnDelay: number = 0;
    deathTime: number = 0;
    spawnDefinition: CreatureSpawn | null = null;
    isRare: boolean = false;
    alive: boolean = true;
    waypoints: THREE.Vector3[] = [];
    currentWaypointIndex: number = 0;
    patrolWaitMs: number = 800;
    patrolPausedUntil: number = 0;
    waypointEvents: (WaypointScriptFn | null)[] = [];
    spawnPosition: THREE.Vector3;
    attackRange: number = 1.5;
    damage: number = 5;
    cooldown: number = 1000;
    lastAttack: number = 0;
    lastSpellTimes: Record<string, number> = {};
    currentCast: { spell: any; target: Player; start: number; end: number } | null = null;
    castBarDiv: HTMLDivElement | null = null;
    castBarInner: HTMLDivElement | null = null;
    xpWorth: number = 35;
    rewardGranted: boolean = false;
    loot: string[] = [];
    scriptId?: string;

    mixer?: THREE.AnimationMixer;
    actions: { [name: string]: THREE.AnimationAction } = {};
    loadedClips: THREE.AnimationClip[] = [];
    animController?: AnimationController;
    attackAnimatingUntil: number = 0;

    // --- Health bar 2D DOM
    healthBarDiv: HTMLDivElement;
    healthBarInner: HTMLDivElement;
    headOffset: THREE.Vector3 | null = null;

    constructor(x: number, z: number, prefab?: any, isEnemy: boolean = true, modelScale: number = 0.01, modelYOffset: number = -1, templateId?: string) {
        this.isEnemy = isEnemy;
        this.templateId = templateId;
        this.mesh = new THREE.Group();
        this.mesh.position.set(x, 1, z);
        this.spawnPosition = this.mesh.position.clone();

        // Health bar DOM
        this.healthBarDiv = document.createElement("div");
        this.healthBarDiv.style.position = "fixed";
        this.healthBarDiv.style.width = "64px";
        this.healthBarDiv.style.height = "10px";
        this.healthBarDiv.style.background = "#333";
        this.healthBarDiv.style.border = "1px solid #fff";
        this.healthBarDiv.style.borderRadius = "6px";
        this.healthBarDiv.style.overflow = "hidden";
        this.healthBarDiv.style.pointerEvents = "auto";
        this.healthBarDiv.style.zIndex = "10000";
        this.healthBarDiv.style.display = "block";
        this.healthBarInner = document.createElement("div");
        this.healthBarInner.style.height = "100%";
        this.healthBarInner.style.background = this.isEnemy ? "#ff0060" : "#3bdc6a";
        this.healthBarInner.style.transition = "width 0.2s";
        this.healthBarInner.style.borderRadius = "6px";
        this.healthBarInner.style.width = "100%";
        this.healthBarDiv.appendChild(this.healthBarInner);
        document.body.appendChild(this.healthBarDiv);

        // Cast bar DOM (above health bar)
        this.castBarDiv = document.createElement("div");
        this.castBarDiv.style.position = "fixed";
        this.castBarDiv.style.width = "64px";
        this.castBarDiv.style.height = "6px";
        this.castBarDiv.style.background = "#1a1a1a";
        this.castBarDiv.style.border = "1px solid #7f5b21";
        this.castBarDiv.style.borderRadius = "6px";
        this.castBarDiv.style.overflow = "hidden";
        this.castBarDiv.style.pointerEvents = "none";
        this.castBarDiv.style.zIndex = "10001";
        this.castBarDiv.style.display = "none";
        this.castBarInner = document.createElement("div");
        this.castBarInner.style.height = "100%";
        this.castBarInner.style.width = "0%";
        this.castBarInner.style.background = "linear-gradient(90deg,#e35d2e,#ffb27a)";
        this.castBarInner.style.borderRadius = "6px";
        this.castBarDiv.appendChild(this.castBarInner);
        const castLabel = document.createElement("div");
        castLabel.id = "enemy-cast-text";
        castLabel.style.position = "absolute";
        castLabel.style.left = "50%";
        castLabel.style.top = "50%";
        castLabel.style.transform = "translate(-50%,-50%)";
        castLabel.style.color = "#f6d48b";
        castLabel.style.fontSize = "9px";
        castLabel.style.fontWeight = "700";
        castLabel.style.pointerEvents = "none";
        this.castBarDiv.appendChild(castLabel);
        document.body.appendChild(this.castBarDiv);

        // Selezione nemico tramite click/tap sulla healthbar
        this.healthBarDiv.addEventListener("click", (e) => {
            e.stopPropagation();
            window.dispatchEvent(new CustomEvent("selectEnemy", { detail: { enemy: this } }));
        });
        this.healthBarDiv.addEventListener("pointerdown", (e) => {
            e.stopPropagation();
            e.preventDefault();
            window.dispatchEvent(new CustomEvent("selectEnemy", { detail: { enemy: this } }));
        });

        if (prefab) {
            // Use local clone util for proper skinning/animation support
            const zombie = clone(prefab.scene);
            zombie.traverse((child: THREE.Object3D) => {
                if ((child as THREE.Mesh).isMesh) {
                    (child as THREE.Mesh).castShadow = true;
                    (child as THREE.Mesh).receiveShadow = true;
                }
            });
            zombie.scale.set(modelScale, modelScale, modelScale);
            zombie.position.set(0, modelYOffset, 0);
            this.mesh.clear();
            this.mesh.add(zombie);

            if (prefab.animations && prefab.animations.length > 0) {
                this.loadedClips = prefab.animations;
                this.mixer = new THREE.AnimationMixer(zombie);
                for (const clip of prefab.animations) {
                    const action = this.mixer.clipAction(clip);
                    this.actions[clip.name] = action;
                }
                this.animController = new AnimationController(this.actions, inferClipMapFromAnimations(this.loadedClips));
                this.updateAnimationState(false, false);
            }
        }

        // Calcola la posizione della testa solo una volta
        setTimeout(() => this.recalculateHeadOffset(), 0);

        this.speed = 0.03 + Math.random() * 0.02; // velocità leggermente variabile
    }

    setRare(mult: number = 1.4) {
        this.isRare = true;
        this.maxHp = Math.round(this.maxHp * mult);
        this.hp = this.maxHp;
        this.damage = Math.round(this.damage * mult);
        this.xpWorth = Math.round(this.xpWorth * mult);
        if (this.healthBarInner) this.healthBarInner.style.background = "linear-gradient(90deg,#5b0f5b,#d26bff)";
    }

    isAlive() {
        return this.alive;
    }

    takeDamage(amount: number) {
        if (!this.alive || !this.isEnemy) return;
        this.hp = Math.max(this.hp - amount, 0);
        if (this.hp <= 0) {
            this.alive = false;
            this.deathTime = Date.now();
            this.updateAnimationState(false, false);
            window.dispatchEvent(new CustomEvent("enemyKilled", { detail: { enemy: this } }));
        }
    }


    getBoundingBox(pos?: THREE.Vector3) {
        // Calcola la bounding box reale del modello enemy
        const box = new THREE.Box3();
        box.setFromObject(this.mesh);
        if (pos) {
            const size = box.getSize(new THREE.Vector3());
            box.min.copy(pos).add(box.min.clone().sub(this.mesh.position));
            box.max.copy(box.min).add(size);
        }
        return box;
    }

    updateHealthBar(camera: THREE.Camera) {
        if (!this.alive) {
            this.healthBarDiv.style.display = "none";
            if (this.castBarDiv) this.castBarDiv.style.display = "none";
            return;
        }
        // Usa la posizione della testa calcolata una volta sola
        if (this.headOffset) {
            const headWorldPos = this.mesh.position.clone().add(this.headOffset);
            const vector = headWorldPos.project(camera);
            const x = (vector.x * 0.5 + 0.5) * window.innerWidth - 32;
            const y = (-vector.y * 0.5 + 0.5) * window.innerHeight - 32;
            this.healthBarDiv.style.left = `${x}px`;
            this.healthBarDiv.style.top = `${y}px`;
            this.healthBarDiv.style.display = "block";
            if (this.castBarDiv) {
                this.castBarDiv.style.left = `${x}px`;
                // place castbar under the healthbar
                this.castBarDiv.style.top = `${y + 12}px`;
                this.castBarDiv.style.display = this.currentCast ? "block" : "none";
            }
        }

        // Aggiorna la barra in base agli hp
        const hp = Math.max(0, this.hp);
        const maxHp = this.maxHp || 50;
        const percent = (hp / maxHp) * 100;
        this.healthBarInner.style.width = `${percent}%`;
    }

    recalculateHeadOffset() {
        let headWorldPos = new THREE.Vector3();
        let maxY = -Infinity;
        this.mesh.traverse((obj: any) => {
            if (obj.isMesh) {
                obj.updateWorldMatrix(true, false);
                const geometry = obj.geometry;
                if (geometry && geometry.attributes && geometry.attributes.position) {
                    const pos = geometry.attributes.position;
                    for (let i = 0; i < pos.count; i++) {
                        let v = new THREE.Vector3().fromBufferAttribute(pos, i);
                        obj.localToWorld(v);
                        if (v.y > maxY) {
                            maxY = v.y;
                            headWorldPos.copy(v);
                        }
                    }
                }
            }
        });
        headWorldPos.y += 0.5;
        this.headOffset = headWorldPos.clone().sub(this.mesh.position);
    }

    destroyHealthBar() {
        this.healthBarDiv.remove();
        if (this.castBarDiv) this.castBarDiv.remove();
    }

    update(player: Player, camera?: THREE.Camera, playerIsGhost: boolean = false, delta: number = 1 / 60) {
        if (this.mixer) {
            this.mixer.update(delta);
        }

        if (!this.alive) {
            this.updateAnimationState(false, false);
            this.healthBarDiv.style.display = "none";
            return;
        }

        if (camera) this.updateHealthBar(camera);

        // Friendly creatures: can still patrol
        if (!this.isEnemy || player.isGameMaster || !player.isAlive() || playerIsGhost) {
            if (this.waypoints.length > 0) this.updatePatrol();
            this.updateAnimationState(this.waypoints.length > 0, false);
            return;
        }

        const dirToPlayer = new THREE.Vector3().subVectors(player.mesh.position, this.mesh.position);
        const distance = dirToPlayer.length();
        dirToPlayer.normalize();

        const leashRange = 25;

        this.updateCasting(Date.now(), player);

        if (this.currentCast) {
            // lock movement while casting
        } else if (distance < leashRange) {
            // zig-zag chase
            const perpendicular = new THREE.Vector3(-dirToPlayer.z, 0, dirToPlayer.x);
            const zigzag = Math.sin(Date.now() * 0.005) * 0.5;
            dirToPlayer.addScaledVector(perpendicular, zigzag * 0.2).normalize();

            if (distance > this.attackRange) this.mesh.position.addScaledVector(dirToPlayer, this.speed);

            // attacco player
            if (distance < this.attackRange) {
                const now = Date.now();
                if (now - this.lastAttack > this.cooldown) {
                    player.takeDamage(this.damage);
                    window.dispatchEvent(new CustomEvent("playerDamage", { detail: { amount: this.damage, sourceEnemy: this } }));
                    this.lastAttack = now;
                    this.attackAnimatingUntil = now + 500;
                }
            }
        } else if (this.waypoints.length > 0) {
            this.updatePatrol();
        } else {
            // leash back to spawn and heal
            const toSpawn = new THREE.Vector3().subVectors(this.spawnPosition, this.mesh.position);
            const dSpawn = toSpawn.length();
            if (dSpawn > 0.05) {
                toSpawn.normalize();
                this.mesh.position.addScaledVector(toSpawn, this.speed * 1.2);
            } else {
                this.mesh.position.copy(this.spawnPosition);
            }
            this.hp = this.maxHp;
        }

        // Run script AI (for casters etc.)
        if (this.scriptId && enemyScripts[this.scriptId]) {
            enemyScripts[this.scriptId](this, { player, now: Date.now(), delta: 1 / 60 });
        }

        const moving = this.currentCast
            ? false
            : ((distance > this.attackRange && distance < leashRange) || this.waypoints.length > 0);
        this.updateAnimationState(moving, false);
    }

    startCast(spell: any, target: Player, now: number) {
        const castTime = spell.castTime ?? 0;
        if (castTime <= 0) {
            const dmg = enemySpellDamage(spell, this);
            target.takeDamage(dmg);
            window.dispatchEvent(new CustomEvent("playerDamage", { detail: { amount: dmg, sourceEnemy: this } }));
            return;
        }
        this.currentCast = { spell, target, start: now, end: now + castTime };
        if (this.castBarInner) this.castBarInner.style.width = "0%";
        this.updateAnimationState(false, false);
    }

    updateCasting(now: number, player: Player) {
        if (!this.currentCast) return;
        const { spell, start, end, target } = this.currentCast;
        const t = Math.min(1, (now - start) / (end - start));
        if (this.castBarInner) this.castBarInner.style.width = `${t * 100}%`;
        const label = this.castBarDiv?.querySelector("#enemy-cast-text") as HTMLDivElement | null;
        if (label) {
            const remaining = Math.max(0, (end - now) / 1000).toFixed(1);
            label.textContent = `${spell.name} (${remaining}s)`;
        }
        if (now >= end) {
            const dmg = enemySpellDamage(spell, this);
            target.takeDamage(dmg);
            window.dispatchEvent(new CustomEvent("playerDamage", { detail: { amount: dmg, sourceEnemy: this } }));
            this.currentCast = null;
            if (this.castBarDiv) this.castBarDiv.style.display = "none";
            this.attackAnimatingUntil = now + 400;
        }
    }

    setPatrol(waypoints: THREE.Vector3[], waitMs: number = 800, events?: (string | undefined)[]) {
        this.waypoints = waypoints;
        this.patrolWaitMs = waitMs;
        this.currentWaypointIndex = 0;
        this.waypointEvents = (events || []).map(id => (id ? waypointScripts[id] ?? null : null));
    }

    updatePatrol() {
        if (this.waypoints.length === 0) return;
        const now = Date.now();
        if (this.patrolPausedUntil && now < this.patrolPausedUntil) return;
        const target = this.waypoints[this.currentWaypointIndex];
        const dir = target.clone().sub(this.mesh.position);
        const dist = dir.length();
        if (dist < 0.6) {
            const ev = this.waypointEvents[this.currentWaypointIndex] || null;
            if (ev) ev(this);
            this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length;
            this.patrolPausedUntil = now + this.patrolWaitMs;
            return;
        }
        dir.normalize();
        this.mesh.position.addScaledVector(dir, this.speed * 0.9);
        this.mesh.rotation.y = Math.atan2(dir.x, dir.z);
    }

    getCastProgress(now: number) {
        if (!this.currentCast) return null;
        const { start, end, spell } = this.currentCast;
        const pct = Math.min(1, (now - start) / (end - start));
        const remaining = Math.max(0, (end - now) / 1000);
        return { pct, remaining, spell };
    }

    private updateAnimationState(moving: boolean, backwards: boolean) {
        if (!this.animController) return;
        const now = Date.now();
        this.animController.setState({
            moving,
            backwards,
            airborne: false,
            attacking: now < this.attackAnimatingUntil,
            casting: !!this.currentCast,
            dead: !this.alive,
        });
    }

}

function enemySpellDamage(spell: any, enemy: Enemy) {
    const base = enemy.damage || 8;
    const mult = spell.damageMult ?? 1;
    const critChance = spell.critChance ?? 0.1;
    const isCrit = Math.random() < critChance;
    return Math.round(base * mult * (isCrit ? 2 : 1));
}
