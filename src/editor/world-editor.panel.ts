import type { Game } from "../game";
import {
  clearImportedUnityDecorations,
  getImportedUnityDecorations,
  getUnityDecorations,
  importUnityDecorationsFromCatalogJson,
} from "../world/unity-decor-catalog";

type TerrainOption = { label: string; value: string };
type MenuItem = { label: string; action: () => void; enabled?: boolean };

const TERRAIN_OPTIONS: TerrainOption[] = [
  { label: "Durotar Dirt", value: "/unity-import/Tilesets/durotar/durotardirt.png" },
  { label: "Cracked Soil", value: "/unity-import/Asset Packs/Terrain Textures/TT_Cracked Soil.png" },
  { label: "Cobblestone Dark", value: "/unity-import/Asset Packs/Terrain Textures/TT_Cobblestone Floor Dark.png" },
  { label: "Cliff", value: "/unity-import/Asset Packs/Terrain Textures/TT_Cliff.jpg" },
];

function panelBase(el: HTMLDivElement) {
  el.style.position = "fixed";
  el.style.background = "#1b1f26";
  el.style.border = "1px solid #2f3744";
  el.style.boxShadow = "0 6px 24px rgba(0,0,0,0.35)";
  el.style.color = "#e8edf2";
  el.style.fontFamily = "Segoe UI, Arial, sans-serif";
  el.style.zIndex = "100120";
  el.style.pointerEvents = "auto";
}

function sectionTitle(text: string) {
  const t = document.createElement("div");
  t.textContent = text;
  t.style.fontSize = "11px";
  t.style.fontWeight = "700";
  t.style.letterSpacing = "0.05em";
  t.style.textTransform = "uppercase";
  t.style.color = "#aab7c6";
  return t;
}

function toolButton(label: string, active: boolean = false) {
  const btn = document.createElement("button");
  btn.textContent = label;
  btn.style.height = "26px";
  btn.style.padding = "0 10px";
  btn.style.borderRadius = "4px";
  btn.style.border = `1px solid ${active ? "#4a81ff" : "#3a4351"}`;
  btn.style.background = active ? "#264d98" : "#232b36";
  btn.style.color = "#edf2f8";
  btn.style.fontSize = "11px";
  btn.style.fontWeight = "600";
  btn.style.cursor = "pointer";
  return btn;
}

function numberInput() {
  const input = document.createElement("input");
  input.type = "number";
  input.step = "0.01";
  input.style.width = "100%";
  input.style.height = "22px";
  input.style.padding = "0 6px";
  input.style.boxSizing = "border-box";
  input.style.lineHeight = "22px";
  input.style.border = "1px solid #3b4554";
  input.style.borderRadius = "3px";
  input.style.background = "#11161d";
  input.style.color = "#e6edf3";
  input.style.fontSize = "11px";
  return input;
}

function inspectorCard(title: string) {
  const wrap = document.createElement("div");
  wrap.style.background = "#151a22";
  wrap.style.border = "1px solid #2d3644";
  wrap.style.borderRadius = "4px";
  wrap.style.overflow = "hidden";

  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.height = "26px";
  header.style.padding = "0 8px";
  header.style.background = "#202734";
  header.style.borderBottom = "1px solid #2d3644";

  const fold = document.createElement("span");
  fold.textContent = "v";
  fold.style.fontSize = "9px";
  fold.style.marginRight = "6px";
  fold.style.color = "#b9c5d3";

  const txt = document.createElement("span");
  txt.textContent = title;
  txt.style.fontSize = "11px";
  txt.style.fontWeight = "600";
  txt.style.color = "#e6edf3";

  header.append(fold, txt);

  const body = document.createElement("div");
  body.style.padding = "8px";
  body.style.display = "grid";
  body.style.gap = "6px";

  let opened = true;
  header.style.cursor = "pointer";
  header.onclick = () => {
    opened = !opened;
    fold.textContent = opened ? "v" : ">";
    body.style.display = opened ? "grid" : "none";
  };

  wrap.append(header, body);
  return { wrap, body };
}

