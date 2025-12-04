import * as THREE from "three";
import { AnimationAction } from "three";

export interface ClipMap {
  idle?: string;
  run?: string;
  runBack?: string;
  jump?: string;
  attack?: string | string[];
}

export class AnimationController {
  private actions: Record<string, AnimationAction>;
  private current?: AnimationAction;
  private clipMap: ClipMap;
  private attackIndex = 0;

  constructor(actions: Record<string, AnimationAction>, clipMap: ClipMap) {
    this.actions = actions;
    this.clipMap = clipMap;
  }

  setState(opts: { moving: boolean; backwards: boolean; airborne: boolean; attacking: boolean }) {
    const { moving, backwards, airborne, attacking } = opts;
    if (attacking) {
      this.playAttack();
      return;
    }
    if (airborne && this.clipMap.jump) {
      this.play(this.clipMap.jump);
      return;
    }
    if (moving) {
      if (backwards && this.clipMap.runBack) {
        this.play(this.clipMap.runBack);
      } else if (this.clipMap.run) {
        this.play(this.clipMap.run);
      } else if (this.clipMap.idle) {
        this.play(this.clipMap.idle);
      }
      return;
    }
    if (this.clipMap.idle) this.play(this.clipMap.idle);
  }

  playAttack() {
    const atk = this.nextAttackClip();
    if (atk) this.play(atk);
  }

  play(name: string) {
    const action = this.actions[name];
    if (!action) return;
    if (this.current === action) return;
    action.reset();
    action.fadeIn(0.08);
    action.play();
    if (this.current) this.current.fadeOut(0.08);
    this.current = action;
  }

  private nextAttackClip() {
    const atk = this.clipMap.attack;
    if (!atk) return null;
    if (Array.isArray(atk) && atk.length) {
      const name = atk[this.attackIndex % atk.length];
      this.attackIndex++;
      if (this.actions[name]) return name;
    } else if (typeof atk === "string") {
      if (this.actions[atk]) return atk;
    }
    return null;
  }
}
