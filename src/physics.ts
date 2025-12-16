import { AmmoPhysics, PhysicsLoader } from "@enable3d/ammo-physics";
import * as THREE from "three";

/**
 * Load Ammo WASM and create a physics instance bound to the provided scene.
 * Remember to host ammo.wasm / ammo.js under /public/lib or adjust the base path.
 */
export async function createPhysics(scene: THREE.Scene, gravity: THREE.Vector3 = new THREE.Vector3(0, -9.81, 0)) {
  await new Promise<void>((resolve, reject) => {
    try {
      PhysicsLoader("/lib", () => resolve()); // expects /public/lib/ammo.wasm + ammo.js
    } catch (err) {
      reject(err);
    }
  });
  const physics = new AmmoPhysics(scene, { gravity: { x: gravity.x, y: gravity.y, z: gravity.z } });
  // Enable debug overlay by uncommenting:
  // physics.debug?.enable();
  return physics;
}

/**
 * Convenience helper to add a static ground plane.
 */
export function addGround(
  physics: AmmoPhysics,
  scene: THREE.Scene,
  size: number = 200,
  color: number = 0x444444
) {
  const ground = new THREE.Mesh(
    new THREE.BoxGeometry(size, 2, size),
    new THREE.MeshLambertMaterial({ color })
  );
  ground.position.y = -1;
  ground.receiveShadow = true;
  scene.add(ground);
  physics.add.existing(ground, { mass: 0 });
  return ground;
}

/**
 * Quick dynamic box spawn for smoke-testing physics via add.existing.
 */
export function addTestBox(
  physics: AmmoPhysics,
  scene: THREE.Scene,
  position: THREE.Vector3 = new THREE.Vector3(0, 5, 0),
  color: THREE.ColorRepresentation = "hotpink"
) {
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshLambertMaterial({ color })
  );
  box.position.copy(position);
  box.castShadow = true;
  box.receiveShadow = true;
  scene.add(box);
  physics.add.existing(box, { mass: 1 });
  return box;
}

/**
 * Spawn a physics-enabled crate using the Enable3D factory API,
 * matching the examples from https://enable3d.io/docs.html.
 */
export function addFactoryCrate(
  physics: AmmoPhysics,
  scene: THREE.Scene,
  position: THREE.Vector3 = new THREE.Vector3(0, 6, 0)
) {
  const { factory } = physics;
  const crate = factory.add.box(
    {
      x: position.x,
      y: position.y,
      z: position.z,
      width: 1,
      height: 1,
      depth: 1,
      mass: 2,
    },
    { lambert: { color: 0xde8f4f } }
  );
  crate.castShadow = true;
  crate.receiveShadow = true;
  scene.add(crate);
  return crate;
}
