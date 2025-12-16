export interface CreatureTemplate {
  id: string;
  name: string;
  model: string;
  hp: number;
  mana: number;
  exp: number;
  damage?: number;
  scale?: number;
  speed?: number;
  canFly?: boolean;
  gossipMenuId?: string;
  scriptId?: string;
  factionId?: string;
}

export interface CreatureSpawn {
  id: string;
  templateId: string;
  position: { x: number; y: number; z: number };
  isEnemy: boolean;
  orientation?: number; // radians, yaw
  respawnSec?: number;
  path?: { x: number; y: number; z: number; eventId?: string }[]; // waypoint patrol loop + optional script hook
  escortQuestId?: string; // if set, path is used only when escort quest starts
  rareChance?: number; // 0-1 chance to spawn as rare
  phase?: {
    requireCompleted?: string[];
    requireActive?: string[];
    hideIfCompleted?: string[];
    hideIfActive?: string[];
  };
}

export const creatureTemplates: Record<string, CreatureTemplate> = {
  villager_woman: {
    id: "villager_woman",
    name: "Anne the Villager",
    model: "/characters/npcs/Anne.glb",
    hp: 60,
    mana: 0,
    exp: 0,
    scale: 0.7,
    speed: 0.06,
    gossipMenuId: "villager_gossip",
    factionId: "village",
  },
  pirate_bandit: {
    id: "pirate_bandit",
    name: "Pirate Bandit",
    model: "/characters/npcs/Pirate Woman.glb",
    hp: 120,
    mana: 30,
    exp: 45,
    damage: 7,
    scale: 0.7,
    speed: 0.08,
    factionId: "bandits",
  },
  skeleton_raider: {
    id: "skeleton_raider",
    name: "Skeleton Raider",
    model: "/characters/npcs/Skeleton.glb",
    hp: 140,
    mana: 0,
    exp: 55,
    damage: 9,
    scale: 0.65,
    speed: 0.075,
    factionId: "undead",
  },
  evil_wizard: {
    id: "evil_wizard",
    name: "Evil Wizard",
    model: "/characters/npcs/Evil Wizard.glb",
    hp: 180,
    mana: 200,
    exp: 85,
    damage: 12,
    scale: 0.75,
    speed: 0.07,
    scriptId: "evil_wizard_ai",
    factionId: "cult",
  },
  town_wizard: {
    id: "town_wizard",
    name: "Arcane Scholar",
    model: "/characters/npcs/Animated Wizard.glb",
    hp: 150,
    mana: 250,
    exp: 0,
    scale: 0.75,
    speed: 0.065,
    gossipMenuId: "wizard_gossip",
    factionId: "village",
  },
  guard_robot: {
    id: "guard_robot",
    name: "Clockwork Guard",
    model: "/characters/npcs/Robot Enemy Large.glb",
    hp: 200,
    mana: 0,
    exp: 65,
    damage: 10,
    scale: 0.6,
    speed: 0.07,
    factionId: "village",
  },
  giant_wanderer: {
    id: "giant_wanderer",
    name: "Giant Wanderer",
    model: "/characters/npcs/Giant.glb",
    hp: 260,
    mana: 0,
    exp: 0,
    scale: 0.4,
    speed: 0.05,
  },
  colossus: {
    id: "colossus",
    name: "Ancient Colossus",
    model: "/characters/npcs/Colossus pre Tilt Brush.glb",
    hp: 400,
    mana: 0,
    exp: 150,
    scale: 0.1,
    damage: 14,
    speed: 0.045,
    factionId: "ancients",
  },
  zombie: {
    id: "zombie",
    name: "Wandering Zombie",
    model: "/characters/npcs/Zombie.glb",
    hp: 100,
    mana: 0,
    exp: 35,
    damage: 6,
    scale: 0.6,
    speed: 0.07,
    factionId: "undead",
  },
  escort_trader: {
    id: "escort_trader",
    name: "Caravan Trader",
    model: "/characters/npcs/Anne.glb",
    hp: 160,
    mana: 0,
    exp: 0,
    scale: 0.75,
    speed: 0.06,
    factionId: "village",
  },
};

export interface CreatureTemplateLootEntry {
  itemId: string;
  chance: number; // 0-1
  quantity?: number;
}

export interface CreatureTemplateLootTable {
  goldMultiplier?: number;
  items: CreatureTemplateLootEntry[];
}

export const creatureTemplateLoot: Record<string, CreatureTemplateLootTable> = {
  pirate_bandit: {
    goldMultiplier: 1.4,
    items: [
      { itemId: "rusty_sword", chance: 0.25 },
      { itemId: "training_shield", chance: 0.15 },
      { itemId: "minor_health_potion", chance: 0.35 },
    ],
  },
  skeleton_raider: {
    goldMultiplier: 1.2,
    items: [
      { itemId: "rusty_sword", chance: 0.22 },
      { itemId: "rogue_daggers", chance: 0.14 },
      { itemId: "minor_health_potion", chance: 0.28 },
    ],
  },
  evil_wizard: {
    goldMultiplier: 1.8,
    items: [
      { itemId: "apprentice_staff", chance: 0.2 },
      { itemId: "cloth_gloves", chance: 0.25 },
      { itemId: "minor_health_potion", chance: 0.4 },
      { itemId: "arcane_ring", chance: 0.05 },
    ],
  },
  guard_robot: {
    goldMultiplier: 1.5,
    items: [
      { itemId: "training_shield", chance: 0.2 },
      { itemId: "rusty_sword", chance: 0.2 },
      { itemId: "hunter_trinket", chance: 0.12 },
    ],
  },
  giant_wanderer: {
    goldMultiplier: 2,
    items: [
      { itemId: "training_shield", chance: 0.25 },
      { itemId: "rusty_sword", chance: 0.2 },
    ],
  },
  colossus: {
    goldMultiplier: 3,
    items: [
      { itemId: "training_shield", chance: 0.3 },
      { itemId: "rusty_sword", chance: 0.3 },
      { itemId: "minor_health_potion", chance: 0.4 },
    ],
  },
  zombie: {
    goldMultiplier: 1,
    items: [
      { itemId: "minor_health_potion", chance: 0.3 },
      { itemId: "rusty_sword", chance: 0.1 },
    ],
  },
};

