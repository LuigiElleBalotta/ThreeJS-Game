import { Player } from "../player";
import { ClipMap } from "../animationController";

export class RangerPlayer extends Player {
  constructor() {
    super("ranger");
  }

  protected getModelPath() {
    return "/characters/npcs/sylvanas_npc/Sylvanas.fbx";
  }

  protected getModelScale() {
    return 0.01;
  }

  protected getModelRotationY() {
    // Sylvanas FBX forward axis is rotated vs the other player models.
    return -Math.PI * 0.5;
  }

  protected getModelYOffset() {
    return 0;
  }

  protected getAnimationPaths(): string[] {
    const base = "/characters/npcs/sylvanas_npc/animations";
    return [
      `${base}/Sylvanas_Stand_3.fbx`,
      `${base}/Sylvanas_Run_18.fbx`,
      `${base}/Sylvanas_Walkbackwards_7.fbx`,
      `${base}/Sylvanas_Jump_74.fbx`,
      `${base}/Sylvanas_AttackBow_8.fbx`,
      `${base}/Sylvanas_SpellCastDirected_48.fbx`,
      `${base}/Sylvanas_Death_51.fbx`,
    ];
  }

  protected getClipMap(): ClipMap {
    const base = super.getClipMap();
    const names = Object.keys(this.actions);
    const pick = (contains: string[]) => names.find((n) => contains.some((c) => n.toLowerCase().includes(c)));
    const attacks = names.filter((n) => n.toLowerCase().includes("attackbow") || n.toLowerCase().includes("attack"));

    return {
      idle: pick(["stand"]) ?? base.idle,
      run: pick(["run"]) ?? base.run,
      runBack: pick(["walkback", "walk backward"]) ?? base.runBack,
      swim: pick(["swim"]) ?? base.swim,
      swimBack: pick(["swimback"]) ?? base.swimBack,
      swimIdle: pick(["swimidle"]) ?? base.swimIdle,
      jump: pick(["jump"]) ?? base.jump,
      cast: pick(["spellcastdirected", "spellcast"]) ?? base.cast,
      death: pick(["death"]) ?? base.death,
      attack: attacks.length ? attacks : base.attack,
    };
  }
}
