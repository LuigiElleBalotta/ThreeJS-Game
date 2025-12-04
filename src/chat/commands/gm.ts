import type { Game } from "../../game";

export function gmCommand(args: string[], ctx: { game: Game }) {
  const mode = (args[0] || "").toLowerCase();
  if (mode === "on") {
    ctx.game.isGM = true;
    if (ctx.game.player) ctx.game.player.isGameMaster = true;
    ctx.game.ui?.addChatMessage("System", "GM mode enabled. All creatures treat you as friendly.");
  } else if (mode === "off") {
    ctx.game.isGM = false;
    if (ctx.game.player) ctx.game.player.isGameMaster = false;
    ctx.game.ui?.addChatMessage("System", "GM mode disabled.");
  } else {
    ctx.game.ui?.addChatMessage("System", "Usage: .gm on | off");
  }
}
