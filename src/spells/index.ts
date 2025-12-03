import { Spell } from "../types";
import { heroicStrike } from "./heroicStrike";
import { arcaneBolt } from "./arcaneBolt";
import { sinisterStrike } from "./sinisterStrike";
import { shieldBlock } from "./shieldBlock";
import { fireBlast } from "./fireBlast";
import { backstab } from "./backstab";

const SPELL_LIST: Spell[] = [heroicStrike, arcaneBolt, sinisterStrike, shieldBlock, fireBlast, backstab];

export const SPELL_REGISTRY: Record<string, Spell> = SPELL_LIST.reduce((acc, spell) => {
  acc[spell.id] = spell;
  return acc;
}, {} as Record<string, Spell>);

export function getSpellsForClass(classId: string) {
  return SPELL_LIST.filter((s) => s.classTags.includes(classId));
}
