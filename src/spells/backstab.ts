import { Spell } from "../types";

export const backstab: Spell = {
  id: "backstab",
  name: "Backstab",
  icon: "",
  description: "A vicious strike with higher crits.",
  classTags: ["rogue"],
  kind: "melee",
  school: "physical",
  cost: 0,
  cooldown: 1200,
  range: 3.5,
  damageMult: 1.1,
  critChance: 0.25,
  execute: ({ player, target }) => {
    if (!target) return 0;
    const isCrit = Math.random() < 0.25;
    const dmg = Math.round(player.attackDamage * 1.1 * (isCrit ? 2.2 : 1));
    target.takeDamage(dmg);
    return dmg;
  },
};
