import * as THREE from "three";
import type { Enemy } from "./enemy";

export class SpellFX {
  castBarWrap: HTMLDivElement | null = null;
  castBarFill: HTMLDivElement | null = null;
  castBarText: HTMLDivElement | null = null;

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
}
