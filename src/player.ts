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
  speed: number = 0.35;
  isGameMaster: boolean = false;
  canFly: boolean = false;

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

    // Carica modello per classe
    const loader = new GLTFLoader();
    const modelPath = this.classId === "mage" ? "/characters/lizard_mage_animated/scene.gltf" : "/characters/guard_knight/scene.gltf";
    loader.load(
      modelPath,
      (gltf: GLTF) => {
        gltf.scene.traverse((child: THREE.Object3D) => {
          if ((child as THREE.Mesh).isMesh) {
            (child as THREE.Mesh).castShadow = true;
            (child as THREE.Mesh).receiveShadow = true;
          }
        });
        // Orient models: guard faces backward by default, lizard faces forward
        gltf.scene.rotation.y = this.classId === "mage" ? 0 : Math.PI;
        this.mesh.clear();
        // Mage model is small: enlarge further
        const scale = this.classId === "mage" ? 0.06 : 0.01;
        gltf.scene.scale.set(scale, scale, scale);
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
          // Gioca l'idle se presente, preferendo "Static Pose"
          const idleAnim = Object.entries(this.actions).find(([name]) => name.toLowerCase().includes("static pose") || name.toLowerCase().includes("idle"));
          const chosen = idleAnim ? idleAnim[1] : Object.values(this.actions)[0];
          if (chosen) {
            chosen.play();
            this.activeAction = chosen;
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
    // Calcola direzione avanti in base alla camera o alla rotazione del player
    const forward = (forwardDirection ? forwardDirection.clone() : new THREE.Vector3(0, 0, -1).applyQuaternion(this.mesh.quaternion))
      .setY(0)
      .normalize();

    const moveDir = new THREE.Vector3();
    if (keys.has("w")) moveDir.add(forward);
    if (keys.has("s")) moveDir.add(forward.clone().negate());
    if (moveDir.lengthSq() > 0) {
      moveDir.normalize().multiplyScalar(this.speed);
      this.mesh.position.add(moveDir);
    }

    const rotSpeed = 0.06;
    if (keys.has("a")) this.mesh.rotation.y += rotSpeed;
    if (keys.has("d")) this.mesh.rotation.y -= rotSpeed;
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

    // Fisica salto/volo
    if (this.canFly) {
      this.velocityY = 0;
      this.isOnGround = true;
    } else {
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
