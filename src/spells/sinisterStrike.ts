import { Spell } from "../types";

export const sinisterStrike: Spell = {
  id: "sinister_strike",
  name: "Sinister Strike",
  icon: "",
  description: "Quick strike that can crit often.",
  classTags: ["rogue"],
  kind: "melee",
  school: "physical",
  cost: 0,
  cooldown: 900,
  range: 3.5,
  damageMult: 0.9,
  critChance: 0.2,
  execute: ({ player, target }) => {
    if (!target) return 0;
    const isCrit = Math.random() < 0.2;
    const dmg = Math.round(player.attackDamage * 0.9 * (isCrit ? 2 : 1));
    target.takeDamage(dmg);
    return dmg;
  },
};
