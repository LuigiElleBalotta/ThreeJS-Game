import * as THREE from "three";
import { Player } from "./player";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { clone } from "./utils/skeletonutils.js";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader";

export class Enemy {
  mesh: THREE.Group;
  speed: number;
  maxHp: number = 50;
  hp: number = this.maxHp;
  isEnemy: boolean = true;
  templateId?: string;
  alive: boolean = true;
  attackRange: number = 1.5;
  damage: number = 5;
  cooldown: number = 1000;
  lastAttack: number = 0;
  xpWorth: number = 35;
  rewardGranted: boolean = false;
  loot: string[] = [];

  mixer?: THREE.AnimationMixer;
  actions: { [name: string]: THREE.AnimationAction } = {};

  // --- Health bar 2D DOM
  healthBarDiv: HTMLDivElement;
  healthBarInner: HTMLDivElement;
  headOffset: THREE.Vector3 | null = null;

  constructor(x: number, z: number, prefab?: any, isEnemy: boolean = true, modelScale: number = 0.01, modelYOffset: number = -1, templateId?: string) {
    this.isEnemy = isEnemy;
    this.templateId = templateId;
    this.mesh = new THREE.Group();
    this.mesh.position.set(x, 1, z);

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
    }

    // Calcola la posizione della testa solo una volta
    setTimeout(() => this.recalculateHeadOffset(), 0);

    this.speed = 0.03 + Math.random() * 0.02; // velocità leggermente variabile
  }

  isAlive() {
    return this.alive;
  }

  takeDamage(amount: number) {
    if (!this.alive || !this.isEnemy) return;
    this.hp = Math.max(this.hp - amount, 0);
    if (this.hp <= 0) this.alive = false;
  }

  getBoundingBox(pos?: THREE.Vector3) {
    // Calcola la bounding box reale del modello enemy
    const box = new THREE.Box3().setFromObject(this.mesh);
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
  }

  update(player: Player, camera?: THREE.Camera) {
    if (this.mixer) {
      this.mixer.update(1 / 60);
    }

    if (!this.alive) {
      this.healthBarDiv.style.display = "none";
      return;
    }

    if (camera) this.updateHealthBar(camera);

    // Friendly creatures: no AI behavior
    if (!this.isEnemy) return;

    const dir = new THREE.Vector3().subVectors(player.mesh.position, this.mesh.position);
    const distance = dir.length();
    dir.normalize();

    // Insegue solo se il player è vicino (entro 8 unità)
    if (distance < 8) {
      // zig-zag
      const perpendicular = new THREE.Vector3(-dir.z, 0, dir.x);
      const zigzag = Math.sin(Date.now() * 0.005) * 0.5;
      dir.addScaledVector(perpendicular, zigzag * 0.2).normalize();

      if (distance > this.attackRange) this.mesh.position.addScaledVector(dir, this.speed);

      // attacco player
      if (distance < this.attackRange) {
        const now = Date.now();
        if (now - this.lastAttack > this.cooldown) {
          player.takeDamage(this.damage);
          window.dispatchEvent(new CustomEvent("playerDamage", { detail: { amount: this.damage, sourceEnemy: this } }));
          this.lastAttack = now;
        }
      }
    }
  }
}
