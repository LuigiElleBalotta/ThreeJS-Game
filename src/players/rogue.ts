import { Player } from "../player";
import { ClipMap } from "../animationController";

export class RoguePlayer extends Player {
  constructor() {
    super("rogue");
  }

  protected getModelPath() {
    return "/characters/player/rogue/scene.gltf";
  }

  protected getModelScale() {
    return 1.5;
  }

  protected getModelRotationY() {
    return 0;
  }

  protected getClipMap(): ClipMap {
    const base = super.getClipMap();
    return {
      idle: this.actions["Armature.001|idle"] ? "Armature.001|idle" : base.idle,
      run: this.actions["Armature.001|walk"] ? "Armature.001|walk" : base.run,
      runBack: this.actions["Armature.001|walk"] ? "Armature.001|walk" : base.runBack,
      jump: base.jump,
      attack: this.actions["Armature.001|atack"] ? "Armature.001|atack" : base.attack,
    };
  }
}
