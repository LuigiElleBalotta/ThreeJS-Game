import * as THREE from "three";
import { Enemy } from "./enemy";

export class HealthBarAbove {
  enemy: Enemy;
  camera: THREE.PerspectiveCamera;
  domElement: HTMLDivElement;
  barElement: HTMLDivElement;
  offsetY: number = 3.5;

  constructor(enemy: Enemy, camera: THREE.PerspectiveCamera) {
    this.enemy = enemy;
    this.camera = camera;

    this.domElement = document.createElement("div");
    this.domElement.className = "health-bar-above";
    this.barElement = document.createElement("div");
    this.barElement.className = "bar";
    this.domElement.appendChild(this.barElement);

    document.body.appendChild(this.domElement);
  }

  update() {
    if (!this.enemy.isAlive()) {
      this.domElement.style.display = "none";
      return;
    }

    const pos = this.enemy.mesh.position.clone();
    pos.y += this.offsetY;
    pos.project(this.camera);

    const x = (pos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-pos.y * 0.5 + 0.5) * window.innerHeight;

    this.domElement.style.transform = `translate(-50%, -100%) translate(${x}px,${y}px)`;

    const hpPercent = (this.enemy.hp / this.enemy.maxHp) * 100;
    this.barElement.style.width = `${hpPercent}%`;
  }

  destroy() {
    this.domElement.remove();
  }
}
