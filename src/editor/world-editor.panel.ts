import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { Game } from "../game";
import {
  clearImportedUnityDecorations,
  getImportedUnityCatalogKeys,
  getImportedUnityDecorations,
  getUnityDecorations,
  importUnityDecorationsFromCatalogJson,
  removeImportedUnityCatalog,
  validateUnityDecorCatalogJson,
} from "../world/unity-decor-catalog";
import { AnimationCatalog } from "../utils/animationCatalog";
import { loadModelByPath, mergeAnimationClips } from "../utils/modelLoader";
import { UNITY_IMPORT_INDEX, type UnityImportIndexEntry } from "../world/unity-import-index.generated";

type TerrainOption = { label: string; value: string };
type MenuItem = { label: string; action: () => void; enabled?: boolean };
type BrowserAsset = {
  id: string;
  path: string;
  virtualPath: string;
  previewImage?: string;
  kind: "model" | "animation" | "texture" | "audio" | "material" | "other";
  group: "exported" | "extracted" | "game" | "tilesets" | "asset-packs" | "effects-pack" | "misc" | "catalog";
  placeableDecorId?: string;
  source: "catalog" | "index";
};

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
  for (const eventName of ["mousedown", "mouseup", "pointerdown", "pointerup", "wheel", "touchstart", "touchend"]) {
    root.addEventListener(eventName, swallow);
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
  const btnRemoveCatalog = toolButton("Remove Catalog");
  const btnResetImported = toolButton("Reset Imported");
  const removeCatalogSelect = document.createElement("select");
  removeCatalogSelect.style.height = "26px";
  removeCatalogSelect.style.padding = "0 8px";
  removeCatalogSelect.style.border = "1px solid #3b4554";
  removeCatalogSelect.style.borderRadius = "4px";
  removeCatalogSelect.style.background = "#11161d";
  removeCatalogSelect.style.color = "#e6edf3";
  removeCatalogSelect.style.fontSize = "11px";
  top.append(btnSave, btnUndo, btnRedo, btnDefaults, btnClear, btnUnhide, btnImportCatalog, removeCatalogSelect, btnRemoveCatalog, btnResetImported);

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
  const animationLabel = document.createElement("div");
  animationLabel.style.fontSize = "10px";
  animationLabel.style.color = "#9fc5ff";
  animationLabel.style.whiteSpace = "pre-wrap";
  animationLabel.style.maxHeight = "84px";
  animationLabel.style.overflow = "auto";
  animationLabel.textContent = "Animations: n/a";
  const assetPreview = document.createElement("img");
  assetPreview.style.width = "100%";
  assetPreview.style.height = "110px";
  assetPreview.style.objectFit = "cover";
  assetPreview.style.borderRadius = "4px";
  assetPreview.style.border = "1px solid #2d3644";
  assetPreview.style.background = "#0f1319";
  assetPreview.style.display = "none";
  const audioPreview = document.createElement("audio");
  audioPreview.controls = true;
  audioPreview.style.width = "100%";
  audioPreview.style.display = "none";
  const previewCaption = document.createElement("div");
  previewCaption.style.fontSize = "10px";
  previewCaption.style.color = "#8ea0b2";
  previewCaption.style.whiteSpace = "nowrap";
  previewCaption.style.overflow = "hidden";
  previewCaption.style.textOverflow = "ellipsis";
  previewCaption.style.display = "none";
  const modelPreviewWrap = document.createElement("div");
  modelPreviewWrap.style.display = "none";
  modelPreviewWrap.style.border = "1px solid #2d3644";
  modelPreviewWrap.style.borderRadius = "4px";
  modelPreviewWrap.style.background = "#0f1319";
  modelPreviewWrap.style.overflow = "hidden";
  const modelViewport = document.createElement("div");
  modelViewport.style.width = "100%";
  modelViewport.style.height = "210px";
  modelViewport.style.cursor = "grab";
  const modelAnimRow = document.createElement("div");
  modelAnimRow.style.display = "grid";
  modelAnimRow.style.gridTemplateColumns = "1fr";
  modelAnimRow.style.gap = "6px";
  modelAnimRow.style.padding = "6px";
  modelAnimRow.style.borderTop = "1px solid #2d3644";
  const modelAnimSelect = document.createElement("select");
  modelAnimSelect.style.height = "24px";
  modelAnimSelect.style.padding = "0 6px";
  modelAnimSelect.style.minWidth = "0";
  modelAnimSelect.style.width = "100%";
  modelAnimSelect.style.border = "1px solid #3b4554";
  modelAnimSelect.style.borderRadius = "4px";
  modelAnimSelect.style.background = "#11161d";
  modelAnimSelect.style.color = "#e6edf3";
  modelAnimSelect.style.fontSize = "11px";
  const modelAnimPlayBtn = toolButton("Play");
  modelAnimPlayBtn.style.height = "24px";
  modelAnimPlayBtn.style.padding = "0 10px";
  modelAnimPlayBtn.disabled = true;
  const modelResetBtn = toolButton("Reset");
  modelResetBtn.style.height = "24px";
  modelResetBtn.style.padding = "0 10px";
  const modelSpeed = document.createElement("input");
  modelSpeed.type = "range";
  modelSpeed.min = "0.25";
  modelSpeed.max = "2";
  modelSpeed.step = "0.05";
  modelSpeed.value = "1";
  modelSpeed.style.width = "120px";
  const modelSpeedLabel = document.createElement("div");
  modelSpeedLabel.textContent = "1.00x";
  modelSpeedLabel.style.fontSize = "10px";
  modelSpeedLabel.style.color = "#9fb0c1";
  modelSpeedLabel.style.alignSelf = "center";
  const rightControls = document.createElement("div");
  rightControls.style.display = "flex";
  rightControls.style.alignItems = "center";
  rightControls.style.flexWrap = "wrap";
  rightControls.style.gap = "6px";
  rightControls.style.justifyContent = "space-between";
  const modelPlayState = document.createElement("div");
  modelPlayState.textContent = "Paused";
  modelPlayState.style.fontSize = "10px";
  modelPlayState.style.color = "#9fb0c1";
  modelPlayState.style.marginLeft = "auto";
  const modelDebugLabel = document.createElement("div");
  modelDebugLabel.style.fontSize = "10px";
  modelDebugLabel.style.color = "#8ea0b2";
  modelDebugLabel.style.fontFamily = "Consolas, 'Courier New', monospace";
  modelDebugLabel.style.whiteSpace = "pre-wrap";
  modelDebugLabel.style.wordBreak = "break-word";
  modelDebugLabel.style.background = "#101722";
  modelDebugLabel.style.border = "1px solid #2d3644";
  modelDebugLabel.style.borderRadius = "4px";
  modelDebugLabel.style.padding = "6px";
  modelDebugLabel.style.maxHeight = "88px";
  modelDebugLabel.style.overflowY = "auto";
  modelDebugLabel.textContent = "Preview debug: n/a";
  rightControls.append(modelAnimPlayBtn, modelResetBtn, modelSpeed, modelSpeedLabel, modelPlayState);
  modelAnimRow.append(modelAnimSelect, rightControls, modelDebugLabel);
  modelPreviewWrap.append(modelViewport, modelAnimRow);
  infoCard.body.append(sourceLabel, hint, modelPreviewWrap, assetPreview, audioPreview, previewCaption, animationLabel);

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

  const modelPreviewRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  modelPreviewRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  modelPreviewRenderer.outputColorSpace = THREE.SRGBColorSpace;
  modelPreviewRenderer.setClearColor(0x0f1319, 1);
  modelViewport.appendChild(modelPreviewRenderer.domElement);
  const modelPreviewScene = new THREE.Scene();
  const modelPreviewCamera = new THREE.PerspectiveCamera(38, 1, 0.01, 2000);
  const modelPreviewClock = new THREE.Clock();
  let modelPreviewMixer: THREE.AnimationMixer | null = null;
  let modelPreviewRoot: THREE.Object3D | null = null;
  let modelPreviewClips: THREE.AnimationClip[] = [];
  let modelPreviewAction: THREE.AnimationAction | null = null;
  let modelPreviewToken = 0;
  let modelPreviewPlaying = false;
  let modelDebugClipName = "";
  let modelPlaybackSpeed = 1;
  let modelYaw = Math.PI * 0.25;
  let modelPitch = 0.35;
  let modelDist = 2.8;
  let defaultYaw = modelYaw;
  let defaultPitch = modelPitch;
  let defaultDist = modelDist;
  let defaultTarget = new THREE.Vector3(0, 0.8, 0);
  let drag = false;
  let dragPointerId: number | null = null;
  let dragX = 0;
  let dragY = 0;
  let modelTarget = new THREE.Vector3(0, 0.8, 0);
  const hemi = new THREE.HemisphereLight(0xcfe3ff, 0x1d2633, 0.95);
  const dirA = new THREE.DirectionalLight(0xffffff, 1.0);
  dirA.position.set(3, 4, 2);
  const dirB = new THREE.DirectionalLight(0x6c86aa, 0.45);
  dirB.position.set(-2, 2, -3);
  modelPreviewScene.add(hemi, dirA, dirB);

  const refreshModelCamera = () => {
    const x = modelTarget.x + Math.cos(modelYaw) * Math.cos(modelPitch) * modelDist;
    const y = modelTarget.y + Math.sin(modelPitch) * modelDist;
    const z = modelTarget.z + Math.sin(modelYaw) * Math.cos(modelPitch) * modelDist;
    modelPreviewCamera.position.set(x, y, z);
    modelPreviewCamera.lookAt(modelTarget);
  };

  const resizeModelPreview = () => {
    const w = Math.max(2, modelViewport.clientWidth);
    const h = Math.max(2, modelViewport.clientHeight);
    modelPreviewRenderer.setSize(w, h, false);
    modelPreviewCamera.aspect = w / h;
    modelPreviewCamera.updateProjectionMatrix();
    refreshModelCamera();
  };

  const onModelPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    modelViewport.setPointerCapture(e.pointerId);
    dragPointerId = e.pointerId;
    drag = true;
    dragX = e.clientX;
    dragY = e.clientY;
    modelViewport.style.cursor = "grabbing";
    e.preventDefault();
  };
  const onModelPointerUp = (e?: PointerEvent) => {
    if (e && dragPointerId !== null && e.pointerId !== dragPointerId) return;
    drag = false;
    if (dragPointerId !== null && modelViewport.hasPointerCapture(dragPointerId)) {
      modelViewport.releasePointerCapture(dragPointerId);
    }
    dragPointerId = null;
    modelViewport.style.cursor = "grab";
  };
  const onModelPointerMove = (e: PointerEvent) => {
    if (dragPointerId !== null && e.pointerId !== dragPointerId) return;
    if (!drag) return;
    const dx = e.clientX - dragX;
    const dy = e.clientY - dragY;
    dragX = e.clientX;
    dragY = e.clientY;
    if (e.ctrlKey) {
      const panScale = Math.max(0.0015, modelDist * 0.0018);
      const right = new THREE.Vector3();
      const up = new THREE.Vector3();
      modelPreviewCamera.getWorldDirection(up).normalize();
      right.setFromMatrixColumn(modelPreviewCamera.matrixWorld, 0).normalize();
      up.setFromMatrixColumn(modelPreviewCamera.matrixWorld, 1).normalize();
      modelTarget.addScaledVector(right, -dx * panScale);
      modelTarget.addScaledVector(up, dy * panScale);
    } else {
      modelYaw -= dx * 0.01;
      modelPitch = Math.max(-1.25, Math.min(1.25, modelPitch - dy * 0.008));
    }
    refreshModelCamera();
  };
  const onWindowResize = () => resizeModelPreview();
  modelViewport.addEventListener("pointerdown", onModelPointerDown);
  modelViewport.addEventListener("pointerup", onModelPointerUp);
  modelViewport.addEventListener("pointercancel", onModelPointerUp);
  modelViewport.addEventListener("pointerleave", onModelPointerUp);
  modelViewport.addEventListener("pointermove", onModelPointerMove);
  window.addEventListener("resize", onWindowResize);

  const updateModelDebugLabel = (dt?: number) => {
    const clip = modelPreviewAction?.getClip() ?? null;
    const clipDuration = clip?.duration ?? 0;
    const clipTracks = clip?.tracks?.length ?? 0;
    const actionTime = modelPreviewAction?.time ?? 0;
    const actionScale = modelPreviewAction?.getEffectiveTimeScale?.() ?? 0;
    const actionWeight = modelPreviewAction?.getEffectiveWeight?.() ?? 0;
    modelDebugLabel.textContent = [
      `root: ${modelPreviewRoot ? "yes" : "no"} | clips: ${modelPreviewClips.length}`,
      `selected: ${modelDebugClipName || "none"} | tracks: ${clipTracks} | dur: ${clipDuration.toFixed(2)}s`,
      `state: ${modelPreviewPlaying ? "playing" : "paused"} | actionPaused: ${modelPreviewAction?.paused ?? true}`,
      `time: ${actionTime.toFixed(2)}s | speed: ${actionScale.toFixed(2)}x | weight: ${actionWeight.toFixed(2)}`,
      `mixerTime: ${(modelPreviewMixer?.time ?? 0).toFixed(2)}s | dt: ${(dt ?? 0).toFixed(3)}s`,
    ].join("\n");
  };

  const setModelAnimAction = (clipName: string | null) => {
    if (!modelPreviewMixer) return;
    modelPreviewMixer.stopAllAction();
    modelPreviewAction = null;
    modelDebugClipName = clipName ?? "";
    if (!clipName) return;
    const clip = modelPreviewClips.find((c) => c.name === clipName) ?? null;
    if (!clip) return;
    modelPreviewAction = modelPreviewMixer.clipAction(clip);
    modelPreviewAction.enabled = true;
    modelPreviewAction.clampWhenFinished = false;
    modelPreviewAction.setLoop(THREE.LoopRepeat, Infinity);
    modelPreviewAction.setEffectiveWeight(1);
    modelPreviewAction.setEffectiveTimeScale(modelPlaybackSpeed);
    modelPreviewAction.reset().play();
    modelPreviewAction.paused = !modelPreviewPlaying;
    modelPlayState.textContent = modelPreviewPlaying ? "Playing" : "Paused";
    updateModelDebugLabel();
  };

  const playSelectedClipFromStart = () => {
    if (!modelPreviewMixer || !modelPreviewClips.length) return false;
    const selectedName = modelAnimSelect.value || modelPreviewClips[0]?.name || "";
    const clip = modelPreviewClips.find((c) => c.name === selectedName) ?? null;
    if (!clip) return false;
    modelPreviewMixer.stopAllAction();
    modelPreviewAction = modelPreviewMixer.clipAction(clip);
    modelDebugClipName = clip.name;
    modelPreviewAction.enabled = true;
    modelPreviewAction.clampWhenFinished = false;
    modelPreviewAction.setLoop(THREE.LoopRepeat, Infinity);
    modelPreviewAction.setEffectiveWeight(1);
    modelPreviewAction.setEffectiveTimeScale(modelPlaybackSpeed);
    modelPreviewAction.reset();
    modelPreviewAction.play();
    modelPreviewAction.paused = false;
    modelPreviewPlaying = true;
    modelAnimPlayBtn.textContent = "Pause";
    modelPlayState.textContent = "Playing";
    updateModelDebugLabel();
    return true;
  };

  modelAnimSelect.onchange = () => {
    const name = modelAnimSelect.value || null;
    setModelAnimAction(name);
  };
  modelAnimPlayBtn.onclick = () => {
    if (!modelPreviewPlaying) {
      if (!playSelectedClipFromStart()) return;
      return;
    }
    modelPreviewPlaying = false;
    if (modelPreviewAction) modelPreviewAction.paused = true;
    modelAnimPlayBtn.textContent = "Play";
    modelPlayState.textContent = "Paused";
    updateModelDebugLabel();
  };
  modelResetBtn.onclick = () => {
    modelYaw = defaultYaw;
    modelPitch = defaultPitch;
    modelDist = defaultDist;
    modelTarget.copy(defaultTarget);
    refreshModelCamera();
  };
  modelSpeed.oninput = () => {
    modelPlaybackSpeed = parseFloat(modelSpeed.value) || 1;
    modelSpeedLabel.textContent = `${modelPlaybackSpeed.toFixed(2)}x`;
    if (modelPreviewAction) modelPreviewAction.setEffectiveTimeScale(modelPlaybackSpeed);
    updateModelDebugLabel();
  };

  const renderModelPreviewLoop = () => {
    if (root.isConnected) {
      const dt = modelPreviewClock.getDelta();
      if (modelPreviewMixer && modelPreviewPlaying) modelPreviewMixer.update(dt);
      updateModelDebugLabel(dt);
      modelPreviewRenderer.render(modelPreviewScene, modelPreviewCamera);
      requestAnimationFrame(renderModelPreviewLoop);
    }
  };
  resizeModelPreview();
  requestAnimationFrame(renderModelPreviewLoop);

  const setModelPreview = async (modelPath: string, animationSources?: string[]) => {
    modelPreviewToken += 1;
    const token = modelPreviewToken;
    modelPreviewWrap.style.display = "block";
    assetPreview.style.display = "none";
    audioPreview.style.display = "none";
    previewCaption.style.display = "none";
    modelAnimSelect.innerHTML = "";
    modelAnimPlayBtn.disabled = true;
    modelAnimPlayBtn.textContent = "Play";
    modelPreviewPlaying = false;
    modelPlayState.textContent = "Paused";
    modelDebugClipName = "";
    updateModelDebugLabel();
    modelPlaybackSpeed = 1;
    modelSpeed.value = "1";
    modelSpeedLabel.textContent = "1.00x";

    const base = await loadModelByPath(modelPath);
    if (!base || token !== modelPreviewToken) return;
    const groups = [base.animations ?? []];
    for (const p of animationSources ?? []) {
      const extra = await loadModelByPath(p);
      if (extra?.animations?.length) groups.push(extra.animations);
      if (token !== modelPreviewToken) return;
    }
    modelPreviewClips = mergeAnimationClips(...groups);

    if (modelPreviewRoot) {
      modelPreviewScene.remove(modelPreviewRoot);
    }
    modelPreviewRoot = cloneSkinned(base.scene);
    modelPreviewRoot.traverse((c: any) => {
      if (!c.isMesh) return;
      c.castShadow = false;
      c.receiveShadow = true;
    });
    const box = new THREE.Box3().setFromObject(modelPreviewRoot, true);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);
    modelPreviewRoot.position.sub(center);
    modelTarget.set(0, Math.max(0.3, size.y * 0.25), 0);
    modelDist = Math.max(1.2, Math.max(size.x, size.y, size.z) * 1.55);
    defaultYaw = modelYaw;
    defaultPitch = modelPitch;
    defaultDist = modelDist;
    defaultTarget = modelTarget.clone();
    modelPreviewScene.add(modelPreviewRoot);
    refreshModelCamera();
    resizeModelPreview();

    modelPreviewMixer = new THREE.AnimationMixer(modelPreviewRoot);
    if (modelPreviewClips.length) {
      modelAnimSelect.innerHTML = "";
      for (const clip of modelPreviewClips) {
        const opt = document.createElement("option");
        opt.value = clip.name;
        opt.textContent = clip.name;
        modelAnimSelect.appendChild(opt);
      }
      modelAnimPlayBtn.disabled = false;
      modelAnimPlayBtn.textContent = "Play";
      modelPlayState.textContent = "Paused";
      setModelAnimAction(modelPreviewClips[0].name);
      updateModelDebugLabel();
    } else {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "No animation clips";
      modelAnimSelect.appendChild(opt);
      modelAnimPlayBtn.disabled = true;
      modelPlayState.textContent = "No clips";
      updateModelDebugLabel();
    }
  };

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
    ["placeable", "Placeable"],
    ["model", "Model"],
    ["animation", "Animation"],
    ["texture", "Texture"],
    ["audio", "Audio"],
    ["material", "Material"],
    ["exported", "Exported"],
    ["extracted", "Extracted"],
    ["game", "Game"],
    ["tilesets", "Tilesets"],
    ["asset-packs", "Asset Packs"],
    ["effects-pack", "Effects Pack"],
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
  const navUpBtn = toolButton("Up");
  navUpBtn.style.height = "24px";
  bottomHeader.appendChild(navUpBtn);
  const breadcrumb = document.createElement("div");
  breadcrumb.style.display = "flex";
  breadcrumb.style.alignItems = "center";
  breadcrumb.style.gap = "6px";
  breadcrumb.style.maxWidth = "420px";
  breadcrumb.style.overflow = "hidden";
  bottomHeader.appendChild(breadcrumb);

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

  const projectBody = document.createElement("div");
  projectBody.style.display = "grid";
  projectBody.style.gridTemplateColumns = "260px 1fr";
  projectBody.style.overflow = "hidden";
  bottom.appendChild(projectBody);

  const projectTree = document.createElement("div");
  projectTree.style.borderRight = "1px solid #2a3340";
  projectTree.style.overflow = "auto";
  projectTree.style.padding = "8px";
  projectTree.style.background = "#121820";
  projectBody.appendChild(projectTree);

  const assetsPane = document.createElement("div");
  assetsPane.style.overflow = "auto";
  assetsPane.style.padding = "10px";
  projectBody.appendChild(assetsPane);

  const assetsGrid = document.createElement("div");
  assetsGrid.style.display = "grid";
  assetsGrid.style.gridTemplateColumns = "repeat(7, minmax(0,1fr))";
  assetsGrid.style.gap = "8px";
  assetsPane.appendChild(assetsGrid);
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

  const hiddenFileInput = document.createElement("input");
  hiddenFileInput.type = "file";
  hiddenFileInput.accept = "application/json,.json";
  hiddenFileInput.style.position = "fixed";
  hiddenFileInput.style.left = "-10000px";
  hiddenFileInput.style.top = "-10000px";
  hiddenFileInput.style.opacity = "0";
  document.body.appendChild(hiddenFileInput);

  const notify = (message: string) => {
    if (game.editorSoftwareMode) {
      window.alert(message);
      return;
    }
    game.ui?.addChatMessage("System", message);
  };

  const executeImportFromFile = async (file: File) => {
    const existingKeys = getImportedUnityCatalogKeys();
    const suggested = `catalog_${existingKeys.length + 1}`;
    const key = window.prompt("Insert new catalog key (must be unique):", suggested)?.trim();
    if (!key) return;
    if (existingKeys.includes(key)) {
      notify(`Catalog key '${key}' already exists. Import cancelled.`);
      return;
    }
    try {
      const text = await file.text();
      const validation = validateUnityDecorCatalogJson(text);
      if (!validation.ok) {
        notify(`Catalog invalid: ${validation.error}`);
        return;
      }
      const result = importUnityDecorationsFromCatalogJson(text, key);
      notify(`Catalog '${result.catalogKey}' imported: +${result.added} assets, ${result.skipped} skipped.`);
      refreshCatalogSelect();
      renderAssetCards();
    } catch (err: any) {
      notify(`Catalog import failed: ${err?.message ?? "invalid file"}`);
    }
  };

  hiddenFileInput.onchange = () => {
    const file = hiddenFileInput.files?.[0] ?? null;
    hiddenFileInput.value = "";
    if (!file) {
      notify("No catalog file selected.");
      return;
    }
    void executeImportFromFile(file);
  };

  const openCatalogPicker = () => {
    notify("Opening catalog file picker...");
    hiddenFileInput.click();
  };
  btnImportCatalog.onclick = openCatalogPicker;
  btnImportCatalog.onpointerdown = (e) => {
    e.stopPropagation();
    if (e.button === 0) openCatalogPicker();
  };

  btnRemoveCatalog.onclick = () => {
    const selected = removeCatalogSelect.value;
    if (!selected) {
      notify("No imported catalogs to remove.");
      return;
    }
    const ok = removeImportedUnityCatalog(selected);
    if (!ok) {
      notify(`Catalog '${selected}' not found.`);
      return;
    }
    refreshCatalogSelect();
    renderAssetCards();
    notify(`Catalog '${selected}' removed.`);
  };

  btnResetImported.onclick = () => {
    const importedCount = getImportedUnityDecorations().length;
    clearImportedUnityDecorations();
    refreshCatalogSelect();
    renderAssetCards();
    notify(`Imported catalog cleared (${importedCount} entries removed).`);
  };

  const refreshCatalogSelect = () => {
    const keys = getImportedUnityCatalogKeys();
    const prev = removeCatalogSelect.value;
    removeCatalogSelect.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = keys.length ? "Select catalog key..." : "No catalogs";
    removeCatalogSelect.appendChild(placeholder);
    for (const key of keys) {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = key;
      removeCatalogSelect.appendChild(opt);
    }
    if (keys.includes(prev)) removeCatalogSelect.value = prev;
    btnRemoveCatalog.disabled = keys.length === 0;
    btnRemoveCatalog.style.opacity = keys.length === 0 ? "0.55" : "1";
  };
  refreshCatalogSelect();

  const inferGroupFromPath = (lowerPath: string): BrowserAsset["group"] => {
    if (lowerPath.includes("/resources/exported/")) return "exported";
    if (lowerPath.includes("/extracted/")) return "extracted";
    if (lowerPath.includes("/game/")) return "game";
    if (lowerPath.includes("/tilesets/")) return "tilesets";
    if (lowerPath.includes("/asset packs/")) return "asset-packs";
    if (lowerPath.includes("/realistic effects pack/")) return "effects-pack";
    return "misc";
  };

  const extOf = (p: string) => {
    const idx = p.lastIndexOf(".");
    return idx >= 0 ? p.slice(idx + 1).toLowerCase() : "";
  };
  const isImageExt = (ext: string) => ["png", "jpg", "jpeg", "webp", "bmp"].includes(ext);
  const isAudioExt = (ext: string) => ["mp3", "wav", "ogg"].includes(ext);
  const toVirtualPath = (assetPath: string, source: "catalog" | "index", id: string) => {
    if (assetPath.startsWith("/unity-import/")) return assetPath;
    if (source === "catalog") return `/Catalogs/${id}`;
    if (assetPath.startsWith("/")) return assetPath;
    return `/${assetPath}`;
  };

  const catalogDecor = getUnityDecorations();
  const placeableByPath = new Map<string, typeof catalogDecor[number]>();
  for (const d of catalogDecor) placeableByPath.set(d.path, d);
  let browserPath = "/";

  const buildBrowserAssets = (): BrowserAsset[] => {
    const assets: BrowserAsset[] = [];
    const seenPaths = new Set<string>();

    for (const decor of getUnityDecorations()) {
      const lowerPath = decor.path.toLowerCase();
      assets.push({
        id: decor.id,
        path: decor.path,
        virtualPath: toVirtualPath(decor.path, "catalog", decor.id),
        previewImage: decor.previewImage,
        kind: "model",
        group: decor.path.startsWith("/unity-import/") ? inferGroupFromPath(decor.path.toLowerCase()) : "catalog",
        placeableDecorId: decor.id,
        source: "catalog",
      });
      seenPaths.add(lowerPath);
    }

    for (const row of UNITY_IMPORT_INDEX as UnityImportIndexEntry[]) {
      const lowerPath = row.path.toLowerCase();
      if (seenPaths.has(lowerPath)) continue;
      const placeable = placeableByPath.get(row.path);
      assets.push({
        id: row.id,
        path: row.path,
        virtualPath: toVirtualPath(row.path, "index", row.id),
        previewImage: row.previewImage,
        kind: row.kind,
        group: row.group,
        placeableDecorId: placeable?.id,
        source: "index",
      });
    }
    return assets;
  };

  const resolveAnimationSourcesForAsset = (asset: BrowserAsset): string[] | undefined => {
    if (asset.placeableDecorId) {
      const decor = getUnityDecorations().find((d) => d.id === asset.placeableDecorId);
      if (decor?.animationSources?.length) return decor.animationSources;
    }
    const lower = asset.path.toLowerCase();
    if (!lower.endsWith(".fbx")) return undefined;
    const slash = asset.path.lastIndexOf("/");
    if (slash < 0) return undefined;
    const fileName = asset.path.slice(slash + 1);
    const dot = fileName.lastIndexOf(".");
    if (dot < 0) return undefined;
    const baseName = fileName.slice(0, dot);
    const folder = `${asset.path.slice(0, slash)}/${baseName}_Animations/`.toLowerCase();
    const list = (UNITY_IMPORT_INDEX as UnityImportIndexEntry[])
      .filter((r) => r.kind === "animation" && r.path.toLowerCase().startsWith(folder) && r.path.toLowerCase().endsWith(".fbx"))
      .map((r) => r.path)
      .sort((a, b) => a.localeCompare(b));
    return list.length ? list : undefined;
  };

  const showAssetInInspector = (asset: BrowserAsset) => {
    animationLabel.textContent = [
      `Asset: ${asset.id}`,
      `Type: ${asset.kind}`,
      `Group: ${asset.group}`,
      `Path: ${asset.path}`,
      `Placeable: ${asset.placeableDecorId ? "yes" : "no"}`,
    ].join("\n");
    previewCaption.style.display = "none";
    previewCaption.textContent = "";
    modelPreviewWrap.style.display = "none";
    assetPreview.style.display = "none";
    assetPreview.removeAttribute("src");
    audioPreview.style.display = "none";
    audioPreview.pause();
    audioPreview.removeAttribute("src");

    const ext = extOf(asset.path.toLowerCase());
    if (isAudioExt(ext)) {
      audioPreview.src = asset.path;
      audioPreview.style.display = "block";
      previewCaption.textContent = "Audio preview";
      previewCaption.style.display = "block";
    } else if (isImageExt(ext)) {
      assetPreview.src = asset.path;
      assetPreview.style.display = "block";
      previewCaption.textContent = "Image preview";
      previewCaption.style.display = "block";
    } else if (asset.previewImage) {
      assetPreview.src = asset.previewImage;
      assetPreview.style.display = "block";
      previewCaption.textContent = "Thumbnail preview";
      previewCaption.style.display = "block";
    }

    if (asset.kind === "model" || asset.kind === "animation") {
      const animationSources = resolveAnimationSourcesForAsset(asset);
      void setModelPreview(asset.path, animationSources);
      void AnimationCatalog.listClipNames(asset.path, animationSources).then((clips) => {
        animationLabel.textContent += clips.length
          ? `\n\nAnimations:\n${clips.join("\n")}`
          : "\n\nAnimations: none";
      });
    }
  };

  const expandedFolders = new Set<string>(["/"]);

  const renderBreadcrumb = () => {
    breadcrumb.innerHTML = "";
    const parts = browserPath.split("/").filter(Boolean);
    const rootBtn = toolButton("Root");
    rootBtn.style.height = "22px";
    rootBtn.onclick = () => {
      browserPath = "/";
      renderAssetCards();
    };
    breadcrumb.appendChild(rootBtn);
    let current = "";
    for (const part of parts) {
      const sep = document.createElement("span");
      sep.textContent = ">";
      sep.style.fontSize = "10px";
      sep.style.color = "#7f8da0";
      breadcrumb.appendChild(sep);
      current += `/${part}`;
      const btn = toolButton(part);
      btn.style.height = "22px";
      btn.onclick = () => {
        browserPath = current || "/";
        renderAssetCards();
      };
      breadcrumb.appendChild(btn);
    }
    navUpBtn.disabled = browserPath === "/";
    navUpBtn.style.opacity = navUpBtn.disabled ? "0.55" : "1";
  };

  navUpBtn.onclick = () => {
    if (browserPath === "/") return;
    const parts = browserPath.split("/").filter(Boolean);
    parts.pop();
    browserPath = parts.length ? `/${parts.join("/")}` : "/";
    renderAssetCards();
  };

  const renderAssetCards = () => {
    projectTree.innerHTML = "";
    assetsGrid.innerHTML = "";
    renderBreadcrumb();
    const query = assetSearch.value.trim().toLowerCase();
    const category = categoryFilter.value;
    const format = formatFilter.value;
    const rows = buildBrowserAssets();
    const sorted = [...rows].sort((a, b) => {
      if (a.source !== b.source) return a.source === "catalog" ? -1 : 1;
      return a.id.localeCompare(b.id);
    });

    const filtered = sorted.filter((asset) => {
      const lowerPath = asset.path.toLowerCase();
      const lowerId = asset.id.toLowerCase();
      if (query && !lowerId.includes(query) && !lowerPath.includes(query)) return false;
      const isAuto = lowerId.startsWith("auto-");
      if (category === "placeable" && !asset.placeableDecorId) return false;
      if (category === "model" && asset.kind !== "model") return false;
      if (category === "animation" && asset.kind !== "animation") return false;
      if (category === "texture" && asset.kind !== "texture") return false;
      if (category === "audio" && asset.kind !== "audio") return false;
      if (category === "material" && asset.kind !== "material") return false;
      if (category === "exported" && inferGroupFromPath(lowerPath) !== "exported") return false;
      if (category === "extracted" && inferGroupFromPath(lowerPath) !== "extracted") return false;
      if (category === "game" && inferGroupFromPath(lowerPath) !== "game") return false;
      if (category === "tilesets" && inferGroupFromPath(lowerPath) !== "tilesets") return false;
      if (category === "asset-packs" && inferGroupFromPath(lowerPath) !== "asset-packs") return false;
      if (category === "effects-pack" && inferGroupFromPath(lowerPath) !== "effects-pack") return false;
      if (category === "manual" && isAuto) return false;
      if (category === "auto" && !isAuto) return false;
      if (category === "wmo" && !lowerPath.includes("/wmo/")) return false;
      if (category === "world" && !lowerPath.includes("/world/")) return false;
      if (category === "maps" && !lowerPath.includes("/maps/")) return false;
      if (category === "creature" && !lowerPath.includes("/creature/")) return false;
      if (category === "item" && !lowerPath.includes("/item/")) return false;
      if (category === "spell" && !lowerPath.includes("/spell")) return false;
      if (format !== "all" && extOf(lowerPath) !== format) return false;
      return true;
    });
    const folderChildren = new Map<string, Set<string>>();
    for (const asset of filtered) {
      const parts = asset.virtualPath.split("/").filter(Boolean);
      let parent = "/";
      for (const part of parts.slice(0, -1)) {
        const children = folderChildren.get(parent) ?? new Set<string>();
        children.add(part);
        folderChildren.set(parent, children);
        parent = parent === "/" ? `/${part}` : `${parent}/${part}`;
      }
      if (!folderChildren.has(parent)) folderChildren.set(parent, new Set<string>());
    }

    const renderTreeNode = (pathNode: string, depth: number) => {
      const children = Array.from(folderChildren.get(pathNode) ?? []).sort((a, b) => a.localeCompare(b));
      for (const folder of children) {
        const full = pathNode === "/" ? `/${folder}` : `${pathNode}/${folder}`;
        const row = document.createElement("div");
        row.style.display = "grid";
        row.style.gridTemplateColumns = "16px 1fr";
        row.style.alignItems = "center";
        row.style.gap = "4px";
        row.style.padding = "2px 4px";
        row.style.paddingLeft = `${4 + depth * 14}px`;
        row.style.borderRadius = "4px";
        row.style.cursor = "pointer";
        if (full === browserPath) row.style.background = "#244a89";
        const arrow = document.createElement("div");
        const hasSub = (folderChildren.get(full)?.size ?? 0) > 0;
        arrow.textContent = hasSub ? (expandedFolders.has(full) ? "v" : ">") : "";
        arrow.style.fontSize = "10px";
        arrow.style.color = "#9fb0c1";
        const label = document.createElement("div");
        label.textContent = folder;
        label.style.fontSize = "11px";
        label.style.whiteSpace = "nowrap";
        label.style.overflow = "hidden";
        label.style.textOverflow = "ellipsis";
        row.append(arrow, label);
        row.onclick = () => {
          browserPath = full;
          if (hasSub) {
            if (expandedFolders.has(full)) expandedFolders.delete(full);
            else expandedFolders.add(full);
          }
          renderAssetCards();
        };
        projectTree.appendChild(row);
        if (expandedFolders.has(full)) renderTreeNode(full, depth + 1);
      }
    };
    renderTreeNode("/", 0);

    const visibleAssets: BrowserAsset[] = [];
    const folderSet = new Set<string>();
    const basePath = browserPath === "/" ? "/" : `${browserPath}/`;
    for (const asset of filtered) {
      const vp = asset.virtualPath;
      if (!vp.startsWith(basePath) && !(browserPath === "/" && vp.startsWith("/"))) continue;
      const remainder = browserPath === "/" ? vp.slice(1) : vp.slice(basePath.length);
      if (!remainder) continue;
      const slash = remainder.indexOf("/");
      if (slash < 0) visibleAssets.push(asset);
      else folderSet.add(remainder.slice(0, slash));
    }

    const folders = Array.from(folderSet).sort((a, b) => a.localeCompare(b));
    for (const folder of folders) {
      const card = document.createElement("div");
      card.style.background = "#142033";
      card.style.border = "1px solid #36537a";
      card.style.borderRadius = "4px";
      card.style.padding = "8px";
      card.style.cursor = "pointer";
      card.title = `Folder: ${folder}`;
      const icon = document.createElement("div");
      icon.textContent = "Folder";
      icon.style.fontSize = "9px";
      icon.style.color = "#a8c9ff";
      const txt = document.createElement("div");
      txt.textContent = folder;
      txt.style.fontSize = "11px";
      txt.style.color = "#dbe9ff";
      txt.style.marginTop = "3px";
      txt.style.whiteSpace = "nowrap";
      txt.style.overflow = "hidden";
      txt.style.textOverflow = "ellipsis";
      card.append(icon, txt);
      card.onclick = () => {
        browserPath = browserPath === "/" ? `/${folder}` : `${browserPath}/${folder}`;
        expandedFolders.add(browserPath);
        renderAssetCards();
      };
      assetsGrid.appendChild(card);
    }

    const visible = visibleAssets.slice(0, 420);
    for (const asset of visible) {
      const card = document.createElement("div");
      card.style.background = "#11161d";
      card.style.border = "1px solid #3b4554";
      card.style.borderRadius = "4px";
      card.style.padding = "4px";
      card.style.cursor = asset.placeableDecorId ? "grab" : "default";
      card.draggable = !!asset.placeableDecorId;
      card.title = `${asset.id}\n${asset.path}\nkind=${asset.kind} group=${asset.group}`;
      card.onclick = () => showAssetInInspector(asset);
      card.ondragstart = (ev) => {
        if (!asset.placeableDecorId) return;
        ev.dataTransfer?.setData("text/world-decor-id", asset.placeableDecorId);
      };
      card.ondblclick = () => {
        if (!asset.placeableDecorId) return;
        void game.editorPlaceDecoration(asset.placeableDecorId);
      };
      card.oncontextmenu = (ev) => {
        ev.preventDefault();
        const actions: MenuItem[] = [
          {
            label: "Copy Path",
            action: () => {
              void navigator.clipboard?.writeText(asset.path);
              notify(`Copied path: ${asset.path}`);
            },
          },
        ];
        if (asset.placeableDecorId) {
          actions.unshift({
            label: "Place In Front of Camera",
            action: () => { void game.editorPlaceDecoration(asset.placeableDecorId!); },
          });
        }
        if (asset.kind === "model" || asset.kind === "animation") {
          actions.push({
            label: "Show Animations",
            action: () => {
              const animationSources = resolveAnimationSourcesForAsset(asset);
              animationLabel.textContent = `Animations: loading ${asset.id}...`;
              void AnimationCatalog.listClipNames(asset.path, animationSources).then((clips) => {
                animationLabel.textContent = clips.length
                  ? `Animations (${asset.id}):\n${clips.join("\n")}`
                  : `Animations (${asset.id}): none`;
              });
            },
          });
        }
        if (asset.kind === "texture") {
          actions.push(
            { label: "Set As Ground Texture", action: () => game.setGroundTexture(asset.path, game.groundTextureRepeat) },
            { label: "Set As Sky Texture", action: () => game.setSkyTexture(asset.path) },
          );
        }
        showContextMenu(ev.clientX, ev.clientY, actions);
      };

      const img = document.createElement("img");
      img.src = asset.previewImage || game.groundTexturePath;
      img.style.width = "100%";
      img.style.height = "56px";
      img.style.objectFit = "cover";
      img.style.borderRadius = "3px";

      const txt = document.createElement("div");
      txt.textContent = asset.source === "catalog"
        ? asset.id
        : `${asset.path.split("/").pop() ?? asset.id}`;
      txt.style.fontSize = "10px";
      txt.style.marginTop = "4px";
      txt.style.whiteSpace = "nowrap";
      txt.style.overflow = "hidden";
      txt.style.textOverflow = "ellipsis";

      card.append(img, txt);
      assetsGrid.appendChild(card);
    }
    const importedCount = getImportedUnityDecorations().length;
    const importedCatalogs = getImportedUnityCatalogKeys().length;
    const shownCount = folders.length + visible.length;
    const totalFiltered = query ? filtered.length : folders.length + visibleAssets.length;
    assetFooter.textContent = `${totalFiltered} entries${totalFiltered > shownCount ? ` (showing ${shownCount})` : ""} | imported: ${importedCount} (${importedCatalogs} catalogs)`;
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
      modelViewport.removeEventListener("pointerdown", onModelPointerDown);
      modelViewport.removeEventListener("pointerup", onModelPointerUp);
      modelViewport.removeEventListener("pointercancel", onModelPointerUp);
      modelViewport.removeEventListener("pointerleave", onModelPointerUp);
      modelViewport.removeEventListener("pointermove", onModelPointerMove);
      window.removeEventListener("resize", onWindowResize);
      modelPreviewRenderer.dispose();
      hiddenFileInput.remove();
      return;
    }
    refresh();
  }, 140);

  refresh();
  return root;
}
