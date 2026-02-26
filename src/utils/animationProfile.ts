import type { AnimationClip } from "three";
import type { ClipMap } from "../animationController";

const includesAny = (value: string, needles: string[]) => needles.some((needle) => value.includes(needle));

type ClipName = { raw: string; lower: string };

function findBest(names: ClipName[], include: string[], exclude: string[] = []): string | undefined {
  const candidates = names.filter((name) => includesAny(name.lower, include) && !includesAny(name.lower, exclude));
  if (!candidates.length) return undefined;
  candidates.sort((a, b) => a.lower.length - b.lower.length);
  return candidates[0].raw;
}

function findMany(names: ClipName[], include: string[], exclude: string[] = []): string[] {
  return names
    .filter((name) => includesAny(name.lower, include) && !includesAny(name.lower, exclude))
    .map((name) => name.raw);
}

export function inferClipMapFromAnimations(clips: AnimationClip[]): ClipMap {
  const names = clips.map((clip) => ({ raw: clip.name, lower: clip.name.toLowerCase() }));
  const idle = findBest(names, ["idle", "stand", "breath", "rest"]);
  const walk = findBest(names, ["walk"]);
  const run = findBest(names, ["run", "sprint"], ["runback"]);
  const runBack = findBest(names, ["runback", "backpedal", "backward"]);
  const swim = findBest(names, ["swim"], ["swimidle", "swimback"]);
  const swimBack = findBest(names, ["swimback"]);
  const swimIdle = findBest(names, ["swimidle"]);
  const jump = findBest(names, ["jump", "leap"]);
  const cast = findBest(names, ["cast", "spell", "channel"], ["broadcast"]);
  const death = findBest(names, ["death", "die", "dead"]);
  const hit = findBest(names, ["hit", "hurt", "damage", "impact"]);
  const attack = findMany(
    names,
    ["attack", "slash", "shoot", "strike", "stab", "kick", "bite", "smash", "swing"],
    ["attacked", "attract"],
  );

  return {
    idle,
    walk,
    run: run ?? walk,
    runBack,
    swim,
    swimBack,
    swimIdle,
    jump,
    cast,
    death,
    hit,
    attack: attack.length ? attack : undefined,
  };
}
