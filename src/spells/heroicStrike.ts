import { Spell } from "../types";

export const heroicStrike: Spell = {
  id: "heroic_strike",
  name: "Heroic Strike",
  icon: "/spells/icons/ability_warrior_savageblow.jpg",
  description: "A solid melee swing with a chance to crit.",
  classTags: ["warrior"],
  kind: "melee",
  school: "physical",
  cost: 0,
  cooldown: 1000,
  range: 3.5,
  damageMult: 1.0,
  critChance: 0.1,
  execute: ({ player, target }) => {
    if (!target) return 0;
    const isCrit = Math.random() < 0.1;
    const dmg = Math.round(player.attackDamage * 1.0 * (isCrit ? 2 : 1));
    target.takeDamage(dmg);
    return dmg;
  },
};
