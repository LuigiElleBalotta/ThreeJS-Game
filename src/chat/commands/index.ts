import type { Game } from "../../game";
import { editScale } from "./editScale";
import { spawnCreatureCommand } from "./spawnCreature";
import { spawnGameobjectCommand } from "./spawnGameobject";
import { gmCommand } from "./gm";
import { flyCommand } from "./fly";

export type ChatCommandHandler = (args: string[], ctx: { game: Game }) => void;

const commands: Record<string, ChatCommandHandler> = {
  editscale: editScale,
  spawncreature: spawnCreatureCommand,
  spawngameobject: spawnGameobjectCommand,
  gm: gmCommand,
  fly: flyCommand,
};

export function handleChatCommand(raw: string, ctx: { game: Game }): boolean {
  if (!raw.startsWith(".")) return false;
  const parts = raw.slice(1).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return false;
  const name = parts[0].toLowerCase();
  const args = parts.slice(1);
  const handler = commands[name];
  if (!handler) return false;
  try {
    handler(args, ctx);
  } catch (err: any) {
    ctx.game.ui?.addChatMessage("System", `Command error: ${err?.message || err}`);
  }
  return true;
}
