import type { Game } from "../../game";

export function editScale(args: string[], ctx: { game: Game }) {
  const ui = ctx.game.ui;
  const target = ctx.game.selectedEnemy;
  if (!target) {
    ui?.addChatMessage("System", "No creature selected to scale.");
    return;
  }
  const value = parseFloat(args[0]);
  if (!isFinite(value) || value <= 0) {
    ui?.addChatMessage("System", "Usage: .editScale <positive number>");
    return;
  }
  target.mesh.scale.setScalar(value);
  target.recalculateHeadOffset();
  ui?.addChatMessage("System", `Set scale of ${target.mesh.name || "creature"} to ${value}`);
}
