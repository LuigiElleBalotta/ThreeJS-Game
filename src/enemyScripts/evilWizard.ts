import type { Enemy } from "../enemy";
import type { Player } from "../player";
import { fireBlast } from "../spells/fireBlast";
import { firebolt } from "../spells/firebolt";

const enemySpellDamage = (spell: any, enemy: Enemy) => {
  const base = enemy.damage || 8;
  const mult = spell.damageMult ?? 1;
  const critChance = spell.critChance ?? 0.1;
  const isCrit = Math.random() < critChance;
  return Math.round(base * mult * (isCrit ? 2 : 1));
};

export function evilWizardAI(enemy: Enemy, ctx: { player: Player; now: number; delta: number }) {
  const player = ctx.player;
  if (!player.isAlive()) return;
  const now = ctx.now;
  const dist = enemy.mesh.position.distanceTo(player.mesh.position);

  if (enemy.hp < enemy.maxHp * 0.5) {
    if (!enemy.currentCast) {
      enemy.startCast(firebolt, player, now);
    }
    return;
  }

  const cooldown = fireBlast.cooldown;
  if (!enemy.lastSpellTimes[fireBlast.id] || now - enemy.lastSpellTimes[fireBlast.id] > cooldown) {
    if (dist <= (fireBlast.range ?? 12)) {
      enemy.lastSpellTimes[fireBlast.id] = now;
      const dmg = enemySpellDamage(fireBlast, enemy);
      player.takeDamage(dmg);
      window.dispatchEvent(new CustomEvent("playerDamage", { detail: { amount: dmg, sourceEnemy: enemy } }));
    }
  }
}
