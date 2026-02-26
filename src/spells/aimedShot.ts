import { Spell } from "../types";

export const aimedShot: Spell = {
  id: "aimed_shot",
  name: "Aimed Shot",
  icon: "",
  description: "Powerful ranged shot with a short wind-up.",
  classTags: ["ranger"],
  kind: "ranged",
  school: "physical",
  cost: 25,
  cooldown: 2200,
  range: 20,
  castTime: 900,
  projectileColor: 0x8ed1ff,
  damageMult: 1.55,
  critChance: 0.2,
  execute: ({ player, target }) => {
    if (!target) return 0;
    const isCrit = Math.random() < 0.2;
    const dmg = Math.round(player.attackDamage * 1.55 * (isCrit ? 2 : 1));
    target.takeDamage(dmg);
    return dmg;
  },
};
