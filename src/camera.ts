import * as THREE from "three";
import { Player } from "./player";

type CameraOptions = {
    getCollisionObjects?: () => THREE.Object3D[];
};

export class ThirdPersonCamera {
    camera: THREE.PerspectiveCamera;
    target: Player;

    // Unity WarcraftCamera-inspired defaults
    targetHeight = 1.7;
    deadTargetHeight = 0.5;
    offsetFromWall = 0.1;
    zoomRate = 0.0025;
    minDistance = 0.6;
    maxDistance = 20;

    offset: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
    rotation: { x: number; y: number } = { x: 0, y: 0 };
    distance: number = 10;
    desiredDistance: number = 10;
    allowFreeRotation: boolean = false;
    private leftHoldTimeout: number | null = null;
    private targetPosition: THREE.Vector3 = new THREE.Vector3();
    private raycaster: THREE.Raycaster = new THREE.Raycaster();
    private getCollisionObjects?: () => THREE.Object3D[];
    private currentTargetHeight: number = this.targetHeight;

    constructor(camera: THREE.PerspectiveCamera, player: Player, options?: CameraOptions) {
        this.camera = camera;
        this.target = player;
        this.getCollisionObjects = options?.getCollisionObjects;
        this.targetPosition.copy(this.target.mesh.position);

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
        if ((event.target as HTMLElement).tagName !== "CANVAS") return;
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
        this.desiredDistance += event.deltaY * this.zoomRate;
        this.desiredDistance = THREE.MathUtils.clamp(this.desiredDistance, this.minDistance, this.maxDistance);
    }

    update() {
        const desiredHeight = this.target.isAlive() ? this.targetHeight : this.deadTargetHeight;
        this.currentTargetHeight = THREE.MathUtils.lerp(this.currentTargetHeight, desiredHeight, 0.12);
        this.targetPosition.lerp(this.target.mesh.position, 0.15);
        this.distance = THREE.MathUtils.lerp(this.distance, this.desiredDistance, 0.18);

        const pivot = this.targetPosition.clone().add(new THREE.Vector3(0, this.currentTargetHeight, 0));
        const desiredPos = new THREE.Vector3(
            Math.sin(this.rotation.y) * this.distance,
            this.offset.y + Math.sin(this.rotation.x) * this.distance,
            Math.cos(this.rotation.y) * this.distance
        ).add(pivot);

        let cameraPos = desiredPos;
        const collisionObjects = this.getCollisionObjects?.() ?? [];
        if (collisionObjects.length > 0) {
            const dir = desiredPos.clone().sub(pivot);
            const maxDist = dir.length();
            if (maxDist > 0.0001) {
                this.raycaster.set(pivot, dir.normalize());
                this.raycaster.far = maxDist;
                const hits = this.raycaster.intersectObjects(collisionObjects, true);
                if (hits.length > 0) {
                    const safeDist = Math.max(this.minDistance, hits[0].distance - this.offsetFromWall);
                    cameraPos = pivot.clone().add(dir.multiplyScalar(safeDist));
                }
            }
        }

        cameraPos.y = Math.max(1, cameraPos.y);
        this.camera.position.copy(cameraPos);
        this.camera.lookAt(pivot);
    }
}
