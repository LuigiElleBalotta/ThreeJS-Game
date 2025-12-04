import type { Game } from "../../game";

export function spawnGameobjectCommand(args: string[], ctx: { game: Game }) {
  const templateId = args[0];
  if (!templateId) {
    ctx.game.ui?.addChatMessage("System", "Usage: .spawnGameobject <TEMPLATE_ID>");
    return;
  }
  const playerPos = ctx.game.player?.mesh?.position;
  if (!playerPos) {
    ctx.game.ui?.addChatMessage("System", "Player not ready.");
    return;
  }
  const orientation = ctx.game.player.mesh.rotation.y;
  const pos = { x: playerPos.x, y: playerPos.y, z: playerPos.z };
  const spawned = ctx.game.spawnVolatileGameObject(templateId, pos, orientation);
  if (spawned) {
    ctx.game.ui?.addChatMessage("System", `Spawned gameobject ${templateId} at your position.`);
    ctx.game.persistVolatileSpawns();
  } else {
    const possible = Object.keys(ctx.game.gameObjectTemplates || {}).join(", ");
    ctx.game.ui?.addChatMessage("System", `Could not spawn gameobject ${templateId}. Available template ids: ${possible || "none loaded"}.`);
  }
}
