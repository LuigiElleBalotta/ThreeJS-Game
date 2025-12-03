import * as THREE from "three";
import { Enemy } from "./enemy";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import { AnimationMixer, AnimationAction } from "three";
import { getClassById } from "./classes";

export class Player {
  maxHp: number = 100;
  hp: number = this.maxHp;
  maxMana: number = 100;
  mana: number = this.maxMana;
  classId: string = "warrior";
  level: number = 1;
  xp: number = 0;
  xpToNext: number = 100;
  knownSpells: string[] = ["heroic_strike"];
  mesh: THREE.Mesh;
  speed: number = 0.1;

  velocityY: number = 0;
  isOnGround: boolean = true;

  attackRange: number = 3;
  attackDamage: number = 20;
  cooldown: number = 800; // ms
  lastAttack: number = 0;

  raycaster: THREE.Raycaster;
  isAttacking: boolean = false;
  attackProgress: number = 0;

  mixer?: AnimationMixer;
  actions: { [name: string]: AnimationAction } = {};
  activeAction?: AnimationAction;

  constructor(classId: string = "warrior") {
    this.classId = classId;
    const classData = getClassById(classId);
    if (classData) {
      this.maxHp = classData.baseStats.hp;
      this.hp = this.maxHp;
      this.maxMana = classData.baseStats.mana;
      this.mana = this.maxMana;
      this.attackDamage = classData.baseStats.attackDamage;
      this.knownSpells = [...classData.starterSpells];
    }
    this.mesh = new THREE.Group();
    this.mesh.position.set(0, 1, 0);

    // Carica modello guard_knight
    const loader = new GLTFLoader();
    loader.load(
      "/characters/guard_knight/scene.gltf",
      (gltf: GLTF) => {
        gltf.scene.traverse((child: THREE.Object3D) => {
          if ((child as THREE.Mesh).isMesh) {
            (child as THREE.Mesh).castShadow = true;
            (child as THREE.Mesh).receiveShadow = true;
          }
        });
        gltf.scene.rotation.y = Math.PI;
        this.mesh.clear();
        gltf.scene.scale.set(0.01, 0.01, 0.01);
        gltf.scene.position.y = -1;
        this.mesh.add(gltf.scene);
        this.mesh.scale.set(1, 1, 1);
        this.mesh.position.y = 1;

        // Animazioni
        if (gltf.animations && gltf.animations.length > 0) {
          this.mixer = new AnimationMixer(gltf.scene);
          for (const clip of gltf.animations) {
            this.actions[clip.name] = this.mixer.clipAction(clip);
          }
          // Avvia la prima animazione trovata (idle)
          const firstAnim = Object.values(this.actions)[0];
          if (firstAnim) {
            firstAnim.play();
            this.activeAction = firstAnim;
          }
        }
      }
    );

    this.raycaster = new THREE.Raycaster();

    window.addEventListener("click", () => this.attack());
  }

  getBoundingBox(pos?: THREE.Vector3) {
    // Calcola la bounding box reale del modello player
    const box = new THREE.Box3();
    box.setFromObject(this.mesh);
    if (pos) {
      const size = box.getSize(new THREE.Vector3());
      box.setFromCenterAndSize(
        new THREE.Vector3(pos.x, pos.y + size.y / 2, pos.z),
        size
      );
    }
    return box;
  }

  move(keys: Set<string>, forwardDirection?: THREE.Vector3) {
    if (forwardDirection && keys.has("w")) {
      // Movimento nella direzione della camera (solo XZ)
      const dir = forwardDirection.clone().normalize().multiplyScalar(this.speed);
      this.mesh.position.add(dir);
    } else {
      if (keys.has("w")) this.mesh.position.z -= this.speed;
      if (keys.has("s")) this.mesh.position.z += this.speed;
      if (keys.has("a")) this.mesh.position.x -= this.speed;
      if (keys.has("d")) this.mesh.position.x += this.speed;
    }
  }

  takeDamage(amount: number) {
    this.hp = Math.max(this.hp - amount, 0);
    const event = new CustomEvent("playerDamage", { detail: { amount } });
    window.dispatchEvent(event);
  }

  isAlive(): boolean {
    return this.hp > 0;
  }

  attack() {
    const now = Date.now();
    if (now - this.lastAttack < this.cooldown) return;
    this.lastAttack = now;
    this.isAttacking = true;
    this.attackProgress = 0;

    const event = new CustomEvent("playerAttack", { detail: this });
    window.dispatchEvent(event);
  }

  getAttackRay(): THREE.Raycaster {
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(this.mesh.quaternion);
    this.raycaster.set(this.mesh.position.clone(), forward);
    this.raycaster.far = this.attackRange;
    return this.raycaster;
  }

  update(delta: number) {
    if (this.mixer) {
      this.mixer.update(delta);
    }

    // Fisica salto
    const gravity = -0.04;
    this.mesh.position.y += this.velocityY;
    if (!this.isOnGround) {
      this.velocityY += gravity * delta * 60;
    }
    if (this.mesh.position.y <= 1) {
      this.mesh.position.y = 1;
      this.velocityY = 0;
      this.isOnGround = true;
    } else {
      this.isOnGround = false;
    }

    if (this.isAttacking) {
      // Swing animation: oscillazione mesh lungo l’asse Y
      this.attackProgress += delta * 5; // velocità animazione
      const angle = Math.sin(this.attackProgress) * 0.5;
      this.mesh.rotation.y = angle;

      if (this.attackProgress > Math.PI) {
        this.mesh.rotation.y = 0;
        this.isAttacking = false;
      }
    }
  }

  jump() {
    if (this.isOnGround) {
      this.velocityY = 0.32;
      this.isOnGround = false;
    }
  }

  gainXp(amount: number) {
    this.xp += amount;
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level += 1;
      this.maxHp += 20;
      this.maxMana += 15;
      this.attackDamage += 2;
      this.hp = this.maxHp;
      this.mana = this.maxMana;
      this.xpToNext = Math.round(this.xpToNext * 1.25);
      window.dispatchEvent(new CustomEvent("playerLevelUp", { detail: { level: this.level } }));
    }
  }
}
