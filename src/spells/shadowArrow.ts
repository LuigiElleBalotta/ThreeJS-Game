import { Spell } from "../types";

export const shadowArrow: Spell = {
  id: "shadow_arrow",
  name: "Shadow Arrow",
  icon: "",
  description: "Dark ranged shot that strikes instantly.",
  classTags: ["ranger"],
  kind: "ranged",
  school: "shadow",
  cost: 30,
  cooldown: 2600,
  range: 18,
  projectileColor: 0x7e4bff,
  damageMult: 1.25,
  critChance: 0.18,
  execute: ({ player, target }) => {
    if (!target) return 0;
    const isCrit = Math.random() < 0.18;
    const dmg = Math.round(player.attackDamage * 1.25 * (isCrit ? 2 : 1));
    target.takeDamage(dmg);
    return dmg;
  },
};
