import type { Game } from "../../game";
import { UNITY_WORLD_DECORATIONS } from "../../world/unity-decor.config";

export async function worldEditorCommand(args: string[], ctx: { game: Game }) {
  const sub = (args[0] || "").toLowerCase();
  if (!sub || sub === "help") {
    ctx.game.ui?.addChatMessage(
      "System",
      "Editor: .editor on|off|list|place <decorId>|clear|save|reload|defaults",
    );
    return;
  }

  if (sub === "on") {
    ctx.game.setWorldEditorMode(true);
    return;
  }
  if (sub === "off") {
    ctx.game.setWorldEditorMode(false);
    return;
  }
  if (sub === "list") {
    const ids = UNITY_WORLD_DECORATIONS.map((d) => d.id).join(", ");
    ctx.game.ui?.addChatMessage("System", `Decor IDs: ${ids}`);
    return;
  }
  if (sub === "place") {
    const decorId = args[1];
    if (!decorId) {
      ctx.game.ui?.addChatMessage("System", "Usage: .editor place <decorId>");
      return;
    }
    await ctx.game.editorPlaceDecoration(decorId);
    return;
  }
  if (sub === "clear") {
    ctx.game.editorClearDecorations();
    return;
  }
  if (sub === "save") {
    ctx.game.saveWorldDecorPlacements();
    ctx.game.ui?.addChatMessage("System", "World decorations saved.");
    return;
  }
  if (sub === "reload") {
    await ctx.game.reloadWorldDecorations();
    ctx.game.ui?.addChatMessage("System", "World decorations reloaded.");
    return;
  }
  if (sub === "defaults") {
    await ctx.game.editorResetDecorationsToDefaults();
    return;
  }

  ctx.game.ui?.addChatMessage(
    "System",
    "Unknown editor action. Use: .editor help",
  );
}
