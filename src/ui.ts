export class UI {
  playerHealthBar: HTMLDivElement;
  gameOverOverlay: HTMLDivElement;
  restartBtn: HTMLButtonElement;

  manaBar: HTMLDivElement;

  constructor(){
    this.playerHealthBar = document.getElementById("ui-player-health-bar") as HTMLDivElement;
    this.gameOverOverlay = document.getElementById("game-over") as HTMLDivElement;
    this.restartBtn = document.getElementById("restart-btn") as HTMLButtonElement;

    // Barra vita/mana in alto a sinistra
    let healthBarWrap = document.getElementById("ui-player-health-wrap") as HTMLDivElement;
    if (!healthBarWrap) {
      healthBarWrap = document.createElement("div");
      healthBarWrap.id = "ui-player-health-wrap";
      healthBarWrap.style.position = "fixed";
      healthBarWrap.style.left = "32px";
      healthBarWrap.style.top = "32px";
      healthBarWrap.style.width = "320px";
      healthBarWrap.style.height = "54px";
      healthBarWrap.style.background = "rgba(30,30,30,0.92)";
      healthBarWrap.style.border = "2px solid #fff";
      healthBarWrap.style.borderRadius = "12px";
      healthBarWrap.style.zIndex = "10001";
      healthBarWrap.style.boxShadow = "0 2px 12px #000";
      // Rimuovi eventuale vecchia barra rossa
      const oldBar = document.getElementById("ui-player-health-bar");
      if (oldBar && oldBar.parentElement) oldBar.parentElement.remove();

      healthBarWrap.innerHTML = `
        <div style="position:relative;width:92%;height:18px;margin:8px 12px 0 12px;background:#222;border-radius:8px;overflow:hidden;">
          <div id="player-hp-bar" style="height:100%;background:#2ecc40;border-radius:8px;width:100%;transition:width 0.2s;"></div>
          <div id="player-hp-text" style="position:absolute;left:16px;top:0;color:#fff;font-size:1.1rem;font-weight:bold;text-shadow:0 0 4px #000;line-height:18px;">HP</div>
        </div>
        <div style="position:relative;width:92%;height:14px;margin:8px 12px 0 12px;background:#222;border-radius:8px;overflow:hidden;">
          <div id="player-mana-bar" style="height:100%;background:#00cfff;border-radius:8px;width:100%;transition:width 0.2s;"></div>
          <div id="player-mana-text" style="position:absolute;left:16px;top:0;color:#fff;font-size:1.05rem;font-weight:bold;text-shadow:0 0 4px #000;line-height:14px;">Mana</div>
        </div>
      `;
      document.body.appendChild(healthBarWrap);
    }
    this.playerHealthBar = document.getElementById("player-hp-bar") as HTMLDivElement;
    this.manaBar = document.getElementById("player-mana-bar") as HTMLDivElement;

    // Spellbar UI
    const spellbar = document.createElement("div");
    spellbar.id = "spellbar";
    spellbar.style.position = "fixed";
    spellbar.style.left = "50%";
    spellbar.style.bottom = "24px";
    spellbar.style.transform = "translateX(-50%)";
    spellbar.style.display = "flex";
    spellbar.style.gap = "12px";
    spellbar.style.zIndex = "10000";
    spellbar.style.background = "rgba(0,0,0,0.5)";
    spellbar.style.padding = "10px 24px";
    spellbar.style.borderRadius = "16px";
    for(let i=0;i<12;i++){
      const slot = document.createElement("div");
      slot.className = "spell-slot";
      slot.style.width = "56px";
      slot.style.height = "56px";
      slot.style.background = "#222";
      slot.style.border = "2px solid #888";
      slot.style.borderRadius = "8px";
      slot.style.display = "flex";
      slot.style.alignItems = "center";
      slot.style.justifyContent = "center";
      slot.style.fontSize = "1.5rem";
      slot.style.color = "#fff";
      slot.dataset.index = (i+1).toString();
      slot.textContent = "";
      if (i === 0) {
        const icon = document.createElement("img");
        icon.src = "/spells/icons/ability_warrior_savageblow.jpg";
        icon.alt = "spell";
        icon.style.width = "100%";
        icon.style.height = "100%";
        icon.style.objectFit = "cover";
        icon.style.borderRadius = "6px";
        slot.appendChild(icon);
      }
      spellbar.appendChild(slot);
    }
    document.body.appendChild(spellbar);
  }

  updatePlayerHealth(hp: number, mana?: number, maxHp?: number, maxMana?: number) {
    if (this.playerHealthBar) {
      const max = maxHp ?? 100;
      this.playerHealthBar.style.width = `${Math.max(0, (hp / max) * 100)}%`;
      const hpText = document.getElementById("player-hp-text");
      if (hpText) hpText.textContent = `${hp} / ${max}`;
    }
    if (this.manaBar) {
      const maxM = maxMana ?? 100;
      this.manaBar.style.width = `${Math.max(0, (mana ?? maxM) / maxM * 100)}%`;
      const manaText = document.getElementById("player-mana-text");
      if (manaText) manaText.textContent = `Mana: ${mana ?? maxM} / ${maxM}`;
    }
  }

  showGameOver(onRestart:()=>void){
    this.gameOverOverlay.style.display="flex";
    this.restartBtn.onclick = ()=>{
      onRestart();
      this.gameOverOverlay.style.display="none";
    }
  }
}
