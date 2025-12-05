import * as THREE from "three";
import { Player } from "./player";

export class ThirdPersonCamera {
  camera: THREE.PerspectiveCamera;
  target: Player;

  // Offset della camera rispetto al player
  offset: THREE.Vector3 = new THREE.Vector3(0, 5, 10);
  rotation: { x: number; y: number } = { x: 0, y: 0 };
  distance: number = 10;
  allowFreeRotation: boolean = false;
  private leftHoldTimeout: number | null = null;

  constructor(camera: THREE.PerspectiveCamera, player: Player) {
    this.camera = camera;
    this.target = player;

    // Eventi mouse
    window.addEventListener("mousemove", (e) => this.onMouseMove(e));
    window.addEventListener("wheel", (e) => this.onWheel(e));
    window.addEventListener("mousedown", (e) => this.onMouseDown(e));
    window.addEventListener("mouseup", (e) => this.onMouseUp(e));
  }

  onMouseMove(event: MouseEvent) {
    // Ruota con tasto destro (WoW style) o con sinistro se allowFreeRotation
    if (
      event.buttons === 2 ||
      event.buttons === 3 ||
      (event.buttons === 1 && this.allowFreeRotation)
    ) {
      this.rotation.y -= event.movementX * 0.005;
      this.rotation.x -= event.movementY * 0.005;
      this.rotation.x = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, this.rotation.x));
    }
  }

  onMouseDown(event: MouseEvent) {
    if (event.button === 0) {
      // Start a long-press timer to enable free camera without affecting movement
      if (this.leftHoldTimeout) window.clearTimeout(this.leftHoldTimeout);
      this.leftHoldTimeout = window.setTimeout(() => {
        this.allowFreeRotation = true;
      }, 160);
    }
  }

  onMouseUp(event: MouseEvent) {
    if (event.button === 0) {
      if (this.leftHoldTimeout) window.clearTimeout(this.leftHoldTimeout);
      this.leftHoldTimeout = null;
      this.allowFreeRotation = false;
    }
  }

  onWheel(event: WheelEvent) {
    this.distance += event.deltaY * 0.01;
    // Nessun limite di zoom out
  }

  update() {
    const offset = new THREE.Vector3(
      Math.sin(this.rotation.y) * this.distance,
      this.offset.y + Math.sin(this.rotation.x) * this.distance,
      Math.cos(this.rotation.y) * this.distance
    );

    const cameraPos = this.target.mesh.position.clone().add(offset);
    // Prevent camera from dipping under the ground plane
    cameraPos.y = Math.max(1, cameraPos.y);
    this.camera.position.copy(cameraPos);
    this.camera.lookAt(this.target.mesh.position);
  }
}
