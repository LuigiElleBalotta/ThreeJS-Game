import { Item } from "./types";
import { getItemById } from "./items";
import { QuestDefinition, QuestProgressState } from "./quests";

export class UI {
    playerHealthBar: HTMLDivElement;
    gameOverOverlay: HTMLDivElement;
    restartBtn: HTMLButtonElement;

    manaBar: HTMLDivElement;
    xpBar: HTMLDivElement | null = null;
    levelText: HTMLDivElement | null = null;
    modals: Record<"character" | "spellbook" | "talents" | "bags" | "quests", { overlay: HTMLDivElement, content: HTMLDivElement }> = {} as any;
    spellbookList!: HTMLDivElement;
    bagsContainer!: HTMLDivElement;
    goldDisplay!: HTMLDivElement;
    talentsContainer!: HTMLDivElement;
    questListContainer!: HTMLDivElement;
    questDetailContainer!: HTMLDivElement;
    questTracker!: HTMLDivElement;
    toolbar!: HTMLDivElement;
    currentTab: "character" | "spellbook" | "talents" | "bags" | "quests" = "spellbook";
    tooltip!: HTMLDivElement;
    lootOverlay!: HTMLDivElement;
    lootContent!: HTMLDivElement;
    lootItems: any[] = [];
    lootPage: number = 0;
    lootOnTake: ((id: string) => void) | null = null;
    chatBox!: HTMLDivElement;
    chatList!: HTMLDivElement;
    chatInput!: HTMLInputElement;
    gossipOverlay: HTMLDivElement | null = null;
    gossipBody: HTMLDivElement | null = null;

    constructor() {
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
        this.xpBar = document.getElementById("player-xp-bar") as HTMLDivElement;
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
        spellbar.style.zIndex = "20000"; // Higher than modals
        for (let i = 0; i < 12; i++) {
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
            number.textContent = `${i + 1}`;
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
                if (spellId) {
                    e.dataTransfer?.setData("text/plain", spellId);
                    e.dataTransfer?.setData("spell-slot-index", i.toString());
                }
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
            slot.addEventListener("mousedown", (e) => e.stopPropagation());
            spellbar.appendChild(slot);
        }
        document.body.appendChild(spellbar);

        // Build modal (character, spellbook, talents, bags)
        this.buildModals();
        this.attachToolbar();
        this.buildLootWindow();
        this.bindModalHotkeys();
        this.buildChat();
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

    showGameOver(onRestart: () => void) {
        this.gameOverOverlay.style.display = "flex";
        this.restartBtn.onclick = () => {
            onRestart();
            this.gameOverOverlay.style.display = "none";
        }
    }


    private buildWindow(id: string, title: string) {
        const overlay = document.createElement("div");
        overlay.id = id;
        overlay.style.position = "fixed";
        overlay.style.top = "120px";
        overlay.style.left = "32px";
        overlay.style.transform = "none";
        overlay.style.width = "580px";
        overlay.style.height = "420px";
        overlay.style.background = "linear-gradient(135deg, rgba(26,18,10,0.92), rgba(14,10,6,0.95))";
        overlay.style.border = "2px solid #c49a3a";
        overlay.style.borderRadius = "14px";
        overlay.style.boxShadow = "0 8px 22px rgba(0,0,0,0.75)";
        overlay.style.display = "none";
        overlay.style.flexDirection = "column";
        overlay.style.zIndex = "10005";

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
        close.textContent = "x";
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

        overlay.appendChild(header);
        overlay.appendChild(content);
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };
        header.addEventListener("mousedown", (e) => {
            e.stopPropagation();
            isDragging = true;
            dragOffset = { x: e.clientX - overlay.offsetLeft, y: e.clientY - overlay.offsetTop };
        });
        document.addEventListener("mousemove", (e) => {
            if (!isDragging) return;
            overlay.style.left = `${e.clientX - dragOffset.x}px`;
            overlay.style.top = `${e.clientY - dragOffset.y}px`;
            overlay.style.transform = "translate(0,0)";
        });
        document.addEventListener("mouseup", () => isDragging = false);
        document.body.appendChild(overlay);
        return { overlay, content };
    }

