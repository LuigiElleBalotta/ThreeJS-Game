export class UI {
  playerHealthBar: HTMLDivElement;
  gameOverOverlay: HTMLDivElement;
  restartBtn: HTMLButtonElement;

  manaBar: HTMLDivElement;
  xpBar: HTMLDivElement | null = null;
  levelText: HTMLDivElement | null = null;
  modals: Record<"character" | "spellbook" | "talents" | "bags", { overlay: HTMLDivElement, content: HTMLDivElement }> = {} as any;
  spellbookList!: HTMLDivElement;
  bagsContainer!: HTMLDivElement;
  goldDisplay!: HTMLDivElement;
  talentsContainer!: HTMLDivElement;
  toolbar!: HTMLDivElement;
  currentTab: "character" | "spellbook" | "talents" | "bags" = "spellbook";
  tooltip!: HTMLDivElement;
  lootOverlay!: HTMLDivElement;
  lootContent!: HTMLDivElement;
  lootItems: any[] = [];
  lootPage: number = 0;
  lootOnTake: ((id: string) => void) | null = null;

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
      healthBarWrap.style.background = "linear-gradient(135deg, rgba(36,27,14,0.92), rgba(18,14,9,0.92))";
      healthBarWrap.style.border = "2px solid #c29955";
      healthBarWrap.style.borderRadius = "14px";
      healthBarWrap.style.zIndex = "10001";
      healthBarWrap.style.boxShadow = "0 4px 16px rgba(0,0,0,0.6)";
      // Rimuovi eventuale vecchia barra rossa
      const oldBar = document.getElementById("ui-player-health-bar");
      if (oldBar && oldBar.parentElement) oldBar.parentElement.remove();

      healthBarWrap.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;padding:8px 12px 0 12px;">
          <div style="width:28px;height:28px;border-radius:50%;background:radial-gradient(circle at 30% 30%, #f6e2b3, #b8863b);box-shadow:0 0 8px rgba(255,215,128,0.6);border:2px solid #e2c17a;"></div>
          <div id="player-level-text" style="color:#f7d09b;font-weight:800;font-size:1rem;text-shadow:0 0 6px #000;">Lv. 1</div>
        </div>
        <div style="position:relative;width:92%;height:18px;margin:6px 12px 0 12px;background:#1a1a1a;border-radius:8px;overflow:hidden;border:1px solid #2f2f2f;">
          <div id="player-hp-bar" style="height:100%;background:linear-gradient(90deg,#8f1c1c,#d83d3d);border-radius:8px;width:100%;transition:width 0.2s;"></div>
          <div id="player-hp-text" style="position:absolute;left:12px;top:0;color:#fff;font-size:1.05rem;font-weight:bold;text-shadow:0 0 4px #000;line-height:18px;">HP</div>
        </div>
        <div style="position:relative;width:92%;height:14px;margin:8px 12px 0 12px;background:#0f1825;border-radius:8px;overflow:hidden;border:1px solid #0c223c;">
          <div id="player-mana-bar" style="height:100%;background:linear-gradient(90deg,#0c7db8,#35a8ff);border-radius:8px;width:100%;transition:width 0.2s;"></div>
          <div id="player-mana-text" style="position:absolute;left:12px;top:0;color:#d1edff;font-size:0.95rem;font-weight:bold;text-shadow:0 0 4px #000;line-height:14px;">Mana</div>
        </div>
        <div style="position:relative;width:92%;height:10px;margin:10px 12px 10px 12px;background:#0c0c0c;border-radius:12px;overflow:hidden;border:1px solid #7f5b21;">
          <div id="player-xp-bar" style="height:100%;background:linear-gradient(90deg,#7d4fcb,#b992ff);border-radius:12px;width:0%;transition:width 0.3s;"></div>
          <div style="position:absolute;left:12px;top:-12px;color:#b992ff;font-size:0.82rem;font-weight:700;text-shadow:0 0 4px #000;">XP</div>
        </div>
      `;
      document.body.appendChild(healthBarWrap);
    }
    this.playerHealthBar = document.getElementById("player-hp-bar") as HTMLDivElement;
    this.manaBar = document.getElementById("player-mana-bar") as HTMLDivElement;
    this.xpBar = document.getElementById("player-xp-bar");
    this.levelText = document.getElementById("player-level-text") as HTMLDivElement;

    // Tooltip overlay
    const tip = document.createElement("div");
    tip.id = "wow-tooltip";
    tip.style.position = "fixed";
    tip.style.padding = "8px 10px";
    tip.style.background = "rgba(24,18,12,0.92)";
    tip.style.border = "1px solid #c49a3a";
    tip.style.borderRadius = "8px";
    tip.style.color = "#f6d48b";
    tip.style.fontSize = "0.9rem";
    tip.style.boxShadow = "0 4px 12px rgba(0,0,0,0.6)";
    tip.style.pointerEvents = "none";
    tip.style.zIndex = "200000";
    tip.style.display = "none";
    document.body.appendChild(tip);
    this.tooltip = tip;

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
    spellbar.style.background = "linear-gradient(135deg, rgba(26,18,10,0.8), rgba(14,10,6,0.85))";
    spellbar.style.border = "2px solid #c49a3a";
    spellbar.style.boxShadow = "0 4px 16px rgba(0,0,0,0.65)";
    spellbar.style.padding = "12px 24px";
    spellbar.style.borderRadius = "18px";
    for(let i=0;i<12;i++){
      const slot = document.createElement("div");
      slot.className = "spell-slot";
      slot.style.width = "56px";
      slot.style.height = "56px";
      slot.style.background = "linear-gradient(145deg,#2a1e14,#1a140d)";
      slot.style.border = "2px solid #c49a3a";
      slot.style.borderRadius = "10px";
      slot.style.display = "flex";
      slot.style.alignItems = "center";
      slot.style.justifyContent = "center";
      slot.style.fontSize = "1.5rem";
      slot.style.color = "#fff";
      slot.dataset.index = i.toString();
      slot.textContent = "";
      const number = document.createElement("div");
      number.textContent = `${i+1}`;
      number.style.position = "absolute";
      number.style.bottom = "4px";
      number.style.right = "6px";
      number.style.fontSize = "0.75rem";
      number.style.color = "#f7d09b";
      number.style.textShadow = "0 0 4px #000";
      slot.style.position = "relative";
      slot.appendChild(number);
      slot.draggable = true;
      slot.addEventListener("dragstart", (e) => {
        const spellId = slot.dataset.spellId;
        if (spellId) e.dataTransfer?.setData("spell-slot-index", i.toString());
      });
      slot.addEventListener("dragend", (e) => {
        const idx = slot.dataset.index ? parseInt(slot.dataset.index, 10) : null;
        if (idx !== null && !e.dataTransfer?.dropEffect) {
          window.dispatchEvent(new CustomEvent("spellSlotClear", { detail: { slotIndex: idx } }));
        }
      });
      slot.addEventListener("dragover", (e) => e.preventDefault());
      slot.addEventListener("drop", (e) => {
        e.preventDefault();
        const spellId = e.dataTransfer?.getData("text/plain");
        if (!spellId) return;
        slot.dataset.spellId = spellId;
        slot.innerHTML = "";
        slot.appendChild(number);
        window.dispatchEvent(new CustomEvent("spellSlotAssigned", { detail: { slotIndex: i, spellId } }));
      });
      slot.addEventListener("mouseenter", () => {
        const spellId = slot.dataset.spellId;
        const desc = slot.dataset.spellDesc;
        if (spellId) this.showTooltip(desc || spellId);
      });
      slot.addEventListener("mousemove", (e) => {
        if (this.tooltip.style.display === "block") this.positionTooltip(e as MouseEvent);
      });
      slot.addEventListener("mouseleave", () => this.hideTooltip());
      spellbar.appendChild(slot);
    }
    document.body.appendChild(spellbar);

    // Build modal (character, spellbook, talents, bags)
    this.buildModals();
    this.attachToolbar();
    this.buildLootWindow();
  }

  updatePlayerHealth(hp: number, mana?: number, maxHp?: number, maxMana?: number, xp?: number, xpToNext?: number, level?: number) {
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
    if (this.xpBar && xp !== undefined && xpToNext !== undefined) {
      this.xpBar.style.width = `${Math.max(0, Math.min(100, (xp / xpToNext) * 100))}%`;
    }
    if (this.levelText && level !== undefined) {
      this.levelText.textContent = `Lv. ${level}`;
    }
  }

  showGameOver(onRestart:()=>void){
    this.gameOverOverlay.style.display="flex";
    this.restartBtn.onclick = ()=>{
      onRestart();
      this.gameOverOverlay.style.display="none";
    }
  }

  buildModals() {
    const buildWindow = (id: string, title: string) => {
      const overlay = document.createElement("div");
      overlay.id = id;
      overlay.style.position = "fixed";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.width = "100vw";
      overlay.style.height = "100vh";
      overlay.style.background = "rgba(0,0,0,0.6)";
      overlay.style.display = "none";
      overlay.style.alignItems = "center";
      overlay.style.justifyContent = "center";
      overlay.style.zIndex = "10005";

      const windowBox = document.createElement("div");
      windowBox.style.width = "580px";
      windowBox.style.height = "420px";
      windowBox.style.background = "linear-gradient(135deg, rgba(26,18,10,0.92), rgba(14,10,6,0.95))";
      windowBox.style.border = "2px solid #c49a3a";
      windowBox.style.borderRadius = "14px";
      windowBox.style.boxShadow = "0 8px 22px rgba(0,0,0,0.75)";
      windowBox.style.display = "flex";
      windowBox.style.flexDirection = "column";
      windowBox.style.position = "absolute";
      windowBox.style.left = "50%";
      windowBox.style.top = "50%";
      windowBox.style.transform = "translate(-50%, -50%)";

      const header = document.createElement("div");
      header.style.display = "flex";
      header.style.justifyContent = "space-between";
      header.style.alignItems = "center";
      header.style.padding = "10px 12px";
      header.style.borderBottom = "1px solid #c49a3a";
      header.style.cursor = "move";
      const titleEl = document.createElement("div");
      titleEl.style.color = "#f7d09b";
      titleEl.style.fontWeight = "800";
      titleEl.textContent = title;
      header.appendChild(titleEl);
      const close = document.createElement("button");
      close.textContent = "✕";
      close.style.background = "transparent";
      close.style.color = "#f6d48b";
      close.style.border = "1px solid #c49a3a";
      close.style.borderRadius = "8px";
      close.style.padding = "4px 8px";
      close.style.cursor = "pointer";
      close.onclick = () => overlay.style.display = "none";
      header.appendChild(close);

      const content = document.createElement("div");
      content.style.flex = "1";
      content.style.position = "relative";
      content.style.padding = "12px";
      content.style.overflow = "auto";

      windowBox.appendChild(header);
      windowBox.appendChild(content);
      overlay.appendChild(windowBox);
      let isDragging = false;
      let dragOffset = { x: 0, y: 0 };
      header.addEventListener("mousedown", (e) => {
        isDragging = true;
        dragOffset = { x: e.clientX - windowBox.offsetLeft, y: e.clientY - windowBox.offsetTop };
      });
      document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        windowBox.style.left = `${e.clientX - dragOffset.x}px`;
        windowBox.style.top = `${e.clientY - dragOffset.y}px`;
        windowBox.style.transform = "translate(0,0)";
      });
      document.addEventListener("mouseup", () => isDragging = false);
      document.body.appendChild(overlay);
      return { overlay, content };
    };

    // Character modal
    this.modals.character = buildWindow("modal-character", "Character & Equipment");
    this.modals.character.content.innerHTML = `
      <div style="color:#d8c7a1;">Slots placeholder (head, chest, legs, weapon).</div>
      <div style="margin-top:8px;color:#d8c7a1;">Stats: HP, Mana, Attack, Crit (to be wired).</div>
    `;

    // Spellbook modal
    this.modals.spellbook = buildWindow("modal-spellbook", "Spellbook");
    const spellGrid = document.createElement("div");
    spellGrid.style.display = "grid";
    spellGrid.style.gridTemplateColumns = "repeat(4, 1fr)";
    spellGrid.style.gap = "8px";
    this.spellbookList = spellGrid;
    this.modals.spellbook.content.appendChild(spellGrid);

    // Talents modal
    this.modals.talents = buildWindow("modal-talents", "Talents");
    const talentList = document.createElement("div");
    talentList.style.display = "grid";
    talentList.style.gridTemplateColumns = "1fr 1fr";
    talentList.style.gap = "8px";
    this.talentsContainer = talentList;
    this.modals.talents.content.appendChild(talentList);

    // Bags modal
    this.modals.bags = buildWindow("modal-bags", "Bags");
    const goldRow = document.createElement("div");
    goldRow.style.color = "#d8c7a1";
    goldRow.style.marginTop = "6px";
    goldRow.textContent = "Gold: 0";
    this.goldDisplay = goldRow;
    this.modals.bags.content.appendChild(goldRow);
    const grid = document.createElement("div");
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(4, 1fr)";
    grid.style.gap = "6px";
    grid.style.marginTop = "8px";
    this.bagsContainer = grid;
    this.modals.bags.content.appendChild(grid);
  }

  attachToolbar() {
    const bar = document.createElement("div");
    bar.id = "wow-toolbar";
    bar.style.position = "fixed";
    bar.style.right = "18px";
    bar.style.bottom = "18px";
    bar.style.display = "flex";
    bar.style.flexDirection = "column";
    bar.style.gap = "8px";
    bar.style.zIndex = "10004";

    const buttons: { icon: string; label: string; tab: "character" | "spellbook" | "talents" | "bags" }[] = [
      { icon: "🧍", label: "Character", tab: "character" },
      { icon: "📖", label: "Spells", tab: "spellbook" },
      { icon: "🌟", label: "Talents", tab: "talents" },
      { icon: "🎒", label: "Bags", tab: "bags" },
    ];

    buttons.forEach(({ icon, label, tab }) => {
      const btn = document.createElement("button");
      btn.textContent = `${icon} ${label}`;
      btn.style.padding = "10px 12px";
      btn.style.borderRadius = "10px";
      btn.style.border = "1px solid #c49a3a";
      btn.style.background = "linear-gradient(135deg, #2a1e14, #1a120c)";
      btn.style.color = "#f6d48b";
      btn.style.fontWeight = "800";
      btn.style.cursor = "pointer";
      btn.onclick = () => this.showModal(tab);
      bar.appendChild(btn);
    });

    document.body.appendChild(bar);
    this.toolbar = bar;
  }

  buildLootWindow() {
    const overlay = document.createElement("div");
    overlay.id = "loot-window";
    overlay.style.position = "fixed";
    overlay.style.right = "50%";
    overlay.style.bottom = "50%";
    overlay.style.transform = "translate(50%,50%)";
    overlay.style.width = "280px";
    overlay.style.background = "linear-gradient(135deg, rgba(26,18,10,0.92), rgba(14,10,6,0.95))";
    overlay.style.border = "2px solid #c49a3a";
    overlay.style.borderRadius = "12px";
    overlay.style.boxShadow = "0 8px 22px rgba(0,0,0,0.75)";
    overlay.style.display = "none";
    overlay.style.zIndex = "10010";
    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";
    header.style.padding = "8px 10px";
    header.style.borderBottom = "1px solid #c49a3a";
    const title = document.createElement("div");
    title.style.color = "#f7d09b";
    title.style.fontWeight = "800";
    title.textContent = "Loot";
    header.appendChild(title);
    const close = document.createElement("button");
    close.textContent = "✕";
    close.style.background = "transparent";
    close.style.color = "#f6d48b";
    close.style.border = "1px solid #c49a3a";
    close.style.borderRadius = "8px";
    close.style.padding = "4px 8px";
    close.style.cursor = "pointer";
    close.onclick = () => this.hideLootWindow();
    header.appendChild(close);
    overlay.appendChild(header);
    const content = document.createElement("div");
    content.style.padding = "8px 10px";
    content.style.display = "flex";
    content.style.flexDirection = "column";
    content.style.gap = "6px";
    overlay.appendChild(content);
    const pager = document.createElement("div");
    pager.style.display = "flex";
    pager.style.justifyContent = "space-between";
    pager.style.marginTop = "6px";
    const prev = document.createElement("button");
    prev.textContent = "<";
    const next = document.createElement("button");
    next.textContent = ">";
    [prev,next].forEach(btn=>{
      btn.style.background = "#2a1e14";
      btn.style.color = "#f6d48b";
      btn.style.border = "1px solid #c49a3a";
      btn.style.borderRadius = "8px";
      btn.style.padding = "4px 8px";
      btn.style.cursor = "pointer";
    });
    prev.onclick = () => this.renderLootPage(this.lootPage - 1);
    next.onclick = () => this.renderLootPage(this.lootPage + 1);
    pager.appendChild(prev);
    pager.appendChild(next);
    overlay.appendChild(pager);
    document.body.appendChild(overlay);
    this.lootOverlay = overlay;
    this.lootContent = content;
  }

  populateSpellbook(spells: { id: string; name: string; icon?: string; description?: string }[]) {
    if (!this.spellbookList) return;
    this.spellbookList.innerHTML = "";
    spells.forEach((s) => {
      const card = document.createElement("div");
      card.draggable = true;
      card.dataset.spellId = s.id;
      card.style.height = "64px";
      card.style.background = "rgba(24,18,12,0.9)";
      card.style.border = "1px solid #c49a3a";
      card.style.borderRadius = "10px";
      card.style.display = "flex";
      card.style.flexDirection = "column";
      card.style.alignItems = "center";
      card.style.justifyContent = "center";
      card.style.color = "#f6d48b";
      card.style.fontWeight = "700";
      card.textContent = s.name;
      card.addEventListener("dragstart", (e) => {
        e.dataTransfer?.setData("text/plain", s.id);
        // allow drop outside modal by disabling overlay pointer events temporarily
        Object.values(this.modals).forEach(m => m.overlay.style.pointerEvents = "none");
      });
      card.addEventListener("dragend", () => {
        Object.values(this.modals).forEach(m => m.overlay.style.pointerEvents = "auto");
      });
      this.attachTooltip(card, s.description || s.name);
      this.spellbookList.appendChild(card);
    });
  }

  showModal(tab: "character" | "spellbook" | "talents" | "bags" = "spellbook") {
    const entry = this.modals[tab];
    if (entry) {
      Object.values(this.modals).forEach(m => m.overlay.style.display = "none");
      entry.overlay.style.display = "flex";
    }
  }

  hideModal() {
    Object.values(this.modals).forEach(m => m.overlay.style.display = "none");
  }

  populateBags(items: { name: string; icon?: string }[], gold: number) {
    if (this.goldDisplay) this.goldDisplay.textContent = `Gold: ${gold}`;
    if (!this.bagsContainer) return;
    this.bagsContainer.innerHTML = "";
    for (let i = 0; i < 24; i++) {
      const slot = document.createElement("div");
      slot.style.height = "52px";
      slot.style.background = "rgba(24,18,12,0.9)";
      slot.style.border = "1px solid #c49a3a";
      slot.style.borderRadius = "8px";
      slot.style.display = "flex";
      slot.style.alignItems = "center";
      slot.style.justifyContent = "center";
      slot.style.color = "#f6d48b";
      slot.style.fontSize = "0.85rem";
      const item = items[i];
      slot.textContent = item ? item.name : "";
      this.attachTooltip(slot, item ? this.formatItemTooltip(item) : "Empty slot");
      slot.dataset.bagIndex = i.toString();
      slot.addEventListener("dragover", e => e.preventDefault());
      slot.addEventListener("drop", (e) => {
        e.preventDefault();
        const itemId = e.dataTransfer?.getData("item-id");
        const fromEquip = e.dataTransfer?.getData("from-equip") === "true";
        if (itemId) {
          window.dispatchEvent(new CustomEvent("inventoryMove", { detail: { itemId, to: "bag", toSlot: i, from: fromEquip ? "equip" : "bag" } }));
        }
      });
      slot.addEventListener("dragstart", (e) => {
        if (!item) return;
        e.dataTransfer?.setData("item-id", item.id);
        e.dataTransfer?.setData("from-equip", "false");
      });
      slot.addEventListener("dragend", (e) => {
        const itemId = e.dataTransfer?.getData("item-id");
        if (itemId && (!e.dataTransfer?.dropEffect || e.dataTransfer.dropEffect === "none")) {
          // dropped nowhere -> delete
          window.dispatchEvent(new CustomEvent("inventoryMove", { detail: { itemId, from: "bag", to: "void" } }));
        }
      });
      slot.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        if (!item) return;
        // only use if item has use function (has tooltip containing "Restores" or similar). Here rely on data attr
        window.dispatchEvent(new CustomEvent("inventoryMove", { detail: { itemId: item.id, from: "bag", to: "use" } }));
      });
      this.bagsContainer.appendChild(slot);
    }
  }

  populateTalents(talents: { id: string; name: string; description?: string }[], learned: Set<string>) {
    if (!this.talentsContainer) return;
    this.talentsContainer.innerHTML = "";
    talents.forEach((t) => {
      const card = document.createElement("div");
      card.style.background = "rgba(24,18,12,0.9)";
      card.style.border = "1px solid #c49a3a";
      card.style.borderRadius = "8px";
      card.style.padding = "8px";
      const title = document.createElement("div");
      title.style.color = "#f6d48b";
      title.style.fontWeight = "800";
      title.textContent = t.name;
      const desc = document.createElement("div");
      desc.style.color = "#d8c7a1";
      desc.style.fontSize = "0.9rem";
      desc.style.marginTop = "4px";
      desc.textContent = t.description ?? "";
      card.title = t.description ?? t.name;
      const btn = document.createElement("button");
      btn.textContent = learned.has(t.id) ? "Learned" : "Learn";
      btn.disabled = learned.has(t.id);
      btn.style.marginTop = "6px";
      btn.style.padding = "6px 8px";
      btn.style.borderRadius = "8px";
      btn.style.border = "1px solid #c49a3a";
      btn.style.background = learned.has(t.id) ? "#2b1a0f" : "#3a2a18";
      btn.style.color = "#f6d48b";
      btn.style.cursor = learned.has(t.id) ? "default" : "pointer";
      btn.onclick = () => {
        window.dispatchEvent(new CustomEvent("learnTalent", { detail: { talentId: t.id } }));
      };
      card.appendChild(title);
      card.appendChild(desc);
      card.appendChild(btn);
      this.attachTooltip(card, t.description ?? t.name);
      this.talentsContainer.appendChild(card);
    });
  }

  populateEquipment(equipment: Record<string, any>) {
    const equipPane = this.modals.character?.content;
    if (!equipPane) return;
    equipPane.innerHTML = "";
    const title = document.createElement("div");
    title.style.color = "#f7d09b";
    title.style.fontWeight = "800";
    title.textContent = "Equipment";
    equipPane.appendChild(title);
    const grid = document.createElement("div");
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(3, 1fr)";
    grid.style.gap = "6px";
    const slots = ["head","chest","legs","hands","feet","weapon","offhand"];
    slots.forEach(slot => {
      const cell = document.createElement("div");
      cell.style.height = "52px";
      cell.style.background = "rgba(24,18,12,0.9)";
      cell.style.border = "1px solid #c49a3a";
      cell.style.borderRadius = "8px";
      cell.style.display = "flex";
      cell.style.alignItems = "center";
      cell.style.justifyContent = "center";
      cell.style.color = "#f6d48b";
      cell.style.fontSize = "0.85rem";
      const itemObj = equipment[slot];
      cell.textContent = itemObj ? itemObj.name : `${slot.toUpperCase()} (empty)`;
      this.attachTooltip(cell, itemObj ? this.formatItemTooltip(itemObj) : `${slot} slot empty`);
      cell.dataset.equipSlot = slot;
      cell.addEventListener("dragover", e => e.preventDefault());
      cell.addEventListener("drop", (e) => {
        e.preventDefault();
        const itemIdDrop = e.dataTransfer?.getData("item-id");
        if (itemIdDrop) {
          window.dispatchEvent(new CustomEvent("inventoryMove", { detail: { itemId: itemIdDrop, to: "equip", toSlot: slot, from: "bag" } }));
        }
      });
      cell.addEventListener("dragstart", (e) => {
        if (!itemObj?.id) return;
        e.dataTransfer?.setData("item-id", itemObj.id);
        e.dataTransfer?.setData("from-equip", "true");
      });
      cell.draggable = !!itemObj;
      cell.addEventListener("dragend", (e) => {
        if (!itemObj?.id) return;
        if (!e.dataTransfer?.dropEffect) {
            window.dispatchEvent(new CustomEvent("inventoryMove", { detail: { itemId: itemObj.id, from: "equip", to: "void" } }));
        }
      });
      grid.appendChild(cell);
    });
    equipPane.appendChild(grid);
  }

  formatItemTooltip(item: any) {
    if (!item) return "Unknown item";
    const lines = [item.name || "Item"];
    if (item.description) lines.push(item.description);
    if (item.stats) {
      const stats: string[] = [];
      Object.entries(item.stats).forEach(([k, v]) => {
        stats.push(`+${v} ${k}`);
      });
      if (stats.length) lines.push(stats.join(", "));
    }
    return lines.join("\n");
  }

  attachTooltip(el: HTMLElement, text: string) {
    el.addEventListener("mouseenter", (e) => {
      if (!text) return;
      this.showTooltip(text, e as MouseEvent);
    });
    el.addEventListener("mousemove", (e) => {
      if (this.tooltip.style.display === "block") this.positionTooltip(e as MouseEvent);
    });
    el.addEventListener("mouseleave", () => {
      this.hideTooltip();
    });
  }

  showTooltip(text: string, e?: MouseEvent) {
    if (!text) return;
    this.tooltip.textContent = text;
    this.tooltip.style.display = "block";
    if (e) this.positionTooltip(e);
  }

  hideTooltip() {
    this.tooltip.style.display = "none";
  }

  positionTooltip(e: MouseEvent) {
    const padding = 12;
    const maxX = window.innerWidth - 200;
    const x = Math.min(e.clientX + 16, maxX);
    const y = e.clientY + 16;
    this.tooltip.style.left = `${x}px`;
    this.tooltip.style.top = `${y}px`;
  }

  showLootWindow(items: any[], onTake: (id: string)=>void) {
    if (!this.lootOverlay) this.buildLootWindow();
    // normalize items (can be ids or objects)
    this.lootItems = items.map((it: any) => {
      if (!it) return null;
      if (typeof it === "string") {
        if (it.startsWith("gold_")) {
          const amt = parseInt(it.replace("gold_",""),10) || 0;
          return { id: it, name: `${amt} Gold`, description: "Currency" };
        }
        return { id: it, name: it };
      }
      return it;
    }).filter(Boolean);
    this.lootOnTake = onTake;
    this.lootPage = 0;
    this.renderLootPage(0);
    this.lootOverlay.style.display = "block";
  }

  hideLootWindow() {
    if (this.lootOverlay) this.lootOverlay.style.display = "none";
    this.lootItems = [];
    this.lootOnTake = null;
  }

  renderLootPage(page: number) {
    if (!this.lootOverlay || !this.lootContent) return;
    const totalPages = Math.max(1, Math.ceil(this.lootItems.length / 3));
    this.lootPage = Math.min(Math.max(page, 0), totalPages - 1);
    this.lootContent.innerHTML = "";
    const start = this.lootPage * 3;
    const slice = this.lootItems.slice(start, start + 3);
    slice.forEach(item => {
      if (!item) return;
      const row = document.createElement("button");
      row.style.display = "flex";
      row.style.justifyContent = "space-between";
      row.style.alignItems = "center";
      row.style.background = "#2a1e14";
      row.style.color = "#f6d48b";
      row.style.border = "1px solid #c49a3a";
      row.style.borderRadius = "8px";
      row.style.padding = "6px 8px";
      row.style.cursor = "pointer";
      row.textContent = item.name || "Item";
      row.onclick = () => {
        if (this.lootOnTake) this.lootOnTake(item.id);
      };
      this.attachTooltip(row, this.formatItemTooltip(item));
      this.lootContent.appendChild(row);
    });
  }
}
