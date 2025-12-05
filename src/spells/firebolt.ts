import { Spell } from "../types";

export const firebolt: Spell = {
  id: "firebolt",
  name: "Firebolt",
  icon: "",
  description: "Hurl a bolt of fire after a short cast.",
  classTags: ["mage"],
  kind: "ranged",
  school: "fire",
  cost: 35,
  cooldown: 2000,
  range: 14,
  castTime: 1500,
  projectileColor: 0xff3c1b,
  damageMult: 1.35,
  critChance: 0.18,
  execute: ({ player, target }) => {
    if (!target) return 0;
    const isCrit = Math.random() < 0.18;
    const dmg = Math.round(player.attackDamage * 1.35 * (isCrit ? 2 : 1));
    target.takeDamage(dmg);
    return dmg;
  },
};
