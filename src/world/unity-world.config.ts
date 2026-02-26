export interface UnityWorldModelConfig {
  id: string;
  path: string;
  scale: number;
  position: { x: number; y: number; z: number };
  rotationY?: number;
}

export const UNITY_WORLD_MODELS: UnityWorldModelConfig[] = [
  {
    id: "orgrimmar-core",
    path: "/unity-import/Extracted/world/wmo/kalimdor/ogrimmar/orgrimmar2.obj",
    scale: 1,
    position: { x: 0, y: 0, z: 0 },
    rotationY: 0,
  },
  {
    id: "orgrimmar-frontgate",
    path: "/unity-import/Extracted/world/wmo/kalimdor/ogrimmar/orgrimmar2frontgate.obj",
    scale: 1,
    position: { x: 0, y: 0, z: 0 },
    rotationY: 0,
  },
];
