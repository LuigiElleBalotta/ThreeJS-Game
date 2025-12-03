import { Spell } from "../types";

export const arcaneBolt: Spell = {
  id: "arcane_bolt",
  name: "Arcane Bolt",
  icon: "",
  description: "Fire a shard of arcane energy.",
  classTags: ["mage"],
  kind: "ranged",
  school: "arcane",
  cost: 25,
  cooldown: 2000,
  range: 12,
  damageMult: 1.1,
  critChance: 0.15,
  execute: ({ player, target }) => {
    if (!target) return 0;
    const isCrit = Math.random() < 0.15;
    const dmg = Math.round(player.attackDamage * 1.1 * (isCrit ? 2 : 1));
    target.takeDamage(dmg);
    return dmg;
  },
};
