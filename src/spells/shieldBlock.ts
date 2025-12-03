import { Spell } from "../types";

export const shieldBlock: Spell = {
  id: "shield_block",
  name: "Shield Block",
  icon: "",
  description: "Raise your shield to mitigate the next hit.",
  classTags: ["warrior"],
  kind: "instant",
  school: "physical",
  cost: 0,
  cooldown: 8000,
  range: 0,
  damageMult: 0,
  critChance: 0,
  execute: ({ player }) => {
    player.maxHp += 5;
    player.hp = Math.min(player.hp + 10, player.maxHp);
    return 0;
  },
};