export function createWorldEditorPanel(game: Game) {
  const root = document.createElement("div");
  root.id = "world-editor-panel";
  root.style.position = "fixed";
  root.style.inset = "0";
  root.style.pointerEvents = "none";
  root.style.zIndex = "100119";

  // Prevent editor UI interactions from reaching global game input listeners.
  const swallow = (ev: Event) => ev.stopPropagation();
  for (const eventName of ["mousedown", "mouseup", "click", "dblclick", "pointerdown", "pointerup", "wheel", "touchstart", "touchend"]) {
    root.addEventListener(eventName, swallow, true);
  }

  const top = document.createElement("div");
  panelBase(top);
  top.style.top = "0";
  top.style.left = "0";
  top.style.right = "0";
  top.style.height = "42px";
  top.style.display = "flex";
  top.style.alignItems = "center";
  top.style.gap = "6px";
  top.style.padding = "0 8px";
  root.appendChild(top);

  const left = document.createElement("div");
  panelBase(left);
  left.style.top = "42px";
  left.style.left = "0";
  left.style.width = "300px";
  left.style.bottom = "230px";
  left.style.display = "grid";
  left.style.gridTemplateRows = "30px 1fr";
  root.appendChild(left);

  const right = document.createElement("div");
  panelBase(right);
  right.style.top = "42px";
  right.style.right = "0";
  right.style.width = "360px";
  right.style.bottom = "230px";
  right.style.display = "grid";
  right.style.gridTemplateRows = "30px auto auto";
  right.style.alignContent = "start";
  right.style.overflowY = "auto";
  right.style.gap = "8px";
  right.style.padding = "8px";
  root.appendChild(right);

  const bottom = document.createElement("div");
  panelBase(bottom);
  bottom.style.left = "0";
  bottom.style.right = "0";
  bottom.style.bottom = "0";
  bottom.style.height = "230px";
  bottom.style.display = "grid";
  bottom.style.gridTemplateRows = "30px 1fr";
  root.appendChild(bottom);

  const brand = document.createElement("div");
  brand.textContent = "World Editor";
  brand.style.fontWeight = "700";
  brand.style.fontSize = "13px";
  brand.style.marginRight = "8px";
  top.appendChild(brand);

  const btnSave = toolButton("Save");
  btnSave.onclick = () => game.saveWorldDecorPlacements();
  const btnUndo = toolButton("Undo");
  btnUndo.onclick = () => game.editorUndo();
  const btnRedo = toolButton("Redo");
  btnRedo.onclick = () => game.editorRedo();
  const btnDefaults = toolButton("Defaults");
  btnDefaults.onclick = () => game.editorResetDecorationsToDefaults();
  const btnClear = toolButton("Clear");
  btnClear.onclick = () => game.editorClearDecorations();
  const btnUnhide = toolButton("Unhide Map");
  btnUnhide.onclick = () => game.editorUnhideAllWorldModels();
  const btnImportCatalog = toolButton("Import Catalog");
  const btnResetImported = toolButton("Reset Imported");
  top.append(btnSave, btnUndo, btnRedo, btnDefaults, btnClear, btnUnhide, btnImportCatalog, btnResetImported);

  const topSpacer = document.createElement("div");
  topSpacer.style.flex = "1";
  top.appendChild(topSpacer);

  const hotkeys = document.createElement("div");
  hotkeys.textContent = "Q Context | W/E/R Transform | F Focus | Del Remove | RMB+WASD Fly";
  hotkeys.style.fontSize = "10px";
  hotkeys.style.color = "#9fb0c1";
  top.appendChild(hotkeys);

  const leftHeader = document.createElement("div");
  leftHeader.style.display = "flex";
  leftHeader.style.alignItems = "center";
  leftHeader.style.padding = "0 10px";
  leftHeader.style.borderBottom = "1px solid #2a3340";
  leftHeader.appendChild(sectionTitle("Hierarchy"));
  left.appendChild(leftHeader);

  const hierarchy = document.createElement("div");
  hierarchy.style.overflow = "auto";
  hierarchy.style.padding = "6px";
  left.appendChild(hierarchy);

  const rightHeader = document.createElement("div");
  rightHeader.style.display = "flex";
  rightHeader.style.alignItems = "center";
  rightHeader.style.borderBottom = "1px solid #2a3340";
  rightHeader.appendChild(sectionTitle("Inspector"));
  right.appendChild(rightHeader);

  const selectedLabel = document.createElement("div");
  selectedLabel.textContent = "No selection";
  selectedLabel.style.fontSize = "12px";
  selectedLabel.style.color = "#c4d0dd";
  selectedLabel.style.padding = "2px 2px 0";
  right.appendChild(selectedLabel);

  const transformCard = inspectorCard("Transform");
  right.appendChild(transformCard.wrap);

  const transformToolbar = document.createElement("div");
  transformToolbar.style.display = "grid";
  transformToolbar.style.gridTemplateColumns = "repeat(7, minmax(0, 1fr))";
  transformToolbar.style.gap = "4px";
  const btnMove = toolButton("Move", true);
  const btnRotate = toolButton("Rotate");
  const btnScale = toolButton("Scale");
  const btnLocal = toolButton("Local", true);
  const btnWorld = toolButton("World");
  const btnFocus = toolButton("Focus");
  const btnDelete = toolButton("Delete");
  transformToolbar.append(btnMove, btnRotate, btnScale, btnLocal, btnWorld, btnFocus, btnDelete);
  transformCard.body.appendChild(transformToolbar);

  const axisHeader = document.createElement("div");
  axisHeader.style.display = "grid";
  axisHeader.style.gridTemplateColumns = "44px 1fr 1fr 1fr";
  axisHeader.style.gap = "6px";
  const axisPad = document.createElement("div");
  const ax = document.createElement("div");
  const ay = document.createElement("div");
  const az = document.createElement("div");
  [ax, ay, az].forEach((n, i) => {
    n.textContent = i === 0 ? "X" : i === 1 ? "Y" : "Z";
    n.style.fontSize = "10px";
    n.style.fontWeight = "700";
    n.style.color = "#8ea0b2";
    n.style.textAlign = "center";
  });
  axisHeader.append(axisPad, ax, ay, az);
  transformCard.body.appendChild(axisHeader);

  const px = numberInput(); const py = numberInput(); const pz = numberInput();
  const rx = numberInput(); const ry = numberInput(); const rz = numberInput();
  const sx = numberInput(); const sy = numberInput(); const sz = numberInput();

  const rowMaker = (name: string, a: HTMLInputElement, b: HTMLInputElement, c: HTMLInputElement) => {
    const row = document.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "44px 1fr 1fr 1fr";
    row.style.gap = "6px";
    row.style.alignItems = "center";
    const l = document.createElement("div");
    l.textContent = name;
    l.style.fontSize = "11px";
    l.style.color = "#9fb0c1";
    row.append(l, a, b, c);
    return row;
  };
  transformCard.body.append(
    rowMaker("Position", px, py, pz),
    rowMaker("Rotation", rx, ry, rz),
    rowMaker("Scale", sx, sy, sz),
  );

  const snapRow = document.createElement("div");
  snapRow.style.display = "grid";
  snapRow.style.gridTemplateColumns = "72px 1fr 1fr 1fr";
  snapRow.style.gap = "6px";
  snapRow.style.alignItems = "center";
  const snapToggle = document.createElement("input");
  snapToggle.type = "checkbox";
  snapToggle.checked = game.editorSnapEnabled;
  const snapTitle = document.createElement("label");
  snapTitle.textContent = "Snap";
  snapTitle.style.fontSize = "11px";
  snapTitle.style.color = "#9fb0c1";
  const snapHeaderWrap = document.createElement("div");
  snapHeaderWrap.style.display = "flex";
  snapHeaderWrap.style.alignItems = "center";
  snapHeaderWrap.style.gap = "6px";
  snapHeaderWrap.append(snapToggle, snapTitle);

  const sm = numberInput(); sm.value = `${game.editorTranslationSnap}`; sm.title = "Move snap";
  const sr = numberInput(); sr.value = `${game.editorRotationSnapDeg}`; sr.title = "Rotate snap (deg)";
  const ss = numberInput(); ss.value = `${game.editorScaleSnap}`; ss.title = "Scale snap";
  snapRow.append(snapHeaderWrap, sm, sr, ss);
  transformCard.body.appendChild(snapRow);

  const infoCard = inspectorCard("Selection");
  right.appendChild(infoCard.wrap);
  const sourceLabel = document.createElement("div");
  sourceLabel.style.fontSize = "11px";
  sourceLabel.style.color = "#8ea0b2";
  const hint = document.createElement("div");
  hint.style.fontSize = "10px";
  hint.style.color = "#6f8298";
  hint.textContent = "Tip: tasto destro su Hierarchy/Scene per menu contestuale.";
  infoCard.body.append(sourceLabel, hint);

  const applyTransformModeUi = () => {
    btnMove.style.background = game.editorTransformMode === "translate" ? "#264d98" : "#232b36";
    btnRotate.style.background = game.editorTransformMode === "rotate" ? "#264d98" : "#232b36";
    btnScale.style.background = game.editorTransformMode === "scale" ? "#264d98" : "#232b36";
    btnLocal.style.background = game.editorTransformSpace === "local" ? "#264d98" : "#232b36";
    btnWorld.style.background = game.editorTransformSpace === "world" ? "#264d98" : "#232b36";
  };

  btnMove.onclick = () => { game.editorSetTransformMode("translate"); applyTransformModeUi(); };
  btnRotate.onclick = () => { game.editorSetTransformMode("rotate"); applyTransformModeUi(); };
  btnScale.onclick = () => { game.editorSetTransformMode("scale"); applyTransformModeUi(); };
  btnLocal.onclick = () => { game.editorSetTransformSpace("local"); applyTransformModeUi(); };
  btnWorld.onclick = () => { game.editorSetTransformSpace("world"); applyTransformModeUi(); };
  btnFocus.onclick = () => game.editorFocusSelection();
  btnDelete.onclick = () => game.removeSelectedEditorDecoration();

  snapToggle.onchange = () => game.editorSetSnapEnabled(snapToggle.checked);
  const applySnap = () => {
    game.editorSetSnapValues(parseFloat(sm.value) || 0.5, parseFloat(sr.value) || 15, parseFloat(ss.value) || 0.1);
  };
  sm.onchange = applySnap;
  sr.onchange = applySnap;
  ss.onchange = applySnap;

  const applyTransform = () => {
    game.setEditorSelectionTransform({
      position: { x: parseFloat(px.value), y: parseFloat(py.value), z: parseFloat(pz.value) },
      rotation: { x: parseFloat(rx.value), y: parseFloat(ry.value), z: parseFloat(rz.value) },
      scale: { x: parseFloat(sx.value), y: parseFloat(sy.value), z: parseFloat(sz.value) },
    });
  };
  [px, py, pz, rx, ry, rz, sx, sy, sz].forEach((input) => {
    input.onchange = applyTransform;
  });

  const bottomHeader = document.createElement("div");
  bottomHeader.style.display = "flex";
  bottomHeader.style.alignItems = "center";
  bottomHeader.style.gap = "10px";
  bottomHeader.style.padding = "0 10px";
  bottomHeader.style.borderBottom = "1px solid #2a3340";
  bottomHeader.appendChild(sectionTitle("Project / Assets"));
  const assetSearch = document.createElement("input");
  assetSearch.type = "text";
  assetSearch.placeholder = "Search assets (id/path)...";
  assetSearch.style.height = "24px";
  assetSearch.style.width = "260px";
  assetSearch.style.padding = "0 8px";
  assetSearch.style.border = "1px solid #3b4554";
  assetSearch.style.borderRadius = "4px";
  assetSearch.style.background = "#11161d";
  assetSearch.style.color = "#e6edf3";
  assetSearch.style.fontSize = "11px";
  bottomHeader.appendChild(assetSearch);
  const categoryFilter = document.createElement("select");
  categoryFilter.style.height = "24px";
  categoryFilter.style.padding = "0 8px";
  categoryFilter.style.border = "1px solid #3b4554";
  categoryFilter.style.borderRadius = "4px";
  categoryFilter.style.background = "#11161d";
  categoryFilter.style.color = "#e6edf3";
  categoryFilter.style.fontSize = "11px";
  const categoryOptions = [
    ["all", "All"],
    ["manual", "Manual"],
    ["auto", "Auto"],
    ["wmo", "WMO"],
    ["world", "World"],
    ["maps", "Maps"],
    ["creature", "Creature"],
    ["item", "Item"],
    ["spell", "Spell"],
  ];
  for (const [value, label] of categoryOptions) {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = label;
    categoryFilter.appendChild(opt);
  }
  bottomHeader.appendChild(categoryFilter);
  const formatFilter = document.createElement("select");
  formatFilter.style.height = "24px";
  formatFilter.style.padding = "0 8px";
  formatFilter.style.border = "1px solid #3b4554";
  formatFilter.style.borderRadius = "4px";
  formatFilter.style.background = "#11161d";
  formatFilter.style.color = "#e6edf3";
  formatFilter.style.fontSize = "11px";
  const formatOptions = [
    ["all", "Any"],
    ["obj", "OBJ"],
    ["fbx", "FBX"],
    ["glb", "GLB"],
    ["gltf", "GLTF"],
  ];
  for (const [value, label] of formatOptions) {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = label;
    formatFilter.appendChild(opt);
  }
  bottomHeader.appendChild(formatFilter);

  const terrainSelect = document.createElement("select");
  terrainSelect.style.marginLeft = "auto";
  terrainSelect.style.height = "24px";
  terrainSelect.style.padding = "0 8px";
  terrainSelect.style.border = "1px solid #3b4554";
  terrainSelect.style.borderRadius = "4px";
  terrainSelect.style.background = "#11161d";
  terrainSelect.style.color = "#e6edf3";
  terrainSelect.style.fontSize = "11px";
  TERRAIN_OPTIONS.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t.value;
    opt.textContent = `Ground: ${t.label}`;
    if (t.value === game.groundTexturePath) opt.selected = true;
    terrainSelect.appendChild(opt);
  });
  terrainSelect.onchange = () => game.setGroundTexture(terrainSelect.value, game.groundTextureRepeat);
  bottomHeader.appendChild(terrainSelect);
  bottom.appendChild(bottomHeader);

  const assetsGrid = document.createElement("div");
  assetsGrid.style.display = "grid";
  assetsGrid.style.gridTemplateColumns = "repeat(8, minmax(0,1fr))";
  assetsGrid.style.gap = "8px";
  assetsGrid.style.padding = "10px";
  assetsGrid.style.overflow = "auto";
  bottom.appendChild(assetsGrid);
  const assetFooter = document.createElement("div");
  assetFooter.style.position = "absolute";
  assetFooter.style.right = "10px";
  assetFooter.style.bottom = "8px";
  assetFooter.style.fontSize = "10px";
  assetFooter.style.color = "#8ea0b2";
  assetFooter.style.pointerEvents = "none";
  bottom.appendChild(assetFooter);

  let menuEl: HTMLDivElement | null = null;
  const closeContextMenu = () => {
    if (menuEl) {
      menuEl.remove();
      menuEl = null;
    }
  };

  const showContextMenu = (x: number, y: number, items: MenuItem[]) => {
    closeContextMenu();
    const menu = document.createElement("div");
    menu.style.position = "fixed";
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.style.minWidth = "190px";
    menu.style.background = "#1e242f";
    menu.style.border = "1px solid #3a4556";
    menu.style.borderRadius = "4px";
    menu.style.padding = "4px";
    menu.style.boxShadow = "0 12px 28px rgba(0,0,0,0.45)";
    menu.style.zIndex = "100400";
    menu.style.pointerEvents = "auto";

    for (const entry of items) {
      const item = document.createElement("button");
      item.textContent = entry.label;
      item.disabled = entry.enabled === false;
      item.style.display = "block";
      item.style.width = "100%";
      item.style.height = "24px";
      item.style.padding = "0 8px";
      item.style.textAlign = "left";
      item.style.border = "none";
      item.style.borderRadius = "3px";
      item.style.background = "transparent";
      item.style.color = entry.enabled === false ? "#71839a" : "#d9e2ec";
      item.style.fontSize = "11px";
      item.style.cursor = entry.enabled === false ? "default" : "pointer";
      item.onmouseenter = () => {
        if (entry.enabled === false) return;
        item.style.background = "#2b4f8b";
      };
      item.onmouseleave = () => {
        item.style.background = "transparent";
      };
      item.onclick = () => {
        if (entry.enabled === false) return;
        entry.action();
        closeContextMenu();
      };
      menu.appendChild(item);
    }

    document.body.appendChild(menu);
    menuEl = menu;
  };

  const catalogInput = document.createElement("input");
  catalogInput.type = "file";
  catalogInput.accept = "application/json,.json";
  catalogInput.style.display = "none";
  document.body.appendChild(catalogInput);

  btnImportCatalog.onclick = () => catalogInput.click();
  catalogInput.onchange = async () => {
    const file = catalogInput.files?.[0];
    catalogInput.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const result = importUnityDecorationsFromCatalogJson(text);
      game.ui?.addChatMessage(
        "System",
        `Catalog import: +${result.added} added, ${result.updated} updated, ${result.skipped} skipped.`,
      );
      renderAssetCards();
    } catch (err: any) {
      game.ui?.addChatMessage("System", `Catalog import failed: ${err?.message ?? "invalid file"}`);
    }
  };

  btnResetImported.onclick = () => {
    const importedCount = getImportedUnityDecorations().length;
    clearImportedUnityDecorations();
    renderAssetCards();
    game.ui?.addChatMessage("System", `Imported catalog cleared (${importedCount} entries removed).`);
  };

  const renderAssetCards = () => {
    assetsGrid.innerHTML = "";
    const query = assetSearch.value.trim().toLowerCase();
    const category = categoryFilter.value;
    const format = formatFilter.value;
    const allDecor = getUnityDecorations();
    const sorted = [...allDecor].sort((a, b) => {
      const aAuto = a.id.startsWith("auto-") ? 1 : 0;
      const bAuto = b.id.startsWith("auto-") ? 1 : 0;
      if (aAuto !== bAuto) return aAuto - bAuto;
      return a.id.localeCompare(b.id);
    });
    const filtered = sorted.filter((decor) => {
      const lowerPath = decor.path.toLowerCase();
      const lowerId = decor.id.toLowerCase();
      if (query && !lowerId.includes(query) && !lowerPath.includes(query)) return false;
      const isAuto = decor.id.startsWith("auto-");
      if (category === "manual" && isAuto) return false;
      if (category === "auto" && !isAuto) return false;
      if (category === "wmo" && !lowerPath.includes("/wmo/")) return false;
      if (category === "world" && !lowerPath.includes("/world/")) return false;
      if (category === "maps" && !lowerPath.includes("/maps/")) return false;
      if (category === "creature" && !lowerPath.includes("/creature/")) return false;
      if (category === "item" && !lowerPath.includes("/item/")) return false;
      if (category === "spell" && !lowerPath.includes("/spell")) return false;
      if (format !== "all" && !lowerPath.endsWith(`.${format}`)) return false;
      return true;
    });
    const visible = filtered.slice(0, 420);

    for (const decor of visible) {
      const card = document.createElement("div");
      card.style.background = "#11161d";
      card.style.border = "1px solid #3b4554";
      card.style.borderRadius = "4px";
      card.style.padding = "4px";
      card.style.cursor = "grab";
      card.draggable = true;
      card.title = `${decor.id}\n${decor.path}`;
      card.ondragstart = (ev) => ev.dataTransfer?.setData("text/world-decor-id", decor.id);
      card.ondblclick = () => game.editorPlaceDecoration(decor.id);
      card.oncontextmenu = (ev) => {
        ev.preventDefault();
        showContextMenu(ev.clientX, ev.clientY, [
          { label: "Place In Front of Camera", action: () => { void game.editorPlaceDecoration(decor.id); } },
        ]);
      };

      const img = document.createElement("img");
      img.src = decor.previewImage || game.groundTexturePath;
      img.style.width = "100%";
      img.style.height = "56px";
      img.style.objectFit = "cover";
      img.style.borderRadius = "3px";

      const txt = document.createElement("div");
      txt.textContent = decor.id.startsWith("auto-")
        ? decor.path.split("/").pop() ?? decor.id
        : decor.id;
      txt.style.fontSize = "10px";
      txt.style.marginTop = "4px";
      txt.style.whiteSpace = "nowrap";
      txt.style.overflow = "hidden";
      txt.style.textOverflow = "ellipsis";

      card.append(img, txt);
      assetsGrid.appendChild(card);
    }
    const importedCount = getImportedUnityDecorations().length;
    assetFooter.textContent = `${filtered.length} assets${filtered.length > visible.length ? ` (showing ${visible.length})` : ""} | imported: ${importedCount}`;
  };
  assetSearch.oninput = renderAssetCards;
  categoryFilter.onchange = renderAssetCards;
  formatFilter.onchange = renderAssetCards;
  renderAssetCards();

  const rendererContextHandler = (ev: MouseEvent) => {
    if (!game.editorSoftwareMode || !game.worldEditorMode) return;
    ev.preventDefault();
    const source = game.getEditorSelectedSource();
    const hasSelection = !!game.getEditorSelectedObjectId();
    showContextMenu(ev.clientX, ev.clientY, [
      { label: "Focus Selected", action: () => game.editorFocusSelection(), enabled: hasSelection },
      { label: "Duplicate Selected", action: () => { void game.editorDuplicateSelection(); }, enabled: source === "decor" },
      { label: source === "map" ? "Hide Selected Map" : "Delete Selected", action: () => game.removeSelectedEditorDecoration(), enabled: hasSelection },
      { label: game.editorSnapEnabled ? "Disable Snap" : "Enable Snap", action: () => game.editorSetSnapEnabled(!game.editorSnapEnabled) },
      { label: "Unhide All Map Models", action: () => { void game.editorUnhideAllWorldModels(); } },
    ]);
  };

  game.renderer.domElement.addEventListener("contextmenu", rendererContextHandler);

  const closeMenuOnClick = () => closeContextMenu();
  document.addEventListener("click", closeMenuOnClick);
  document.addEventListener("contextmenu", closeMenuOnClick, true);
  const keydownHandler = (e: KeyboardEvent) => {
    if (e.key.toLowerCase() === "q") {
      const source = game.getEditorSelectedSource();
      const hasSelection = !!game.getEditorSelectedObjectId();
      showContextMenu(window.innerWidth * 0.5, 80, [
        { label: "Focus Selected", action: () => game.editorFocusSelection(), enabled: hasSelection },
        { label: "Duplicate Selected", action: () => { void game.editorDuplicateSelection(); }, enabled: source === "decor" },
        { label: source === "map" ? "Hide Selected Map" : "Delete Selected", action: () => game.removeSelectedEditorDecoration(), enabled: hasSelection },
      ]);
    }
  };
  window.addEventListener("keydown", keydownHandler);

  const refresh = () => {
    const selectedId = game.getEditorSelectedObjectId();
    hierarchy.innerHTML = "";

    for (const row of game.getEditorHierarchyEntries()) {
      const item = document.createElement("div");
      item.textContent = row.label;
      item.style.padding = "3px 6px";
      item.style.borderRadius = "3px";
      item.style.fontSize = "12px";
      item.style.cursor = "pointer";
      item.style.marginBottom = "2px";
      item.style.whiteSpace = "nowrap";
      item.style.overflow = "hidden";
      item.style.textOverflow = "ellipsis";
      item.style.background = row.objectId === selectedId ? "#244a89" : "transparent";
      item.onclick = () => game.selectEditorObjectById(row.objectId);
      item.oncontextmenu = (ev) => {
        ev.preventDefault();
        game.selectEditorObjectById(row.objectId);
        const isDecor = row.label.startsWith("Decor/");
        showContextMenu(ev.clientX, ev.clientY, [
          { label: "Focus", action: () => game.editorFocusSelection() },
          { label: "Duplicate", action: () => { void game.editorDuplicateSelection(); }, enabled: isDecor },
          { label: isDecor ? "Delete" : "Hide Map", action: () => game.removeSelectedEditorDecoration() },
        ]);
      };
      hierarchy.appendChild(item);
    }

    selectedLabel.textContent = game.getEditorSelectedLabel() ?? "No selection";
    sourceLabel.textContent = `Source: ${game.getEditorSelectedSource() ?? "none"}`;

    const t = game.getEditorSelectionTransform();
    const enabled = !!t;
    [px, py, pz, rx, ry, rz, sx, sy, sz, sm, sr, ss].forEach((el) => {
      el.disabled = !enabled && (el === px || el === py || el === pz || el === rx || el === ry || el === rz || el === sx || el === sy || el === sz);
      el.style.opacity = el.disabled ? "0.55" : "1";
    });

    if (t) {
      px.value = t.position.x.toFixed(2);
      py.value = t.position.y.toFixed(2);
      pz.value = t.position.z.toFixed(2);
      rx.value = t.rotation.x.toFixed(2);
      ry.value = t.rotation.y.toFixed(2);
      rz.value = t.rotation.z.toFixed(2);
      sx.value = t.scale.x.toFixed(2);
      sy.value = t.scale.y.toFixed(2);
      sz.value = t.scale.z.toFixed(2);
    }

    sm.value = `${game.editorTranslationSnap}`;
    sr.value = `${game.editorRotationSnapDeg}`;
    ss.value = `${game.editorScaleSnap}`;
    snapToggle.checked = game.editorSnapEnabled;
    applyTransformModeUi();
  };

  const timer = window.setInterval(() => {
    if (!root.isConnected) {
      window.clearInterval(timer);
      closeContextMenu();
      game.renderer.domElement.removeEventListener("contextmenu", rendererContextHandler);
      document.removeEventListener("click", closeMenuOnClick);
      document.removeEventListener("contextmenu", closeMenuOnClick, true);
      window.removeEventListener("keydown", keydownHandler);
      catalogInput.remove();
      return;
    }
    refresh();
  }, 140);

  refresh();
  return root;
}
