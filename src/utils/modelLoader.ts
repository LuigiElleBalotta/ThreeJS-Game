import * as THREE from "three";

export type LoadedModel = {
  scene: THREE.Object3D;
  animations: THREE.AnimationClip[];
};

export async function loadModelByPath(path: string): Promise<LoadedModel | null> {
  const ext = path.split(".").pop()?.toLowerCase();
  const url = encodeURI(path);

  if (ext === "glb" || ext === "gltf") {
    const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader");
    const gltfLoader = new GLTFLoader();
    return new Promise<LoadedModel | null>((resolve) => {
      gltfLoader.load(
        url,
        (gltf: any) => resolve({ scene: gltf.scene, animations: gltf.animations ?? [] }),
        undefined,
        (err) => {
          console.error("Failed loading GLTF", url, err);
          resolve(null);
        },
      );
    });
  }

  if (ext === "fbx") {
    const { FBXLoader } = await import("three/examples/jsm/loaders/FBXLoader");
    const fbxLoader = new FBXLoader();
    return new Promise<LoadedModel | null>((resolve) => {
      fbxLoader.load(
        url,
        (group: any) => resolve({ scene: group, animations: group.animations ?? [] }),
        undefined,
        (err) => {
          console.error("Failed loading FBX", url, err);
          resolve(null);
        },
      );
    });
  }

  if (ext === "obj") {
    const { OBJLoader } = await import("three/examples/jsm/loaders/OBJLoader");
    const { MTLLoader } = await import("three/examples/jsm/loaders/MTLLoader");
    const objLoader = new OBJLoader();
    const mtlLoader = new MTLLoader();
    const mtlUrl = `${url.slice(0, -4)}.mtl`;

    return new Promise<LoadedModel | null>((resolve) => {
      mtlLoader.load(
        mtlUrl,
        (materials) => {
          materials.preload();
          objLoader.setMaterials(materials);
          objLoader.load(
            url,
            (obj) => resolve({ scene: obj, animations: [] }),
            undefined,
            (err) => {
              console.error("Failed loading OBJ", url, err);
              resolve(null);
            },
          );
        },
        undefined,
        () => {
          objLoader.load(
            url,
            (obj) => resolve({ scene: obj, animations: [] }),
            undefined,
            (err) => {
              console.error("Failed loading OBJ", url, err);
              resolve(null);
            },
          );
        },
      );
    });
  }

  console.warn("No loader registered for model extension", ext, path);
  return null;
}

export function mergeAnimationClips(...clipGroups: THREE.AnimationClip[][]): THREE.AnimationClip[] {
  const byName = new Map<string, THREE.AnimationClip>();
  for (const group of clipGroups) {
    for (const clip of group) {
      if (!clip?.name) continue;
      if (!byName.has(clip.name)) {
        byName.set(clip.name, clip);
      }
    }
  }
  return Array.from(byName.values());
}
