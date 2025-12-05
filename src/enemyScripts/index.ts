import type { Enemy } from "../enemy";
import type { Player } from "../player";
import { evilWizardAI } from "./evilWizard";

export type EnemyScript = (enemy: Enemy, ctx: { player: Player; now: number; delta: number }) => void;

export const enemyScripts: Record<string, EnemyScript> = {
  evil_wizard_ai: evilWizardAI,
};
