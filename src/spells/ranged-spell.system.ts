import * as THREE from "three";

export interface RangedSpellTarget {
  mesh: THREE.Object3D;
  isAlive(): boolean;
  takeDamage(amount: number): void;
}

type RangedSpellOptions = {
  speed?: number;
  hitDistance?: number;
  targetOffsetY?: number;
};

export class RangedSpellProjectileSystem {
  mesh: THREE.Object3D;
  target: RangedSpellTarget;
  damage: number;
  speed: number;
  hitDistance: number;
  targetOffsetY: number;

  constructor(mesh: THREE.Object3D, target: RangedSpellTarget, damage: number, options: RangedSpellOptions = {}) {
    this.mesh = mesh;
    this.target = target;
    this.damage = damage;
    this.speed = options.speed ?? 18;
    this.hitDistance = options.hitDistance ?? 2;
    this.targetOffsetY = options.targetOffsetY ?? 1;
  }

  update(delta: number) {
    if (!this.target || !this.target.isAlive()) return false;

    const targetPosition = this.target.mesh.position.clone();
    targetPosition.y += this.targetOffsetY;
    this.mesh.lookAt(targetPosition);

    const distance = this.mesh.position.distanceTo(targetPosition);
    if (distance > this.hitDistance) {
      const step = this.speed * delta;
      this.mesh.translateZ(step);
      return true;
    }

    this.target.takeDamage(this.damage);
    return false;
  }
}
