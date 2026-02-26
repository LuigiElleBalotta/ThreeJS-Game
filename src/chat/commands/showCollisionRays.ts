import type { Game } from "../../game";

export function showCollisionRaysCommand(args: string[], ctx: { game: Game }) {
  const mode = (args[0] || "").toLowerCase();
  if (mode === "on") {
    ctx.game.setCollisionDebugEnabled(true);
    ctx.game.ui?.addChatMessage("System", "Collision rays debug enabled.");
  } else if (mode === "off") {
    ctx.game.setCollisionDebugEnabled(false);
    ctx.game.ui?.addChatMessage("System", "Collision rays debug disabled.");
  } else {
    ctx.game.ui?.addChatMessage("System", "Usage: .showcollisionrays on|off");
  }
}
