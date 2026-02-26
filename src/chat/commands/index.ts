import type { Game } from "../../game";
import { editScale } from "./editScale";
import { spawnCreatureCommand } from "./spawnCreature";
import { spawnGameobjectCommand } from "./spawnGameobject";
import { gmCommand } from "./gm";
import { flyCommand } from "./fly";
import { moveHereCommand } from "./moveHere";
import { dayNightCommand } from "./daynight";
import { hasScriptCommand } from "./hasScript";
import { showCollisionRaysCommand } from "./showCollisionRays";
import { worldEditorCommand } from "./worldEditor";

export type ChatCommandHandler = (args: string[], ctx: { game: Game }) => void | Promise<void>;

const commands: Record<string, ChatCommandHandler> = {
  editscale: editScale,
  spawncreature: spawnCreatureCommand,
  spawngameobject: spawnGameobjectCommand,
  gm: gmCommand,
  fly: flyCommand,
  movehere: moveHereCommand,
  daynight: dayNightCommand,
  hasscript: hasScriptCommand,
  showcollisionrays: showCollisionRaysCommand,
  collisionrays: showCollisionRaysCommand,
  editor: worldEditorCommand,
  worldeditor: worldEditorCommand,
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
    const result = handler(args, ctx);
    if (result && typeof (result as Promise<void>).catch === "function") {
      (result as Promise<void>).catch((err: any) => {
        ctx.game.ui?.addChatMessage("System", `Command error: ${err?.message || err}`);
      });
    }
  } catch (err: any) {
    ctx.game.ui?.addChatMessage("System", `Command error: ${err?.message || err}`);
  }
  return true;
}
