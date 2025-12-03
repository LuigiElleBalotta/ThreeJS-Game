import { Talent } from "../types";

export const TALENT_REGISTRY: Record<string, Talent> = {
  arcane_focus: {
    id: "arcane_focus",
    name: "Arcane Focus",
    description: "Increases Arcane Bolt damage by 10%.",
    classTags: ["mage"],
    apply: ({ player }) => {
      player.attackDamage = Math.round(player.attackDamage * 1.1);
    },
  },
  warrior_toughness: {
    id: "warrior_toughness",
    name: "Toughness",
    description: "Increase max HP by 15.",
    classTags: ["warrior"],
    apply: ({ player }) => {
      player.maxHp += 15;
      player.hp = player.maxHp;
    },
  },
  rogue_precision: {
    id: "rogue_precision",
    name: "Precision",
    description: "Increase crit chance for rogue attacks.",
    classTags: ["rogue"],
    apply: ({ player }) => {
      player.attackDamage = Math.round(player.attackDamage * 1.05);
    },
  },
};

export function getTalentsForClass(classId: string) {
  return Object.values(TALENT_REGISTRY).filter((t) => t.classTags.includes(classId));
}
