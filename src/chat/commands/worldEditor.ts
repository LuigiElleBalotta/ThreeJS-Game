import type { Game } from "../../game";
import { getUnityDecorations } from "../../world/unity-decor-catalog";

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
    const query = (args[1] || "").toLowerCase();
    const rows = getUnityDecorations().filter((d) => !query || d.id.toLowerCase().includes(query) || d.path.toLowerCase().includes(query));
    const preview = rows.slice(0, 40).map((d) => d.id).join(", ");
    ctx.game.ui?.addChatMessage(
      "System",
      `Decor IDs: ${rows.length} match${query ? ` for '${query}'` : ""}. ${preview}${rows.length > 40 ? ", ..." : ""}`,
    );
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