export const creatureSpawns: CreatureSpawn[] = [
  { id: "village-anne", templateId: "villager_woman", position: { x: 12, y: 0, z: 14 }, isEnemy: false, orientation: Math.PI },
  { id: "village-wizard", templateId: "town_wizard", position: { x: 8, y: 0, z: 18 }, isEnemy: false, orientation: Math.PI / 2 },
  { id: "village-giant", templateId: "giant_wanderer", position: { x: 18, y: 0, z: 22 }, isEnemy: false, orientation: Math.PI / 2 },
  {
    id: "village-robot-guard",
    templateId: "guard_robot",
    position: { x: 6, y: 0, z: 10 },
    isEnemy: false,
    orientation: 0,
    path: [
      { x: 6, y: 0, z: 10, eventId: "guard_salute" },
      { x: 12, y: 0, z: 8 },
      { x: 12, y: 0, z: 16 },
      { x: 6, y: 0, z: 18, eventId: "guard_salute" },
      { x: 0, y: 0, z: 14 },
    ],
  },
  {
    id: "village-questgiver",
    templateId: "villager_woman",
    position: { x: 10, y: 0, z: 12 },
    isEnemy: false,
    orientation: -Math.PI / 2,
    path: [
      { x: 10, y: 0, z: 12 },
      { x: 12, y: 0, z: 12, eventId: "questgiver_wave" },
      { x: 12, y: 0, z: 14 },
      { x: 10, y: 0, z: 14, eventId: "questgiver_wave" },
    ],
  },
  {
    id: "bandit-1",
    templateId: "pirate_bandit",
    position: { x: -180, y: 0, z: 30 },
    isEnemy: true,
    orientation: Math.PI / 4,
    respawnSec: 30,
    rareChance: 0.12,
    path: [
      { x: -190, y: 0, z: 40 },
      { x: -175, y: 0, z: 25 },
      { x: -165, y: 0, z: 15 },
    ],
  },
  {
    id: "bandit-2",
    templateId: "pirate_bandit",
    position: { x: -195, y: 0, z: -20 },
    isEnemy: true,
    orientation: Math.PI / 3,
    respawnSec: 30,
    path: [
      { x: -205, y: 0, z: -10 },
      { x: -190, y: 0, z: -25 },
      { x: -180, y: 0, z: -35 },
    ],
  },
  {
    id: "skeleton-1",
    templateId: "skeleton_raider",
    position: { x: 210, y: 0, z: 60 },
    isEnemy: true,
    orientation: Math.PI / 2,
    respawnSec: 45,
    path: [
      { x: 220, y: 0, z: 70 },
      { x: 205, y: 0, z: 80 },
      { x: 195, y: 0, z: 65 },
    ],
  },
  {
    id: "evil-wizard-1",
    templateId: "evil_wizard",
    position: { x: 230, y: 0, z: -40 },
    isEnemy: true,
    orientation: Math.PI / 6,
    respawnSec: 60,
  },
  { id: "colossus-1", templateId: "colossus", position: { x: -220, y: 0, z: 90 }, isEnemy: true, orientation: 0, respawnSec: 120 },
  {
    id: "zombie-1",
    templateId: "zombie",
    position: { x: 160, y: 0, z: -120 },
    isEnemy: true,
    orientation: Math.PI / 2,
    respawnSec: 30,
    rareChance: 0.1,
    path: [
      { x: 155, y: 0, z: -110 },
      { x: 165, y: 0, z: -100 },
      { x: 175, y: 0, z: -110 },
    ],
  },
  {
    id: "zombie-2",
    templateId: "zombie",
    position: { x: 150, y: 0, z: -140 },
    isEnemy: true,
    orientation: -Math.PI / 3,
    respawnSec: 30,
    rareChance: 0.1,
    path: [
      { x: 145, y: 0, z: -150 },
      { x: 155, y: 0, z: -155 },
      { x: 165, y: 0, z: -145 },
    ],
  },
  {
    id: "zombie-3",
    templateId: "zombie",
    position: { x: 180, y: 0, z: -100 },
    isEnemy: true,
    orientation: Math.PI / 1.5,
    respawnSec: 30,
  },
  {
    id: "escort-trader-1",
    templateId: "escort_trader",
    position: { x: 14, y: 0, z: 8 },
    isEnemy: false,
    orientation: 0,
    escortQuestId: "ESCORT_TRADER",
    path: [
      { x: 14, y: 0, z: 8 },
      { x: 30, y: 0, z: 6 },
      { x: 46, y: 0, z: 4 },
      { x: 60, y: 0, z: 0 },
      { x: 78, y: 0, z: -6 },
      { x: 92, y: 0, z: -12 },
    ],
  },
  {
    id: "escort-ambush-1",
    templateId: "pirate_bandit",
    position: { x: 52, y: 0, z: -2 },
    isEnemy: true,
    orientation: Math.PI,
    respawnSec: 0,
    phase: { requireActive: ["ESCORT_TRADER"] },
  },
];
