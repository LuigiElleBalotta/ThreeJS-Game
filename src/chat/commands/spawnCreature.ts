import type { Game } from "../../game";

export function spawnCreatureCommand(args: string[], ctx: { game: Game }) {
  const templateId = args[0];
  if (!templateId) {
    ctx.game.ui?.addChatMessage("System", "Usage: .spawnCreature <TEMPLATE_ID>");
    return;
  }
  const playerPos = ctx.game.player?.mesh?.position;
  if (!playerPos) {
    ctx.game.ui?.addChatMessage("System", "Player not ready.");
    return;
  }
  const orientation = ctx.game.player.mesh.rotation.y;
  const pos = { x: playerPos.x, y: playerPos.y, z: playerPos.z };
  const spawned = ctx.game.spawnVolatileCreature(templateId, pos, orientation);
  if (spawned) {
    ctx.game.ui?.addChatMessage("System", `Spawned creature ${templateId} at your position.`);
    ctx.game.persistVolatileSpawns();
  } else {
    const possible = Object.keys(ctx.game.creatureTemplates || {}).join(", ");
    ctx.game.ui?.addChatMessage("System", `Could not spawn creature ${templateId}. Available template ids: ${possible || "none loaded"}.`);
  }
}
