import { Spell } from "../types";

export const fireBlast: Spell = {
  id: "fire_blast",
  name: "Fire Blast",
  icon: "",
  description: "Short cast fiery blast.",
  classTags: ["mage"],
  kind: "ranged",
  school: "fire",
  cost: 30,
  cooldown: 2500,
  range: 12,
  damageMult: 1.2,
  critChance: 0.15,
  execute: ({ player, target }) => {
    if (!target) return 0;
    const isCrit = Math.random() < 0.15;
    const dmg = Math.round(player.attackDamage * 1.2 * (isCrit ? 2 : 1));
    target.takeDamage(dmg);
    return dmg;
  },
};
