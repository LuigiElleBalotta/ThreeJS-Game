import { Player } from "../player";
import { ClipMap } from "../animationController";

export class MagePlayer extends Player {
  constructor() {
    super("mage");
  }

  protected getModelPath() {
    return "/characters/player/mage/scene.gltf";
  }

  protected getModelScale() {
    return 0.06;
  }

  protected getModelRotationY() {
    return 0;
  }

  protected getClipMap(): ClipMap {
    const base = super.getClipMap();
    return {
      idle: undefined, // no idle animation provided
      run: this.actions["Animation"] ? "Animation" : base.run,
      runBack: this.actions["Animation"] ? "Animation" : base.runBack,
      jump: base.jump,
      attack: base.attack,
    };
  }
}
