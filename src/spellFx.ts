import * as THREE from "three";
import {
  BatchedRenderer,
  ColorOverLife,
  ConstantColor,
  ConstantValue,
  Gradient,
  IntervalValue,
  ParticleEmitter,
  ParticleSystem,
  PointEmitter,
  RenderMode,
  Vector3,
  Vector4,
} from "three.quarks";
import type { Enemy } from "./enemy";

export class SpellFX {
  castBarWrap: HTMLDivElement | null = null;
  castBarFill: HTMLDivElement | null = null;
  castBarText: HTMLDivElement | null = null;
  private renderer: BatchedRenderer | null = null;
  private scene: THREE.Scene | null = null;

  init(scene: THREE.Scene) {
    if (this.renderer) return;
    this.scene = scene;
    this.renderer = new BatchedRenderer();
    this.scene.add(this.renderer);
  }

  update(delta: number) {
    if (!this.renderer) return;
    this.renderer.update(delta);
  }

  ensureCastBar() {
    if (this.castBarWrap) return;
    const wrap = document.createElement("div");
    wrap.id = "castbar";
    wrap.style.position = "fixed";
    wrap.style.bottom = "100px";
    wrap.style.left = "50%";
    wrap.style.transform = "translateX(-50%)";
    wrap.style.width = "240px";
    wrap.style.height = "18px";
    wrap.style.background = "rgba(20,16,12,0.9)";
    wrap.style.border = "1px solid #c49a3a";
    wrap.style.borderRadius = "10px";
    wrap.style.boxShadow = "0 4px 12px rgba(0,0,0,0.6)";
    wrap.style.display = "none";
    wrap.style.zIndex = "10004";

    const fill = document.createElement("div");
    fill.style.height = "100%";
    fill.style.width = "0%";
    fill.style.background = "linear-gradient(90deg,#e35d2e,#ff9a63)";
    fill.style.borderRadius = "8px";
    fill.style.transition = "width 0s";

    const text = document.createElement("div");
    text.style.position = "absolute";
    text.style.left = "8px";
    text.style.top = "50%";
    text.style.transform = "translateY(-50%)";
    text.style.color = "#f7d09b";
    text.style.fontWeight = "700";
    text.style.fontSize = "0.9rem";

    wrap.appendChild(fill);
    wrap.appendChild(text);
    document.body.appendChild(wrap);
    this.castBarWrap = wrap;
    this.castBarFill = fill;
    this.castBarText = text;
  }

  startCastBar(label: string, durationMs: number) {
    this.ensureCastBar();
    if (!this.castBarWrap || !this.castBarFill || !this.castBarText) return;
    this.castBarWrap.style.display = "block";
    this.castBarFill.style.width = "0%";
    this.castBarText.textContent = `${label}`;
    this.castBarWrap.dataset["castDuration"] = durationMs.toString();
  }

  updateCastBar(now: number, start: number, end: number, label: string) {
    if (!this.castBarFill || !this.castBarText || !this.castBarWrap) return;
    const elapsed = now - start;
    const total = end - start;
    const pct = Math.min(1, elapsed / total);
    this.castBarFill.style.width = `${pct * 100}%`;
    const remaining = Math.max(0, (total - elapsed) / 1000).toFixed(1);
    this.castBarText.textContent = `${label} (${remaining}s)`;
    if (elapsed >= total) this.castBarWrap.style.display = "none";
  }

  hideCastBar() {
    if (this.castBarWrap) this.castBarWrap.style.display = "none";
  }

  showSpellMsg(msg: string) {
    let el = document.getElementById("spellbar-msg");
    if (!el) {
      el = document.createElement("div");
      el.id = "spellbar-msg";
      el.style.position = "fixed";
      el.style.left = "50%";
      el.style.bottom = "90px";
      el.style.transform = "translateX(-50%)";
      el.style.background = "rgba(14,10,6,0.9)";
      el.style.color = "#f6d48b";
      el.style.fontWeight = "bold";
      el.style.fontSize = "1.2rem";
      el.style.padding = "8px 24px";
      el.style.borderRadius = "10px";
      el.style.zIndex = "10001";
      el.style.border = "1px solid #c49a3a";
      el.style.boxShadow = "0 2px 12px #000";
      document.body.appendChild(el);
    }
    el.innerText = msg;
    el.style.opacity = "1";
    el.style.display = "block";
    setTimeout(() => {
      el.style.opacity = "0";
      setTimeout(() => { el.style.display = "none"; }, 400);
    }, 1000);
  }

