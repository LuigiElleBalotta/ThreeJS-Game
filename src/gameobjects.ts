import * as THREE from "three";

export type GameObjectGeometry =
  | { type: "box"; size: [number, number, number]; color?: string; position?: [number, number, number] }
  | { type: "cylinder"; radiusTop: number; radiusBottom: number; height: number; radialSegments?: number; color?: string; position?: [number, number, number] };

export interface GameObjectTemplate {
  id: string;
  name: string;
  model?: string;
  scale?: number;
  geometry?: GameObjectGeometry[];
}

export interface GameObjectSpawn {
  id: string;
  templateId: string;
  position: { x: number; y: number; z: number };
  orientation?: number;
}

export const gameObjectTemplates: Record<string, GameObjectTemplate> = {
  house_small: {
    id: "house_small",
    name: "Wooden House",
    geometry: [
      { type: "box", size: [6, 4, 6], color: "#7a5c3b", position: [0, 2, 0] },
      { type: "box", size: [6.5, 1, 6.5], color: "#3c2b1a", position: [0, 4.5, 0] },
    ],
  },
  house_large: {
    id: "house_large",
    name: "Large House",
    geometry: [
      { type: "box", size: [10, 5, 8], color: "#8d6b4a", position: [0, 2.5, 0] },
      { type: "box", size: [11, 1, 9], color: "#4a3320", position: [0, 5.5, 0] },
    ],
  },
  tower: {
    id: "tower",
    name: "Watch Tower",
    geometry: [
      { type: "cylinder", radiusTop: 2, radiusBottom: 2.5, height: 12, radialSegments: 12, color: "#5a5043", position: [0, 6, 0] },
      { type: "box", size: [6, 1, 6], color: "#3c3329", position: [0, 12.5, 0] },
    ],
  },
  lake: {
    id: "lake",
    name: "Lake",
    geometry: [
      { type: "box", size: [18, 0.5, 12], color: "#1a6d9b", position: [0, 0.25, 0] },
    ],
  },
  market_stall: {
    id: "market_stall",
    name: "Market Stall",
    model: "/environment/market_stall.glb",
    scale: 1,
  },
  castle_gate: {
    id: "castle_gate",
    name: "Castle Gate",
    model: "/environment/castle_gate.glb",
    scale: 1,
  },
  fantasy_house: {
    id: "fantasy_house",
    name: "Fantasy House",
    model: "/environment/buildings/Fantasy House.glb",
    scale: 8,
  },
  fantasy_inn: {
    id: "fantasy_inn",
    name: "Fantasy Inn",
    model: "/environment/buildings/Fantasy Inn.glb",
    scale: 7,
  },
  fantasy_stable: {
    id: "fantasy_stable",
    name: "Fantasy Stable",
    model: "/environment/buildings/Fantasy Stable.glb",
    scale: 7.5,
  },
  farm_house: {
    id: "farm_house",
    name: "Farm House",
    model: "/environment/buildings/Farm.glb",
    scale: 9,
  },
  bell_tower: {
    id: "bell_tower",
    name: "Bell Tower",
    model: "/environment/buildings/Bell Tower.glb",
    scale: 8,
  },
  watch_tower: {
    id: "watch_tower",
    name: "Watch Tower",
    model: "/environment/buildings/Watch Tower.glb",
    scale: 8,
  },
  wall_towers: {
    id: "wall_towers",
    name: "Wall Towers",
    model: "/environment/buildings/Stone Wall Towers.glb",
    scale: 9,
  },
  wall_gate: {
    id: "wall_gate",
    name: "Wall Gate",
    model: "/environment/buildings/Wall Towers Door Seco.glb",
    scale: 9,
  },
  business_building: {
    id: "business_building",
    name: "Business Building",
    model: "/environment/buildings/Business Building.glb",
    scale: 6,
  },
};

