import { Player } from "../player";
import { ClipMap } from "../animationController";
import { Spell } from "../types";

export class WarriorPlayer extends Player {
    constructor() {
        super("warrior");
    }

    protected getModelPath() {
        return "/characters/player/warrior/scene.gltf";
    }

    protected getModelScale() {
        return 1.5;
    }

  protected getModelRotationY() {
    return 0;
  }

  protected getClipMap(): ClipMap {
    const base = super.getClipMap();
    const attacks = ["SwordAndShieldSlash", "SwordAndShieldSlash_2", "SwordAndShieldImpact"].filter(n => this.actions[n]);
    return {
      idle: this.actions["SwordAndShieldIdle"] ? "SwordAndShieldIdle" : (this.actions["Idle"] ? "Idle" : base.idle),
      run: this.actions["SwordAndShieldRun"] ? "SwordAndShieldRun" : base.run,
      runBack: this.actions["SwordAndShieldRun(back)"] ? "SwordAndShieldRun(back)" : base.runBack,
      jump: this.actions["SwordAndShieldJump"] ? "SwordAndShieldJump" : base.jump,
      attack: attacks.length ? attacks : base.attack,
    };
  }

  onSpellCast(spell: Spell, context: { inCombat: boolean }) {
    if (context.inCombat && this.animController) {
      this.animController.playAttack();
    }
  }

  onMoveStart(direction: THREE.Vector3) {
    // ensure run animation picks forward motion even if spell hooks change in future
    if (this.animController) this.animController.setState({ moving: true, backwards: direction.z > 0, airborne: false, attacking: false });
  }
}
