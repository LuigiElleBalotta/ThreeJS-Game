import type { Game } from "../../game";

export function dayNightCommand(args: string[], ctx: { game: Game }) {
  const mode = (args[0] || "").toLowerCase();
  if (mode === "on") {
    ctx.game.dayNightEnabled = true;
    ctx.game.ui?.addChatMessage("System", "Day/Night cycle enabled.");
  } else if (mode === "off") {
    ctx.game.dayNightEnabled = false;
    ctx.game.ui?.addChatMessage("System", "Day/Night cycle disabled.");
  } else {
    ctx.game.ui?.addChatMessage("System", "Usage: .daynight on|off");
  }
}
