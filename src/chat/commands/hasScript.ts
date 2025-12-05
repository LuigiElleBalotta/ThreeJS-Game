import type { Game } from "../../game";

export function hasScriptCommand(args: string[], ctx: { game: Game }) {
  const target = ctx.game.selectedEnemy;
  if (!target) {
    ctx.game.ui?.addChatMessage("System", "Select a creature first.");
    return;
  }
  const templateId = target.templateId || "unknown";
  const template = ctx.game.creatureTemplates?.[templateId];
  const scriptId = target.scriptId || template?.scriptId;
  if (!scriptId) {
    ctx.game.ui?.addChatMessage("System", `Creature ${template?.name || templateId} has no script assigned.`);
    return;
  }
  ctx.game.ui?.addChatMessage(
    "System",
    `Creature: ${template?.name || templateId} | scriptId: ${scriptId}`
  );
}
