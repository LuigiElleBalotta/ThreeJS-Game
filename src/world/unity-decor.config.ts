export interface UnityDecorationConfig {
  id: string;
  path: string;
  animationSources?: string[];
  previewImage?: string;
  position: { x: number; y: number; z: number };
  rotationY?: number;
  scale?: number;
  targetHeight?: number;
  placeOnGround?: boolean;
  yOffset?: number;
  collider?: boolean;
  preferredAnimationKeywords?: string[];
  defaultSpawn?: boolean;
  light?: {
    color: number;
    intensity: number;
    distance: number;
    yOffset?: number;
  };
}

// Placement is intentionally clustered around the playable spawn/village area.
// Scaling uses targetHeight to normalize mixed-source FBX sizes.
export const UNITY_WORLD_DECORATIONS: UnityDecorationConfig[] = [
  {
    id: "village-bonfire-center",
    path: "/unity-import/Game/Models/MapMisc/Fires/OrgrimmarBonfire/OrgrimmarBonfire.fbx",
    animationSources: [
      "/unity-import/Game/Models/MapMisc/Fires/OrgrimmarBonfire/OrgrimmarBonfire_Animations/OrgrimmarBonfire_Stand_0.fbx",
    ],
    previewImage: "/unity-import/Game/Models/MapMisc/Fires/OrgrimmarBonfire/orgrimmarbonfirewood.png",
    preferredAnimationKeywords: ["stand"],
    position: { x: 10, y: 0, z: 6 },
    rotationY: 0,
    targetHeight: 2.2,
    placeOnGround: true,
    defaultSpawn: true,
    collider: false,
    light: { color: 0xffa24a, intensity: 1.2, distance: 18, yOffset: 1.7 },
  },
  {
    id: "village-bonfire-west",
    path: "/unity-import/Game/Models/MapMisc/Fires/OrgrimmarBonfire/OrgrimmarBonfire.fbx",
    animationSources: [
      "/unity-import/Game/Models/MapMisc/Fires/OrgrimmarBonfire/OrgrimmarBonfire_Animations/OrgrimmarBonfire_Stand_0.fbx",
    ],
    previewImage: "/unity-import/Game/Models/MapMisc/Fires/OrgrimmarBonfire/orgrimmarbonfirewood.png",
    preferredAnimationKeywords: ["stand"],
    position: { x: -6, y: 0, z: 12 },
    rotationY: Math.PI * 0.25,
    targetHeight: 2.2,
    placeOnGround: true,
    defaultSpawn: true,
    collider: false,
    light: { color: 0xff9a3d, intensity: 1.0, distance: 16, yOffset: 1.7 },
  },
  {
    id: "village-brazier-east",
    path: "/unity-import/Game/Models/MapMisc/Fires/OrgrimmarBrazier_Raid/OrgrimmarBrazier_Raid.fbx",
    animationSources: [
      "/unity-import/Game/Models/MapMisc/Fires/OrgrimmarBrazier_Raid/OrgrimmarBrazier_Raid_Animations/OrgrimmarBrazier_Raid_Stand_0.fbx",
    ],
    previewImage: "/unity-import/Game/Models/MapMisc/Fires/OrgrimmarBrazier_Raid/ograid_chandelier_02.png",
    preferredAnimationKeywords: ["stand"],
    position: { x: 22, y: 0, z: 12 },
    rotationY: 0,
    targetHeight: 3.4,
    placeOnGround: true,
    defaultSpawn: true,
    collider: false,
    light: { color: 0xffa95a, intensity: 0.9, distance: 14, yOffset: 2.4 },
  },
  {
    id: "village-brazier-south",
    path: "/unity-import/Game/Models/MapMisc/Fires/OrgrimmarBrazier_Raid/OrgrimmarBrazier_Raid.fbx",
    animationSources: [
      "/unity-import/Game/Models/MapMisc/Fires/OrgrimmarBrazier_Raid/OrgrimmarBrazier_Raid_Animations/OrgrimmarBrazier_Raid_Stand_0.fbx",
    ],
    previewImage: "/unity-import/Game/Models/MapMisc/Fires/OrgrimmarBrazier_Raid/ograid_chandelier_02.png",
    preferredAnimationKeywords: ["stand"],
    position: { x: 4, y: 0, z: -10 },
    rotationY: Math.PI * 0.5,
    targetHeight: 3.4,
    placeOnGround: true,
    defaultSpawn: false,
    collider: false,
    light: { color: 0xff9f4c, intensity: 0.85, distance: 14, yOffset: 2.4 },
  },
  {
    id: "camp-undead-fire",
    path: "/unity-import/Game/Models/MapMisc/UndeadCampFire/undeadcampfire.fbx",
    animationSources: [
      "/unity-import/Game/Models/MapMisc/UndeadCampFire/undeadcampfire_Animations/undeadcampfire_Stand_0.fbx",
    ],
    previewImage: "/unity-import/Resources/Exported/spells/fire_bright_mod2x_a.png",
    preferredAnimationKeywords: ["stand"],
    position: { x: -24, y: 0, z: 20 },
    rotationY: Math.PI * 0.15,
    targetHeight: 1.9,
    placeOnGround: true,
    defaultSpawn: false,
    collider: false,
    light: { color: 0xff8d2f, intensity: 0.95, distance: 15, yOffset: 1.5 },
  },
  {
    id: "camp-tent-1",
    path: "/unity-import/Game/Models/MapMisc/Tent/NathanosTent/NathanosTent.fbx",
    animationSources: [
      "/unity-import/Game/Models/MapMisc/Tent/NathanosTent/NathanosTent_Animations/NathanosTent_Stand_0.fbx",
    ],
    previewImage: "/unity-import/Game/Models/MapMisc/Tent/NathanosTent/8fk_forsaken_nathanostent01_0_2471034.png",
    preferredAnimationKeywords: ["stand"],
    position: { x: 28, y: 0, z: 20 },
    rotationY: -Math.PI * 0.35,
    targetHeight: 5.6,
    placeOnGround: true,
    defaultSpawn: false,
    collider: true,
  },
  {
    id: "camp-tent-2",
    path: "/unity-import/Game/Models/MapMisc/Tent/NathanosTent/NathanosTent.fbx",
    animationSources: [
      "/unity-import/Game/Models/MapMisc/Tent/NathanosTent/NathanosTent_Animations/NathanosTent_Stand_0.fbx",
    ],
    previewImage: "/unity-import/Game/Models/MapMisc/Tent/NathanosTent/8fk_forsaken_nathanostent01_5_2471037.png",
    preferredAnimationKeywords: ["stand"],
    position: { x: 34, y: 0, z: 26 },
    rotationY: Math.PI * 0.2,
    targetHeight: 5.6,
    placeOnGround: true,
    defaultSpawn: false,
    collider: true,
  },
  {
    id: "portal-ritual",
    path: "/unity-import/Realistic Effects Pack/Other/Portal/PortalModel.FBX",
    previewImage: "/unity-import/Realistic Effects Pack/Materials/Environment/Portals/Portal2/riftFull8x8.png",
    position: { x: -18, y: 0, z: -18 },
    rotationY: Math.PI * 0.5,
    targetHeight: 4.2,
    placeOnGround: true,
    defaultSpawn: false,
    collider: false,
    light: { color: 0x5ea2ff, intensity: 0.95, distance: 16, yOffset: 1.8 },
  },
  {
    id: "elevator-plaza-east",
    path: "/unity-import/Game/Models/MapMisc/Elevators/OrgrimmarElevator1/OrgrimmarElevator1.fbx",
    animationSources: [
      "/unity-import/Game/Models/MapMisc/Elevators/OrgrimmarElevator1/OrgrimmarElevator1_Animations/OrgrimmarElevator1_ShipStart_0.fbx",
      "/unity-import/Game/Models/MapMisc/Elevators/OrgrimmarElevator1/OrgrimmarElevator1_Animations/OrgrimmarElevator1_ShipMoving_1.fbx",
      "/unity-import/Game/Models/MapMisc/Elevators/OrgrimmarElevator1/OrgrimmarElevator1_Animations/OrgrimmarElevator1_ShipStop_2.fbx",
      "/unity-import/Game/Models/MapMisc/Elevators/OrgrimmarElevator1/OrgrimmarElevator1_Animations/OrgrimmarElevator1_Stand_3.fbx",
    ],
    previewImage: "/unity-import/Game/Textures/Dark_green.png",
    preferredAnimationKeywords: ["shipmoving", "moving", "stand"],
    position: { x: 40, y: 0, z: 8 },
    rotationY: Math.PI,
    targetHeight: 8.5,
    placeOnGround: true,
    defaultSpawn: false,
    collider: true,
  },
  {
    id: "elevator-plaza-north",
    path: "/unity-import/Game/Models/MapMisc/Elevators/OrgrimmarElevator2/OrgrimmarElevator1.fbx",
    animationSources: [
      "/unity-import/Game/Models/MapMisc/Elevators/OrgrimmarElevator2/OrgrimmarElevator1_Animations/OrgrimmarElevator1_ShipStart_0.fbx",
      "/unity-import/Game/Models/MapMisc/Elevators/OrgrimmarElevator2/OrgrimmarElevator1_Animations/OrgrimmarElevator1_ShipMoving_1.fbx",
      "/unity-import/Game/Models/MapMisc/Elevators/OrgrimmarElevator2/OrgrimmarElevator1_Animations/OrgrimmarElevator1_ShipStop_2.fbx",
      "/unity-import/Game/Models/MapMisc/Elevators/OrgrimmarElevator2/OrgrimmarElevator1_Animations/OrgrimmarElevator1_Stand_3.fbx",
    ],
    previewImage: "/unity-import/Game/Textures/black.png",
    preferredAnimationKeywords: ["shipmoving", "moving", "stand"],
    position: { x: -34, y: 0, z: 30 },
    rotationY: Math.PI * 0.5,
    targetHeight: 8.5,
    placeOnGround: true,
    defaultSpawn: false,
    collider: true,
  },
];

export const UNITY_DECOR_BY_ID: Record<string, UnityDecorationConfig> = UNITY_WORLD_DECORATIONS.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<string, UnityDecorationConfig>,
);
