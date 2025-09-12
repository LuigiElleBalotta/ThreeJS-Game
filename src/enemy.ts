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
  alive: boolean = true;
  attackRange: number = 1.5;
  damage: number = 5;
  cooldown: number = 1000;
  lastAttack: number = 0;

  mixer?: THREE.AnimationMixer;
  actions: { [name: string]: THREE.AnimationAction } = {};

  constructor(x: number, z: number, prefab?: any) {
    this.mesh = new THREE.Group();
    this.mesh.position.set(x, 1, z);

    if (prefab) {
      // Use local clone util for proper skinning/animation support
      const zombie = clone(prefab.scene);
      zombie.traverse((child: THREE.Object3D) => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).castShadow = true;
          (child as THREE.Mesh).receiveShadow = true;
        }
      });
      zombie.scale.set(0.01, 0.01, 0.01);
      zombie.position.set(0, -1, 0);
      this.mesh.clear();
      this.mesh.add(zombie);
    }

    this.speed = 0.03 + Math.random() * 0.02; // velocità leggermente variabile
  }

  isAlive() {
    return this.alive;
  }

  takeDamage(amount: number) {
    if (!this.alive) return;
    this.hp = Math.max(this.hp - amount, 0);
    if (this.hp <= 0) this.alive = false;
  }

  update(player: Player) {
    if (this.mixer) {
      this.mixer.update(1 / 60);
    }

    if (!this.alive) {
      // caduta mesh
      this.mesh.position.y -= 0.02;
      return;
    }

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
          this.lastAttack = now;
        }
      }
    }
  }
}
