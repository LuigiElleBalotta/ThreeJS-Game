import { Spell } from "../types";
import * as THREE from "three";

export const charge: Spell = {
  id: "charge",
  name: "Charge",
  description: "Rush toward the target, closing distance instantly and striking.",
  classTags: ["warrior"],
  kind: "melee",
  school: "physical",
  cost: 0,
  cooldown: 8000,
  range: 20,
  damageMult: 1.2,
  critChance: 0.1,
  execute: ({ player, target, game }) => {
    if (!target) return 0;
    const dir = new THREE.Vector3().subVectors(target.mesh.position, player.mesh.position);
    dir.y = 0;
    const dist = dir.length();
    const stopDist = Math.max(1.4, player.attackRange - 0.2);
    const travelDist = Math.max(0, dist - stopDist);
    // set a short-lived charge motion on player
    (player as any).chargeState = {
      dir: dir.normalize(),
      remaining: travelDist,
      speed: Math.max(0.55, player.speed * 4),
      target,
      spellId: "charge",
    };
    // damage will be applied on impact by the game update when remaining<=0
    return 0;
  },
};
