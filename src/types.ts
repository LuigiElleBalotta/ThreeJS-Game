export type SpellSchool = "physical" | "arcane" | "fire" | "frost" | "shadow" | "nature" | "holy";
export type SpellKind = "melee" | "ranged" | "instant";

export interface SpellContext {
  player: any;
  game: any;
  target?: any;
}

export interface Spell {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  classTags: string[];
  kind: SpellKind;
  school: SpellSchool;
  cost: number;
  cooldown: number;
  range: number;
  damageMult: number;
  critChance: number;
  execute: (ctx: SpellContext) => number; // returns damage dealt (or 0 if none)
}

export interface Talent {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  classTags: string[];
  apply: (ctx: { player: any; game: any }) => void;
}

export interface Item {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  slot?: string;
  stats?: Partial<{ strength: number; agility: number; intellect: number; stamina: number; crit: number }>;
  use?: (ctx: { player: any; game: any }) => void;
  classTags?: string[];
}

export interface CharacterClass {
  id: string;
  name: string;
  baseStats: { hp: number; mana: number; attackDamage: number };
  starterSpells: string[];
}

export interface Character {
  id: string;
  name: string;
  classId: string;
  level: number;
  gold: number;
  inventory: Item[];
  equipment: Record<string, Item | null>;
}
