import type { Enemy } from "./enemy";

export type WaypointScriptFn = (enemy: Enemy) => void;

/**
 * Registry of waypoint scripts (TrinityCore-like smart_scripts hook).
 * Add new handlers keyed by eventId and they will run once when the mob
 * reaches a waypoint that declares that eventId.
 */
export const waypointScripts: Record<string, WaypointScriptFn> = {
  /**
   * Guard stops, "salutes" (pause) and gives a proximity warning in chat.
   */
  guard_salute: (enemy) => {
    enemy.patrolPausedUntil = Date.now() + 1800;
    const msg = document.createElement("div");
    msg.textContent = "[Guard] Stay vigilant!";
    msg.style.position = "fixed";
    msg.style.top = "18px";
    msg.style.right = "24px";
    msg.style.padding = "6px 10px";
    msg.style.background = "rgba(20,20,26,0.85)";
    msg.style.border = "1px solid #c49a3a";
    msg.style.borderRadius = "8px";
    msg.style.color = "#f6d48b";
    msg.style.fontSize = "0.95rem";
    msg.style.zIndex = "10010";
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 1600);
  },

  /**
   * Questgiver pauses and emits a floating chat bubble above the NPC.
   */
  questgiver_wave: (enemy) => {
    enemy.patrolPausedUntil = Date.now() + 2000;
    const bubble = document.createElement("div");
    bubble.textContent = "Need help? I have tasks for you!";
    bubble.style.position = "absolute";
    bubble.style.transform = "translate(-50%, -120%)";
    bubble.style.padding = "6px 10px";
    bubble.style.background = "rgba(255,255,255,0.9)";
    bubble.style.border = "1px solid #c49a3a";
    bubble.style.borderRadius = "8px";
    bubble.style.color = "#1a1a1a";
    bubble.style.fontSize = "0.9rem";
    bubble.style.whiteSpace = "nowrap";
    bubble.style.boxShadow = "0 2px 8px rgba(0,0,0,0.45)";
    const bar = enemy.healthBarDiv;
    const wrap = document.createElement("div");
    wrap.style.position = "fixed";
    wrap.style.pointerEvents = "none";
    wrap.style.zIndex = "10011";
    wrap.style.left = bar.style.left || "50%";
    wrap.style.top = (parseFloat(bar.style.top || "0") - 24) + "px";
    wrap.appendChild(bubble);
    document.body.appendChild(wrap);
    setTimeout(() => wrap.remove(), 2000);
  },
};