export const gameObjectSpawns: GameObjectSpawn[] = [
  // Village 1
  { id: "v1-inn", templateId: "fantasy_inn", position: { x: 12, y: 0, z: 16 }, orientation: Math.PI },
  { id: "v1-house-1", templateId: "fantasy_house", position: { x: 8, y: 0, z: 22 }, orientation: Math.PI / 3 },
  { id: "v1-house-2", templateId: "fantasy_house", position: { x: 16, y: 0, z: 24 }, orientation: -Math.PI / 4 },
  { id: "v1-stable", templateId: "fantasy_stable", position: { x: 18, y: 0, z: 12 }, orientation: Math.PI / 2 },
  { id: "v1-farm", templateId: "farm_house", position: { x: 24, y: 0, z: 18 }, orientation: -Math.PI / 2 },
  { id: "v1-stall", templateId: "market_stall", position: { x: 10, y: 0, z: 10 }, orientation: Math.PI / 4 },
  { id: "v1-bell", templateId: "bell_tower", position: { x: 6, y: 0, z: 8 }, orientation: 0 },
  { id: "v1-watch", templateId: "watch_tower", position: { x: 4, y: 0, z: 4 }, orientation: Math.PI / 2 },
  { id: "v1-lake", templateId: "lake", position: { x: 26, y: 0, z: 30 }, orientation: 0 },
  // Village 2
  { id: "v2-inn", templateId: "fantasy_inn", position: { x: -40, y: 0, z: 10 }, orientation: Math.PI / 2 },
  { id: "v2-house-1", templateId: "fantasy_house", position: { x: -46, y: 0, z: 16 }, orientation: Math.PI / 3 },
  { id: "v2-house-2", templateId: "fantasy_house", position: { x: -34, y: 0, z: 18 }, orientation: -Math.PI / 4 },
  { id: "v2-stable", templateId: "fantasy_stable", position: { x: -36, y: 0, z: 6 }, orientation: -Math.PI / 2 },
  { id: "v2-farm", templateId: "farm_house", position: { x: -30, y: 0, z: 14 }, orientation: Math.PI / 2 },
  { id: "v2-bell", templateId: "bell_tower", position: { x: -48, y: 0, z: 4 }, orientation: Math.PI / 2 },
  // Village 3
  { id: "v3-inn", templateId: "fantasy_inn", position: { x: 60, y: 0, z: -20 }, orientation: -Math.PI / 2 },
  { id: "v3-house-1", templateId: "fantasy_house", position: { x: 54, y: 0, z: -14 }, orientation: Math.PI / 2 },
  { id: "v3-house-2", templateId: "fantasy_house", position: { x: 66, y: 0, z: -18 }, orientation: Math.PI / 3 },
  { id: "v3-stable", templateId: "fantasy_stable", position: { x: 70, y: 0, z: -10 }, orientation: 0 },
  { id: "v3-farm", templateId: "farm_house", position: { x: 72, y: 0, z: -24 }, orientation: Math.PI / 2 },
  { id: "v3-watch", templateId: "watch_tower", position: { x: 58, y: 0, z: -30 }, orientation: Math.PI },
  // Village 4
  { id: "v4-inn", templateId: "fantasy_inn", position: { x: -70, y: 0, z: -40 }, orientation: Math.PI },
  { id: "v4-house-1", templateId: "fantasy_house", position: { x: -78, y: 0, z: -34 }, orientation: Math.PI / 4 },
  { id: "v4-house-2", templateId: "fantasy_house", position: { x: -64, y: 0, z: -36 }, orientation: -Math.PI / 6 },
  { id: "v4-stable", templateId: "fantasy_stable", position: { x: -68, y: 0, z: -48 }, orientation: Math.PI / 2 },
  { id: "v4-farm", templateId: "farm_house", position: { x: -60, y: 0, z: -44 }, orientation: -Math.PI / 2 },
  { id: "v4-bell", templateId: "bell_tower", position: { x: -80, y: 0, z: -48 }, orientation: 0 },
  // Village 5
  { id: "v5-inn", templateId: "fantasy_inn", position: { x: 90, y: 0, z: 30 }, orientation: Math.PI / 2 },
  { id: "v5-house-1", templateId: "fantasy_house", position: { x: 84, y: 0, z: 36 }, orientation: Math.PI / 3 },
  { id: "v5-house-2", templateId: "fantasy_house", position: { x: 96, y: 0, z: 34 }, orientation: -Math.PI / 3 },
  { id: "v5-stable", templateId: "fantasy_stable", position: { x: 92, y: 0, z: 22 }, orientation: Math.PI },
  { id: "v5-farm", templateId: "farm_house", position: { x: 100, y: 0, z: 28 }, orientation: Math.PI / 2 },
  { id: "v5-watch", templateId: "watch_tower", position: { x: 88, y: 0, z: 18 }, orientation: -Math.PI / 2 },
  // Village 6
  { id: "v6-inn", templateId: "fantasy_inn", position: { x: -20, y: 0, z: 70 }, orientation: Math.PI },
  { id: "v6-house-1", templateId: "fantasy_house", position: { x: -26, y: 0, z: 76 }, orientation: Math.PI / 4 },
  { id: "v6-house-2", templateId: "fantasy_house", position: { x: -14, y: 0, z: 74 }, orientation: -Math.PI / 6 },
  { id: "v6-stable", templateId: "fantasy_stable", position: { x: -18, y: 0, z: 62 }, orientation: Math.PI / 2 },
  { id: "v6-farm", templateId: "farm_house", position: { x: -10, y: 0, z: 68 }, orientation: -Math.PI / 2 },
  // Village 7
  { id: "v7-inn", templateId: "fantasy_inn", position: { x: 40, y: 0, z: 80 }, orientation: -Math.PI / 2 },
  { id: "v7-house-1", templateId: "fantasy_house", position: { x: 34, y: 0, z: 86 }, orientation: Math.PI / 3 },
  { id: "v7-house-2", templateId: "fantasy_house", position: { x: 46, y: 0, z: 84 }, orientation: Math.PI / 2 },
  { id: "v7-stable", templateId: "fantasy_stable", position: { x: 42, y: 0, z: 72 }, orientation: 0 },
  { id: "v7-farm", templateId: "farm_house", position: { x: 50, y: 0, z: 78 }, orientation: Math.PI / 2 },
  // Village 8
  { id: "v8-inn", templateId: "fantasy_inn", position: { x: -90, y: 0, z: 50 }, orientation: Math.PI / 2 },
  { id: "v8-house-1", templateId: "fantasy_house", position: { x: -96, y: 0, z: 56 }, orientation: Math.PI / 3 },
  { id: "v8-house-2", templateId: "fantasy_house", position: { x: -84, y: 0, z: 54 }, orientation: -Math.PI / 3 },
  { id: "v8-stable", templateId: "fantasy_stable", position: { x: -88, y: 0, z: 42 }, orientation: Math.PI },
  { id: "v8-farm", templateId: "farm_house", position: { x: -80, y: 0, z: 48 }, orientation: Math.PI / 2 },
  // Village 9
  { id: "v9-inn", templateId: "fantasy_inn", position: { x: 0, y: 0, z: -80 }, orientation: 0 },
  { id: "v9-house-1", templateId: "fantasy_house", position: { x: -6, y: 0, z: -74 }, orientation: Math.PI / 4 },
  { id: "v9-house-2", templateId: "fantasy_house", position: { x: 10, y: 0, z: -76 }, orientation: -Math.PI / 4 },
  { id: "v9-stable", templateId: "fantasy_stable", position: { x: 4, y: 0, z: -88 }, orientation: Math.PI / 2 },
  { id: "v9-farm", templateId: "farm_house", position: { x: -8, y: 0, z: -90 }, orientation: -Math.PI / 2 },
  // Village 10
  { id: "v10-inn", templateId: "fantasy_inn", position: { x: 120, y: 0, z: -60 }, orientation: Math.PI / 2 },
  { id: "v10-house-1", templateId: "fantasy_house", position: { x: 114, y: 0, z: -54 }, orientation: Math.PI / 3 },
  { id: "v10-house-2", templateId: "fantasy_house", position: { x: 126, y: 0, z: -56 }, orientation: -Math.PI / 3 },
  { id: "v10-stable", templateId: "fantasy_stable", position: { x: 122, y: 0, z: -68 }, orientation: Math.PI },
  { id: "v10-farm", templateId: "farm_house", position: { x: 130, y: 0, z: -62 }, orientation: Math.PI / 2 },
];

export function buildGeometryGroup(geometry?: GameObjectGeometry[]): THREE.Group | null {
  if (!geometry) return null;
  const group = new THREE.Group();
  geometry.forEach(g => {
    let mesh: THREE.Mesh | null = null;
    if (g.type === "box") {
      mesh = new THREE.Mesh(
        new THREE.BoxGeometry(g.size[0], g.size[1], g.size[2]),
        new THREE.MeshStandardMaterial({ color: g.color || "#777" })
      );
    } else if (g.type === "cylinder") {
      mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(g.radiusTop, g.radiusBottom, g.height, g.radialSegments ?? 12),
        new THREE.MeshStandardMaterial({ color: g.color || "#777" })
      );
    }
    if (mesh) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      if (g.position) {
        mesh.position.set(g.position[0], g.position[1], g.position[2]);
      }
      group.add(mesh);
    }
  });
  return group;
}
