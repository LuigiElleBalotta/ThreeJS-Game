import * as THREE from "three";
import { AnimationAction } from "three";

export interface ClipMap {
    idle?: string;
    run?: string;
    walk?: string;
    runBack?: string;
    swim?: string;
    swimBack?: string;
    swimIdle?: string;
    jump?: string;
    attack?: string | string[];
    cast?: string;
    death?: string;
    hit?: string;
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

    setState(opts: { moving: boolean; backwards: boolean; airborne: boolean; attacking: boolean; casting?: boolean; dead?: boolean; swimming?: boolean }) {
        const { moving, backwards, airborne, attacking, casting = false, dead = false, swimming = false } = opts;
        if (dead && this.clipMap.death) {
            this.play(this.clipMap.death);
            return;
        }
        if (casting && this.clipMap.cast) {
            this.play(this.clipMap.cast);
            return;
        }
        if (swimming) {
            if (moving) {
                if (backwards && this.clipMap.swimBack) {
                    this.play(this.clipMap.swimBack);
                } else if (this.clipMap.swim) {
                    this.play(this.clipMap.swim);
                } else if (this.clipMap.swimIdle) {
                    this.play(this.clipMap.swimIdle);
                } else if (this.clipMap.idle) {
                    this.play(this.clipMap.idle);
                }
            } else if (this.clipMap.swimIdle) {
                this.play(this.clipMap.swimIdle);
            } else if (this.clipMap.idle) {
                this.play(this.clipMap.idle);
            }
            return;
        }
        if (attacking) {
            if (this.current && (this.current as any)._clip.name.toLowerCase().includes("attack")) return;
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
            } else if (this.clipMap.walk) {
                this.play(this.clipMap.walk);
            } else if (this.clipMap.idle) {
                this.play(this.clipMap.idle);
            }
            return;
        }
        if (this.clipMap.idle) {
            this.play(this.clipMap.idle);
        } else if (this.current) {
            // No idle clip: stop current animation to avoid sliding
            this.current.fadeOut(0.1);
            this.current = undefined;
        }
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
        action.fadeIn(0.15);
        action.play();
        if (this.current) this.current.fadeOut(0.15);
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
