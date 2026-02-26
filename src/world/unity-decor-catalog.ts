import { UNITY_WORLD_DECORATIONS, type UnityDecorationConfig } from "./unity-decor.config";

const LOCAL_STORAGE_KEY = "wowts.unity_decor_catalog.external.v1";
const CATALOG_VERSION = "wowts.decor-catalog.v1";

type ImportableDecor = Partial<UnityDecorationConfig> & {
  id?: string;
  url?: string;
  path?: string;
  model?: string;
  resource?: string;
  preview?: string;
  animations?: string[];
  tags?: string[];
};

type DecorCatalogFile = {
  version?: string;
  baseUrl?: string;
  assets?: ImportableDecor[];
  decorations?: ImportableDecor[];
};

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function ensureValidNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return undefined;
}

function ensureValidString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function ensureValidBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  return undefined;
}

function resolveUrl(baseUrl: string | undefined, value: string): string {
  if (/^https?:\/\//i.test(value) || value.startsWith("/")) return value;
  if (!baseUrl) return value;
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return value;
  }
}

function sanitizeDecor(input: ImportableDecor, baseUrl?: string): UnityDecorationConfig | null {
  const id = ensureValidString(input.id);
  const path =
    ensureValidString(input.url) ??
    ensureValidString(input.path) ??
    ensureValidString(input.model) ??
    ensureValidString(input.resource);
  if (!id || !path) return null;

  const result: UnityDecorationConfig = {
    id,
    path: resolveUrl(baseUrl, path),
    position: { x: 0, y: 0, z: 0 },
    defaultSpawn: false,
    placeOnGround: true,
  };

  const previewImage = ensureValidString(input.previewImage) ?? ensureValidString(input.preview);
  if (previewImage) result.previewImage = resolveUrl(baseUrl, previewImage);

  const animationSources = Array.isArray(input.animationSources) ? input.animationSources : input.animations;
  if (Array.isArray(animationSources)) {
    const animations = animationSources
      .map((row) => ensureValidString(row))
      .filter((row): row is string => !!row)
      .map((row) => resolveUrl(baseUrl, row));
    if (animations.length) result.animationSources = animations;
  }

  // Optional advanced fields; not required for asset-library catalogs.
  const position = input.position as any;
  if (position && typeof position === "object") {
    result.position = {
      x: ensureValidNumber(position.x) ?? 0,
      y: ensureValidNumber(position.y) ?? 0,
      z: ensureValidNumber(position.z) ?? 0,
    };
  }

  const rotationY = ensureValidNumber(input.rotationY);
  if (rotationY !== undefined) result.rotationY = rotationY;
  const scale = ensureValidNumber(input.scale);
  if (scale !== undefined) result.scale = scale;
  const targetHeight = ensureValidNumber(input.targetHeight);
  if (targetHeight !== undefined) result.targetHeight = targetHeight;
  const yOffset = ensureValidNumber(input.yOffset);
  if (yOffset !== undefined) result.yOffset = yOffset;

  const placeOnGround = ensureValidBoolean(input.placeOnGround);
  if (placeOnGround !== undefined) result.placeOnGround = placeOnGround;
  const collider = ensureValidBoolean(input.collider);
  if (collider !== undefined) result.collider = collider;
  const defaultSpawn = ensureValidBoolean(input.defaultSpawn);
  if (defaultSpawn !== undefined) result.defaultSpawn = defaultSpawn;

  if (Array.isArray(input.preferredAnimationKeywords)) {
    const words = input.preferredAnimationKeywords
      .map((row) => ensureValidString(row))
      .filter((row): row is string => !!row);
    if (words.length) result.preferredAnimationKeywords = words;
  }

  const light = input.light as any;
  if (light && typeof light === "object") {
    const color = ensureValidNumber(light.color);
    const intensity = ensureValidNumber(light.intensity);
    const distance = ensureValidNumber(light.distance);
    if (color !== undefined && intensity !== undefined && distance !== undefined) {
      result.light = {
        color,
        intensity,
        distance,
      };
      const lightYOffset = ensureValidNumber(light.yOffset);
      if (lightYOffset !== undefined) result.light.yOffset = lightYOffset;
    }
  }

  return result;
}

export function getImportedUnityDecorations(): UnityDecorationConfig[] {
  if (!canUseLocalStorage()) return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((row) => row && typeof row.id === "string" && typeof row.path === "string");
  } catch {
    return [];
  }
}

function setImportedUnityDecorations(rows: UnityDecorationConfig[]) {
  if (!canUseLocalStorage()) return;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(rows));
}

export function clearImportedUnityDecorations() {
  if (!canUseLocalStorage()) return;
  localStorage.removeItem(LOCAL_STORAGE_KEY);
}

export function getUnityDecorations(): UnityDecorationConfig[] {
  const external = getImportedUnityDecorations();
  if (!external.length) return UNITY_WORLD_DECORATIONS;
  const merged = [...UNITY_WORLD_DECORATIONS];
  const existingIndex = new Map<string, number>();
  for (let i = 0; i < merged.length; i += 1) existingIndex.set(merged[i].id, i);
  for (const row of external) {
    const idx = existingIndex.get(row.id);
    if (idx === undefined) merged.push(row);
    else merged[idx] = row;
  }
  return merged;
}

export function getUnityDecorationById(id: string): UnityDecorationConfig | null {
  const rows = getUnityDecorations();
  for (const row of rows) {
    if (row.id === id) return row;
  }
  return null;
}

export function importUnityDecorationsFromCatalogJson(jsonText: string) {
  const parsed = JSON.parse(jsonText);
  const source: DecorCatalogFile = Array.isArray(parsed) ? { decorations: parsed } : parsed;
  if (!source || typeof source !== "object") {
    throw new Error("Invalid catalog JSON.");
  }
  if (source.version && source.version !== CATALOG_VERSION) {
    throw new Error(`Unsupported catalog version '${source.version}'. Expected '${CATALOG_VERSION}'.`);
  }
  const entries = Array.isArray(source.assets)
    ? source.assets
    : Array.isArray(source.decorations)
      ? source.decorations
      : null;
  if (!entries) {
    throw new Error("Catalog must contain an 'assets' array (or legacy 'decorations').");
  }

  const imported = getImportedUnityDecorations();
  const byId = new Map<string, UnityDecorationConfig>();
  for (const row of imported) byId.set(row.id, row);

  let added = 0;
  let updated = 0;
  let skipped = 0;
  for (const row of entries) {
    const clean = sanitizeDecor(row, source.baseUrl);
    if (!clean) {
      skipped += 1;
      continue;
    }
    if (byId.has(clean.id)) updated += 1;
    else added += 1;
    byId.set(clean.id, clean);
  }

  setImportedUnityDecorations(Array.from(byId.values()));
  return {
    added,
    updated,
    skipped,
    totalImported: byId.size,
    catalogVersion: CATALOG_VERSION,
  };
}
