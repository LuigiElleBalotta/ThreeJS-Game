export class UI {
  playerHealthBar: HTMLDivElement;
  gameOverOverlay: HTMLDivElement;
  restartBtn: HTMLButtonElement;

  constructor(){
    this.playerHealthBar = document.getElementById("ui-player-health-bar") as HTMLDivElement;
    this.gameOverOverlay = document.getElementById("game-over") as HTMLDivElement;
    this.restartBtn = document.getElementById("restart-btn") as HTMLButtonElement;

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

  updatePlayerHealth(hp:number){
    this.playerHealthBar.style.width = `${Math.max(0,hp)}%`;
  }

  showGameOver(onRestart:()=>void){
    this.gameOverOverlay.style.display="flex";
    this.restartBtn.onclick = ()=>{
      onRestart();
      this.gameOverOverlay.style.display="none";
    }
  }
}
