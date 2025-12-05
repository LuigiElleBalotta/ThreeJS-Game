import { CharacterClass } from "./types";

export const CHARACTER_CLASSES: CharacterClass[] = [
  {
    id: "warrior",
    name: "Warrior",
    baseStats: { hp: 140, mana: 60, attackDamage: 22 },
    starterSpells: ["heroic_strike", "shield_block", "charge"],
  },
  {
    id: "mage",
    name: "Mage",
    baseStats: { hp: 90, mana: 160, attackDamage: 15 },
    starterSpells: ["arcane_bolt", "fire_blast", "firebolt"],
  },
  {
    id: "rogue",
    name: "Rogue",
    baseStats: { hp: 110, mana: 80, attackDamage: 20 },
    starterSpells: ["sinister_strike", "backstab"],
  },
];

export function getClassById(id: string) {
  return CHARACTER_CLASSES.find((c) => c.id === id);
}
