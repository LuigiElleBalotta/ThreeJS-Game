import type { Game } from "../../game";

export function flyCommand(args: string[], ctx: { game: Game }) {
  const mode = (args[0] || "").toLowerCase();
  if (mode === "on") {
    if (ctx.game.player) ctx.game.player.canFly = true;
    ctx.game.ui?.addChatMessage("System", "Fly mode ON (space=up, X=down).");
  } else if (mode === "off") {
    if (ctx.game.player) {
      ctx.game.player.canFly = false;
      ctx.game.player.mesh.position.y = Math.max(ctx.game.player.mesh.position.y, 1);
    }
    ctx.game.ui?.addChatMessage("System", "Fly mode OFF.");
  } else {
    ctx.game.ui?.addChatMessage("System", "Usage: .fly on | off");
  }
}
