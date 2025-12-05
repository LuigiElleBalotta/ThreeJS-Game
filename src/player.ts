import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import { AnimationMixer, AnimationAction, LoopOnce } from "three";
import { getClassById } from "./classes";
import { AnimationController, ClipMap } from "./animationController";
import { Spell } from "./types";

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
  moveState = { moving: false, backwards: false };
  isInCombat: boolean = false;

  mixer?: AnimationMixer;
  actions: { [name: string]: AnimationAction } = {};
  animController?: AnimationController;

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

    this.loadModel();

    this.raycaster = new THREE.Raycaster();

    window.addEventListener("click", () => this.attack());
  }

  protected loadModel() {
    const loader = new GLTFLoader();
    const modelPath = this.getModelPath();
    loader.load(
      modelPath,
      (gltf: GLTF) => {
        gltf.scene.traverse((child: THREE.Object3D) => {
          if ((child as THREE.Mesh).isMesh) {
            (child as THREE.Mesh).castShadow = true;
            (child as THREE.Mesh).receiveShadow = true;
          }
        });
        gltf.scene.rotation.y = this.getModelRotationY();
        this.mesh.clear();
        const scale = this.getModelScale();
        gltf.scene.scale.set(scale, scale, scale);
        gltf.scene.position.y = -1;
        this.mesh.add(gltf.scene);
        this.mesh.scale.set(1, 1, 1);
        this.mesh.position.y = 1;

        if (gltf.animations && gltf.animations.length > 0) {
          this.mixer = new AnimationMixer(gltf.scene);
          for (const clip of gltf.animations) {
            const action = this.mixer.clipAction(clip);
            action.enabled = true;
            action.clampWhenFinished = false;
            if (clip.name.toLowerCase().includes("jump")) {
              action.loop = LoopOnce;
            }
            this.actions[clip.name] = action;
          }
          this.animController = new AnimationController(this.actions, this.getClipMap());
          this.animController.setState({ moving: false, backwards: false, airborne: false, attacking: false });
        }
      }
    );
  }

  protected getModelPath() {
    return "/characters/guard_knight/scene.gltf";
  }

  protected getModelScale() {
    return 0.01;
  }

  protected getModelRotationY() {
    return Math.PI;
  }

  protected getClipMap(): ClipMap {
    const names = Object.keys(this.actions || {});
    const find = (subs: string[]) =>
      names.find(n => subs.some(s => n.toLowerCase().includes(s.toLowerCase())));
    const attack = names.filter(n => /(attack|slash|impact|hit|kick)/i.test(n));
    return {
      idle: find(["idle"]),
      run: find(["run"]),
      runBack: find(["run(back)"]),
      jump: find(["jump"]),
      attack: attack.length ? attack : undefined,
    };
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
    const backwards = keys.has("s") && !keys.has("w");
    if (keys.has("s")) moveDir.add(forward.clone().negate());
    const moving = moveDir.lengthSq() > 0;
    if (moving) {
      const speedMult = backwards ? 0.5 : 1;
      moveDir.normalize().multiplyScalar(this.speed * speedMult);
      this.mesh.position.add(moveDir);
    }

    const rotSpeed = 0.06;
    if (keys.has("a")) this.mesh.rotation.y += rotSpeed;
    if (keys.has("d")) this.mesh.rotation.y -= rotSpeed;

    this.setMovementState(moving, backwards);
  }

  takeDamage(amount: number) {
    this.hp = Math.max(this.hp - amount, 0);
    const event = new CustomEvent("playerDamage", { detail: { amount } });
    window.dispatchEvent(event);
    this.onTakeDamage(amount);
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
    if (this.animController) this.animController.playAttack();
    this.updateAnimationState();

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
      this.attackProgress += delta * 5;
      if (this.attackProgress > Math.PI) {
        this.isAttacking = false;
        this.attackProgress = 0;
      }
    }
    this.updateAnimationState();
  }

  jump() {
    if (this.isOnGround) {
      this.velocityY = 0.32;
      this.isOnGround = false;
      this.updateAnimationState();
      this.onJump();
    }
  }

  setMovementState(moving: boolean, backwards: boolean) {
    this.moveState.moving = moving;
    this.moveState.backwards = backwards;
    this.updateAnimationState();
  }

  protected updateAnimationState() {
    if (!this.animController) return;
    if (this.isAttacking) {
      // Attack clip already triggered separately; avoid cycling through attacks mid-swing
      return;
    }
    this.animController.setState({
      moving: this.moveState.moving,
      backwards: this.moveState.backwards,
      airborne: !this.isOnGround,
      attacking: this.isAttacking,
    });
  }

  // Hook for subclasses to react to spell casts
  onSpellCast(spell: Spell, context: { inCombat: boolean }) {
    // default: no-op
  }

  onSpellImpact(spell: Spell, ctx: { target?: any; damage?: number }) {
    // default: no-op
  }

  onEnterCombat() {
    this.isInCombat = true;
  }

  onLeaveCombat() {
    this.isInCombat = false;
  }

  onMoveStart(direction: THREE.Vector3) {
    // default: no-op
  }

  onMoveStop() {
    // default: no-op
  }

  onJump() {
    // default: no-op
  }

  onTakeDamage(amount: number, source?: any) {
    // default: no-op
  }

  onDealDamage(amount: number, target?: any, spell?: Spell) {
    // default: no-op
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