  spawnProjectile(color: number | undefined, origin: THREE.Vector3, target: Enemy, scene: THREE.Scene) {
    const boltGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const boltMat = new THREE.MeshBasicMaterial({ color: color ?? 0x6ec3ff });
    const bolt = new THREE.Mesh(boltGeo, boltMat);
    bolt.position.copy(origin);
    scene.add(bolt);
    return bolt;
  }

  showFloatingDamage(target: Enemy, dmg: number, startTime: number, camera: THREE.Camera) {
    const div = document.createElement("div");
    div.innerText = `-${dmg}`;
    div.style.position = "fixed";
    div.style.color = "#fff";
    div.style.fontWeight = "bold";
    div.style.fontSize = "28px";
    div.style.pointerEvents = "none";
    div.style.textShadow = "0 0 12px #000, 0 0 2px #fff";
    div.style.zIndex = "99999";
    div.style.padding = "2px 14px";
    div.style.borderRadius = "10px";
    div.style.background = "rgba(0,0,0,0.15)";
    document.body.appendChild(div);
    const angle = Math.random() * Math.PI * 2;
    const updateDmg = () => {
      if (!target.mesh.parent) { div.remove(); return; }
      const pos = target.mesh.position.clone();
      pos.y += 2.2;
      const vector = pos.project(camera);
      const t = (performance.now() - startTime) / 1000;
      const radius = 60;
      const theta = angle + t * Math.PI;
      const x = (vector.x * 0.5 + 0.5) * window.innerWidth + Math.cos(theta) * radius;
      const y = (-vector.y * 0.5 + 0.5) * window.innerHeight + Math.sin(theta) * radius;
      div.style.left = `${x}px`;
      div.style.top = `${y}px`;
      div.style.opacity = `${1 - t}`;
      if (t < 1) requestAnimationFrame(updateDmg);
      else div.remove();
    };
    updateDmg();
  }

  private ensureRenderer() {
    if (!this.renderer || !this.scene) {
      throw new Error("SpellFX renderer not initialized");
    }
  }

  private hexToVector3(hex: number) {
    const r = ((hex >> 16) & 0xff) / 255;
    const g = ((hex >> 8) & 0xff) / 255;
    const b = (hex & 0xff) / 255;
    return new Vector3(r, g, b);
  }

  private makeGradient(colorA: number, colorB: number) {
    return new Gradient(
      [
        [this.hexToVector3(colorA), 0],
        [this.hexToVector3(colorB), 1],
      ],
      [
        [1, 0],
        [0, 1],
      ]
    );
  }

  private registerEmitter(emitter: ParticleEmitter) {
    this.ensureRenderer();
    if (!this.scene || !this.renderer) return;
    this.scene.add(emitter);
    this.renderer.addSystem(emitter.system);
    const cleanup = () => {
      this.renderer?.deleteSystem(emitter.system);
      emitter.removeFromParent();
      emitter.system.removeAllEventListeners("destroy");
    };
    emitter.system.addEventListener("destroy", cleanup);
  }

  private createBurstEmitter(options: {
    position: THREE.Vector3;
    colorA: number;
    colorB: number;
    count: number;
    life: [number, number];
    speed: [number, number];
    size: [number, number];
  }) {
    this.ensureRenderer();
    const system = new ParticleSystem({
      autoDestroy: true,
      looping: false,
      prewarm: false,
      duration: Math.max(0.2, options.life[1] + 0.1),
      shape: new PointEmitter(),
      startLife: new IntervalValue(options.life[0], options.life[1]),
      startSpeed: new IntervalValue(options.speed[0], options.speed[1]),
      startRotation: new ConstantValue(0),
      startSize: new IntervalValue(options.size[0], options.size[1]),
      startColor: new ConstantColor(new Vector4(1, 1, 1, 1)),
      emissionOverTime: new ConstantValue(0),
      emissionOverDistance: new ConstantValue(0),
      emissionBursts: [
        {
          time: 0,
          count: new ConstantValue(options.count),
          cycle: 1,
          interval: 0,
          probability: 1,
        },
      ],
      renderMode: RenderMode.BillBoard,
      material: new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
      behaviors: [new ColorOverLife(this.makeGradient(options.colorA, options.colorB))],
      worldSpace: true,
    });

    const emitter = new ParticleEmitter(system);
    emitter.position.copy(options.position);
    this.registerEmitter(emitter);
    system.play();
    return emitter;
  }

