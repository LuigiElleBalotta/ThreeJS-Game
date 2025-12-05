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
    // Move player to melee range in front of target
    const dir = new THREE.Vector3().subVectors(target.mesh.position, player.mesh.position);
    dir.y = 0;
    const dist = dir.length();
    if (dist > 0.001) {
      dir.normalize();
      const stopDist = Math.max(1.4, player.attackRange - 0.2);
      const newPos = target.mesh.position.clone().addScaledVector(dir, -stopDist);
      newPos.y = Math.max(1, newPos.y);
      player.mesh.position.copy(newPos);
      player.mesh.rotation.y = Math.atan2(dir.x, dir.z);
    }
    const isCrit = Math.random() < charge.critChance;
    const dmg = Math.round(player.attackDamage * charge.damageMult * (isCrit ? 2 : 1));
    target.takeDamage(dmg);
    // small camera shake effect (optional)
    game?.camera.position.add(new THREE.Vector3((Math.random()-0.5)*0.2,0,(Math.random()-0.5)*0.2));
    return dmg;
  },
};