    buildModals() {
        // Character modal
        this.modals.character = this.buildWindow("modal-character", "Character & Equipment");
        this.modals.character.content.innerHTML = `
      <div style="color:#d8c7a1;">Slots placeholder (head, chest, legs, weapon).</div>
      <div style="margin-top:8px;color:#d8c7a1;">Stats: HP, Mana, Attack, Crit (to be wired).</div>
    `;

        // Spellbook modal
        this.modals.spellbook = this.buildWindow("modal-spellbook", "Spellbook");
        const spellGrid = document.createElement("div");
        spellGrid.style.display = "grid";
        spellGrid.style.gridTemplateColumns = "repeat(4, 1fr)";
        spellGrid.style.gap = "8px";
        this.spellbookList = spellGrid;
        this.modals.spellbook.content.appendChild(spellGrid);

        // Talents modal
        this.modals.talents = this.buildWindow("modal-talents", "Talents");
        const talentList = document.createElement("div");
        talentList.style.display = "grid";
        talentList.style.gridTemplateColumns = "1fr 1fr";
        talentList.style.gap = "8px";
        this.talentsContainer = talentList;
        this.modals.talents.content.appendChild(talentList);

        // Bags modal
        this.modals.bags = this.buildWindow("modal-bags", "Bags");
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

        const buttons: { icon: string; label: string; tab: "character" | "spellbook" | "talents" | "bags" | "quests" }[] = [
            { icon: "🧍", label: "Character", tab: "character" },
            { icon: "📖", label: "Spells", tab: "spellbook" },
            { icon: "🌟", label: "Talents", tab: "talents" },
            { icon: "🎒", label: "Bags", tab: "bags" },
            { icon: "📜", label: "Quests", tab: "quests" },
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
            btn.onclick = () => {
                // For quests, layout is built on demand
                if (tab === "quests") {
                    // We need activeQuests to build it, so we rely on toggleQuestLog from Game, 
                    // or just toggle it here if already built. 
                    // Ideally Game handles the logic, but here we just toggle the modal visibility.
                    this.toggleModal(tab);
                } else {
                    this.toggleModal(tab);
                }
            };
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
        close.textContent = "x";
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
        [prev, next].forEach(btn => {
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
            card.addEventListener("mousedown", (e) => e.stopPropagation());
            card.addEventListener("dragstart", (e) => {
                e.dataTransfer?.setData("text/plain", s.id);
                e.dataTransfer?.setData("spell-id", s.id);
                // allow drop outside modal by disabling overlay pointer events temporarily
                // We keep them on but use CSS or specific targets
                Object.values(this.modals).forEach(m => {
                    m.overlay.style.pointerEvents = "none";
                });
            });
            card.addEventListener("dragend", () => {
                Object.values(this.modals).forEach(m => {
                    m.overlay.style.pointerEvents = "auto";
                });
            });
            this.attachTooltip(card, s.description || s.name);
            this.spellbookList.appendChild(card);
        });
    }

    showModal(tab: "character" | "spellbook" | "talents" | "bags" | "quests" = "spellbook") {
        const entry = this.modals[tab];
        if (entry) entry.overlay.style.display = "flex";
    }

    toggleModal(tab: "character" | "spellbook" | "talents" | "bags" | "quests" = "spellbook") {
        const entry = this.modals[tab];
        if (!entry) return;
        const isVisible = entry.overlay.style.display !== "none";
        entry.overlay.style.display = isVisible ? "none" : "flex";
    }

    hideModal(tab?: "character" | "spellbook" | "talents" | "bags" | "quests") {
        if (tab) {
            const entry = this.modals[tab];
            if (entry) entry.overlay.style.display = "none";
            return;
        }
        Object.values(this.modals).forEach(m => m.overlay.style.display = "none");
    }

    bindModalHotkeys() {
        window.addEventListener("keydown", (e) => {
            const target = e.target as HTMLElement | null;
            if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
            const key = e.key.toLowerCase();
            if (key === "b") this.toggleModal("bags");
            if (key === "c") this.toggleModal("character");
            if (key === "p") this.toggleModal("spellbook");
            if (key === "n") this.toggleModal("talents");
        });
    }

    buildChat() {
        const box = document.createElement("div");
        box.id = "wow-chat";
        box.style.position = "fixed";
        box.style.left = "18px";
        box.style.bottom = "110px";
        box.style.width = "360px";
        box.style.height = "200px";
        box.style.display = "flex";
        box.style.flexDirection = "column";
        box.style.background = "linear-gradient(135deg, rgba(14,10,6,0.8), rgba(22,16,10,0.9))";
        box.style.border = "2px solid #c49a3a";
        box.style.borderRadius = "12px";
        box.style.boxShadow = "0 6px 16px rgba(0,0,0,0.7)";
        box.style.zIndex = "10003";
        box.style.boxSizing = "border-box";

        const header = document.createElement("div");
        header.textContent = "Chat";
        header.style.color = "#f6d48b";
        header.style.fontWeight = "800";
        header.style.padding = "6px 10px";
        header.style.borderBottom = "1px solid #c49a3a";
        box.appendChild(header);

        const list = document.createElement("div");
        list.style.flex = "1";
        list.style.display = "flex";
        list.style.flexDirection = "column";
        list.style.gap = "4px";
        list.style.overflowY = "auto";
        list.style.padding = "8px 10px";
        list.style.boxSizing = "border-box";
        box.appendChild(list);

        const inputWrap = document.createElement("div");
        inputWrap.style.padding = "6px 10px 10px 10px";
        inputWrap.style.boxSizing = "border-box";
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "Press Enter to chat...";
        input.style.width = "100%";
        input.style.padding = "8px 10px";
        input.style.borderRadius = "8px";
        input.style.border = "1px solid #c49a3a";
        input.style.background = "#1a120c";
        input.style.color = "#f6d48b";
        input.style.outline = "none";
        input.style.boxSizing = "border-box";
        input.addEventListener("keydown", (e) => {
            e.stopPropagation();
            if (e.key === "Enter") {
                e.preventDefault();
                const text = input.value.trim();
                if (!text) return;
                this.addChatMessage("You", text);
                window.dispatchEvent(new CustomEvent("playerChat", { detail: { text } }));
                input.value = "";
                input.blur();
            }
        });
        inputWrap.appendChild(input);
        box.appendChild(inputWrap);

        document.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                const target = e.target as HTMLElement | null;
                if (target === input) return;
                input.focus();
                e.preventDefault();
            }
        });

        document.body.appendChild(box);
        this.chatBox = box;
        this.chatList = list;
        this.chatInput = input;
    }

    addChatMessage(author: string, message: string) {
        if (!this.chatList) return;
        const row = document.createElement("div");
        row.style.color = "#e6d5a3";
        row.style.fontSize = "0.95rem";
        row.innerText = `[${author}] ${message}`;
        this.chatList.appendChild(row);
        this.chatList.scrollTop = this.chatList.scrollHeight;
    }

    populateBags(items: Item[], gold: number) {
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
            if (item) {
                slot.textContent = item.name;
                slot.style.color = this.getItemColor(item);
            } else {
                slot.textContent = "";
            }
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
                // Right click: equip if it has an equipment slot, otherwise use
                if ((item as any).slot) {
                    window.dispatchEvent(new CustomEvent("inventoryMove", { detail: { itemId: item.id, from: "bag", to: "equip", toSlot: (item as any).slot } }));
                } else {
                    window.dispatchEvent(new CustomEvent("inventoryMove", { detail: { itemId: item.id, from: "bag", to: "use" } }));
                }
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
        const slots = ["head", "chest", "legs", "hands", "feet", "weapon", "offhand"];
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
            cell.style.color = itemObj ? this.getItemColor(itemObj) : cell.style.color;
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
        const rarity = this.getItemRarity(item);
        const rarityLabel = rarity ? rarity.toUpperCase() : "";
        const bop = item.bindOnPickup ? "[BoP]" : "";
        const lines = [`${item.name || "Item"} ${bop} ${rarityLabel}`.trim()];
        if (item.slot) lines.push(`Slot: ${item.slot}`);
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

    private getItemRarity(item: any): Item["rarity"] {
        if (!item) return undefined;
        if (typeof item === "string") return undefined;
        if (item.id && typeof item.id === "string" && item.id.startsWith("gold_")) return "gold";
        return item.rarity || "common";
    }

    private getItemColor(item: any): string {
        const rarity = this.getItemRarity(item);
        switch (rarity) {
            case "gold": return "#d4af37";
            case "uncommon": return "#1eff00";
            case "rare": return "#0070dd";
            case "epic": return "#a335ee";
            case "legendary": return "#ff8000";
            case "common":
            default:
                return "#9d9d9d";
        }
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


    updateQuestTracker(activeQuests: QuestProgressState[], definitions: Record<string, QuestDefinition>) {
        // Create tracker if not exists
        if (!this.questTracker) {
            const tracker = document.createElement("div");
            tracker.id = "quest-tracker";
            tracker.style.position = "fixed";
            tracker.style.right = "10px";
            tracker.style.top = "200px";
            tracker.style.width = "250px";
            tracker.style.display = "flex";
            tracker.style.flexDirection = "column";
            tracker.style.gap = "8px";
            tracker.style.pointerEvents = "none";
            tracker.style.fontFamily = "sans-serif";
            document.body.appendChild(tracker);
            this.questTracker = tracker;
        }

        this.questTracker.innerHTML = "";
        if (activeQuests.length === 0) return;

        const title = document.createElement("div");
        title.textContent = "Quests";
        title.style.color = "#f7d09b";
        title.style.fontWeight = "bold";
        title.style.fontSize = "1.1rem";
        title.style.marginBottom = "4px";
        title.style.textShadow = "1px 1px 2px black";
        this.questTracker.appendChild(title);

        activeQuests.forEach(q => {
            const def = definitions[q.questId];
            if (!def) return;
            const qDiv = document.createElement("div");
            qDiv.style.color = "#fff";
            qDiv.style.textShadow = "1px 1px 1px black";

            const qTitle = document.createElement("div");
            qTitle.textContent = def.title;
            qTitle.style.color = "#ffd700";
            qTitle.style.fontWeight = "bold";
            qDiv.appendChild(qTitle);

            def.objectives.forEach((obj, idx) => {
                const current = (q.progress && q.progress[idx]) || 0;
                const objDiv = document.createElement("div");
                objDiv.style.fontSize = "0.9rem";
                objDiv.style.marginLeft = "8px";
                if (obj.type === "kill") {
                    objDiv.textContent = `- Kill ${obj.targetId} (${current}/${obj.count})`;
                    if (current >= obj.count) {
                        objDiv.style.color = "#88ff88";
                        objDiv.textContent += " (Done)";
                    }
                } else if (obj.type === "escort") {
                    objDiv.textContent = `- Escort ${obj.targetSpawnId}`;
                    if (current >= 1) {
                        objDiv.style.color = "#88ff88";
                        objDiv.textContent += " (Done)";
                    }
                }
                qDiv.appendChild(objDiv);
            });

            if (q.status === "completed") {
                const comp = document.createElement("div");
                comp.textContent = "(Return to Quest Giver)";
                comp.style.color = "#00ff00";
                comp.style.fontSize = "0.9rem";
                comp.style.marginLeft = "8px";
                qDiv.appendChild(comp);
            }

            this.questTracker.appendChild(qDiv);
        });
    }

    buildQuestLog(activeQuests: QuestProgressState[], definitions: Record<string, QuestDefinition>) {
        if (!this.modals.quests) {
            this.modals.quests = this.buildWindow("modal-quests", "Quest Log");
            const container = document.createElement("div");
            container.style.display = "flex";
            container.style.height = "100%";
            container.style.gap = "10px";

            // Sidebar
            const list = document.createElement("div");
            list.style.width = "150px";
            list.style.borderRight = "1px solid #c49a3a";
            list.style.overflowY = "auto";
            this.questListContainer = list;

            // Details
            const details = document.createElement("div");
            details.style.flex = "1";
            details.style.overflowY = "auto";
            details.style.padding = "0 8px";
            this.questDetailContainer = details;

            container.appendChild(list);
            container.appendChild(details);
            this.modals.quests.content.appendChild(container);
        }

        // Populate list
        this.questListContainer.innerHTML = "";
        activeQuests.forEach(q => {
            const def = definitions[q.questId];
            if (!def) return;
            const btn = document.createElement("div");
            btn.textContent = def.title;
            btn.style.padding = "6px";
            btn.style.cursor = "pointer";
            btn.style.color = "#f6d48b";
            btn.style.borderBottom = "1px solid rgba(196, 154, 58, 0.3)";

            if (q.status === "completed") btn.style.color = "#88ff88";

            btn.onclick = () => {
                this.questDetailContainer.innerHTML = "";
                const title = document.createElement("h3");
                title.textContent = def.title;
                title.style.color = "#fff";
                const desc = document.createElement("p");
                desc.textContent = def.description;
                desc.style.color = "#d8c7a1";
                desc.style.fontSize = "0.9rem";

                this.questDetailContainer.appendChild(title);
                this.questDetailContainer.appendChild(desc);

                const objHeader = document.createElement("div");
                objHeader.textContent = "Objectives:";
                objHeader.style.marginTop = "10px";
                objHeader.style.fontWeight = "bold";
                objHeader.style.color = "#fff";
                this.questDetailContainer.appendChild(objHeader);

                def.objectives.forEach((obj, idx) => {
                    const current = (q.progress && q.progress[idx]) || 0;
                    const line = document.createElement("div");
                    if (obj.type === "kill") {
                        line.textContent = `- Kill ${obj.targetId}: ${current}/${obj.count}`;
                    } else {
                        line.textContent = `- Escort ${obj.targetSpawnId}`;
                    }
                    if (current >= (obj.type === "kill" ? obj.count : 1)) {
                        line.style.color = "#88ff88";
                        line.textContent += " (Complete)";
                    } else {
                        line.style.color = "#d8c7a1";
                    }
                    this.questDetailContainer.appendChild(line);
                });

                if (def.rewards) {
                    const rewHeader = document.createElement("div");
                    rewHeader.textContent = "Rewards:";
                    rewHeader.style.marginTop = "10px";
                    rewHeader.style.fontWeight = "bold";
                    rewHeader.style.color = "#fff";
                    this.questDetailContainer.appendChild(rewHeader);
                    const rewText = document.createElement("div");
                    rewText.style.color = "#d8c7a1";
                    rewText.textContent = `${def.rewards.xp || 0} XP, ${def.rewards.gold || 0} Gold`;
                    this.questDetailContainer.appendChild(rewText);
                }
            };
            this.questListContainer.appendChild(btn);
        });

        // Select first by default if empty details
        if (this.questDetailContainer.innerHTML === "" && this.questListContainer.firstChild) {
            (this.questListContainer.firstChild as HTMLElement).click();
        }
    }

    showLootWindow(items: any[], onTake: (id: string) => void) {
        if (!this.lootOverlay) this.buildLootWindow();
        // normalize items (can be ids or objects)
        this.lootItems = items.map((it: any) => {
            if (!it) return null;
            if (typeof it === "string") {
                if (it.startsWith("gold_")) {
                    const amt = parseInt(it.replace("gold_", ""), 10) || 0;
                    return { id: it, name: `${amt} Gold`, description: "Currency", rarity: "gold" as const };
                }
                const itemObj = getItemById(it);
                if (itemObj) return itemObj;
                return { id: it, name: it, rarity: "common" as const };
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

    showGossip(title: string, text: string, options: { id: string; text: string }[], onSelect: (id: string) => void) {
        if (!this.gossipOverlay) {
            const overlay = document.createElement("div");
            overlay.id = "gossip-window";
            overlay.style.position = "fixed";
            overlay.style.top = "50%";
            overlay.style.left = "50%";
            overlay.style.transform = "translate(-50%, -50%)";
            overlay.style.width = "380px";
            overlay.style.height = "480px";
            overlay.style.background = "url('/ui/parchment-bg.jpg'), linear-gradient(180deg,#e6d2a5,#d0b37b)";
            overlay.style.border = "2px solid #5a3a1a";
            overlay.style.borderRadius = "10px";
            overlay.style.boxShadow = "0 8px 22px rgba(0,0,0,0.75)";
            overlay.style.display = "none";
            overlay.style.zIndex = "10007";
            overlay.style.padding = "14px";
            overlay.style.color = "#3b230c";

            const header = document.createElement("div");
            header.style.display = "flex";
            header.style.justifyContent = "space-between";
            header.style.alignItems = "center";
            header.style.marginBottom = "8px";
            const titleEl = document.createElement("div");
            titleEl.id = "gossip-title";
            titleEl.style.fontWeight = "800";
            titleEl.style.fontSize = "1.05rem";
            titleEl.style.color = "#2c1b0b";
            const close = document.createElement("button");
            close.textContent = "×";
            close.style.background = "transparent";
            close.style.border = "none";
            close.style.fontSize = "1.2rem";
            close.style.cursor = "pointer";
            close.onclick = () => this.hideGossip();
            header.appendChild(titleEl);
            header.appendChild(close);
            overlay.appendChild(header);

            const body = document.createElement("div");
            body.id = "gossip-body";
            body.style.flex = "1";
            body.style.overflowY = "auto";
            body.style.padding = "8px 4px";
            overlay.appendChild(body);

            this.gossipOverlay = overlay;
            this.gossipBody = body;
            document.body.appendChild(overlay);
        }

        if (!this.gossipOverlay || !this.gossipBody) return;
        this.gossipOverlay.style.display = "block";
        const titleEl = this.gossipOverlay.querySelector("#gossip-title") as HTMLDivElement;
        if (titleEl) titleEl.textContent = title;
        this.gossipBody.innerHTML = "";

        const greeting = document.createElement("div");
        greeting.style.margin = "6px 0 10px 0";
        greeting.style.fontSize = "0.95rem";
        greeting.textContent = text;
        this.gossipBody.appendChild(greeting);

        const section = document.createElement("div");
        section.style.marginTop = "10px";
        section.style.fontWeight = "700";
        section.style.color = "#2c1b0b";
        section.textContent = "Topics";
        this.gossipBody.appendChild(section);

        options.forEach(opt => {
            const btn = document.createElement("button");
            btn.textContent = opt.text;
            btn.style.display = "block";
            btn.style.width = "100%";
            btn.style.textAlign = "left";
            btn.style.margin = "6px 0";
            btn.style.padding = "8px 10px";
            btn.style.background = "rgba(255,255,255,0.6)";
            btn.style.border = "1px solid #b48b54";
            btn.style.borderRadius = "8px";
            btn.style.cursor = "pointer";
            btn.style.color = "#2c1b0b";
            btn.onmouseenter = () => btn.style.background = "rgba(255,255,200,0.8)";
            btn.onmouseleave = () => btn.style.background = "rgba(255,255,255,0.6)";
            btn.onclick = () => onSelect(opt.id);
            this.gossipBody!.appendChild(btn);
        });

        const footer = document.createElement("div");
        footer.style.marginTop = "14px";
        footer.style.textAlign = "right";
        const bye = document.createElement("button");
        bye.textContent = "Goodbye";
        bye.style.padding = "6px 10px";
        bye.style.background = "#b25c00";
        bye.style.color = "#fff";
        bye.style.border = "1px solid #7a3c00";
        bye.style.borderRadius = "6px";
        bye.style.cursor = "pointer";
        bye.onclick = () => this.hideGossip();
        footer.appendChild(bye);
        this.gossipBody.appendChild(footer);
    }

    hideGossip() {
        if (this.gossipOverlay) this.gossipOverlay.style.display = "none";
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
            row.style.color = this.getItemColor(item);
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