  private createTrailEmitter(options: {
    parent: THREE.Object3D;
    colorA: number;
    colorB: number;
    rate: number;
    life: [number, number];
    speed: [number, number];
    size: [number, number];
  }) {
    this.ensureRenderer();
    const system = new ParticleSystem({
      autoDestroy: true,
      looping: true,
      prewarm: false,
      duration: 1,
      shape: new PointEmitter(),
      startLife: new IntervalValue(options.life[0], options.life[1]),
      startSpeed: new IntervalValue(options.speed[0], options.speed[1]),
      startRotation: new ConstantValue(0),
      startSize: new IntervalValue(options.size[0], options.size[1]),
      startColor: new ConstantColor(new Vector4(1, 1, 1, 1)),
      emissionOverTime: new ConstantValue(options.rate),
      emissionOverDistance: new ConstantValue(0),
      renderMode: RenderMode.BillBoard,
      material: new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
      behaviors: [new ColorOverLife(this.makeGradient(options.colorA, options.colorB))],
      worldSpace: true,
    });

    const emitter = new ParticleEmitter(system);
    options.parent.add(emitter);
    this.renderer?.addSystem(system);
    const cleanup = () => {
      this.renderer?.deleteSystem(emitter.system);
      emitter.removeFromParent();
      emitter.system.removeAllEventListeners("destroy");
    };
    emitter.system.addEventListener("destroy", cleanup);
    system.play();
    return emitter;
  }

  spawnMageCast(school: string, position: THREE.Vector3) {
    if (school === "arcane") {
      this.createBurstEmitter({
        position,
        colorA: 0x8c65ff,
        colorB: 0x4cc9ff,
        count: 22,
        life: [0.35, 0.6],
        speed: [0.6, 1.6],
        size: [0.08, 0.16],
      });
      return;
    }
    if (school === "fire") {
      this.createBurstEmitter({
        position,
        colorA: 0xff6b1a,
        colorB: 0xffd24a,
        count: 18,
        life: [0.25, 0.5],
        speed: [0.8, 2.1],
        size: [0.1, 0.2],
      });
    }
  }

  spawnMageImpact(school: string, position: THREE.Vector3) {
    if (school === "arcane") {
      this.createBurstEmitter({
        position,
        colorA: 0x7c5cff,
        colorB: 0x6ee7ff,
        count: 30,
        life: [0.4, 0.7],
        speed: [1.2, 2.6],
        size: [0.12, 0.22],
      });
      return;
    }
    if (school === "fire") {
      this.createBurstEmitter({
        position,
        colorA: 0xff3c1b,
        colorB: 0xfff176,
        count: 26,
        life: [0.3, 0.6],
        speed: [1.4, 2.8],
        size: [0.12, 0.24],
      });
    }
  }

  spawnMageProjectileTrail(school: string, parent: THREE.Object3D) {
    if (school === "arcane") {
      return this.createTrailEmitter({
        parent,
        colorA: 0x9b6bff,
        colorB: 0x64d9ff,
        rate: 40,
        life: [0.25, 0.5],
        speed: [0.2, 0.6],
        size: [0.06, 0.12],
      });
    }
    if (school === "fire") {
      return this.createTrailEmitter({
        parent,
        colorA: 0xff5a1f,
        colorB: 0xffc04d,
        rate: 35,
        life: [0.2, 0.45],
        speed: [0.2, 0.7],
        size: [0.07, 0.14],
      });
    }
    return null;
  }

  endEmitter(emitter: ParticleEmitter | null | undefined) {
    if (!emitter) return;
    emitter.system.endEmit();
  }
}
