import type { Game } from "../../game";
import type { Enemy } from "../../enemy";

export function moveHereCommand(args: string[], ctx: { game: Game }) {
  const game = ctx.game;
  const target = game.selectedEnemy;
  if (!target || !target.isAlive()) {
    game.ui?.addChatMessage("System", "Select a target first.");
    return;
  }
  const playerPos = game.player?.mesh?.position;
  if (!playerPos) {
    game.ui?.addChatMessage("System", "Player not ready.");
    return;
  }
  const pos = playerPos.clone();
  pos.y = Math.max(pos.y, 0.1);
  target.mesh.position.copy(pos);
  target.mesh.rotation.y = game.player.mesh.rotation.y;
  game.ui?.addChatMessage("System", `Moved ${target.mesh.name || "target"} to your position.`);
}
