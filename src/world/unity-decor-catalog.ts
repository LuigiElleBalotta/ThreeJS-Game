import { UNITY_WORLD_DECORATIONS, type UnityDecorationConfig } from "./unity-decor.config";

const LOCAL_STORAGE_KEY = "wowts.unity_decor_catalog.external.v1";
const CATALOG_VERSION = "wowts.decor-catalog.v1";
const LEGACY_CATALOG_KEY = "__legacy_import__";

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

type ImportedCatalogRow = {
  importedAt: number;
  decorations: UnityDecorationConfig[];
};

type ImportedCatalogStoreV2 = {
  version: 2;
  catalogs: Record<string, ImportedCatalogRow>;
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

function isValidCatalogKey(key: string) {
  return /^[a-zA-Z0-9._-]{3,64}$/.test(key);
}

function parseCatalogSource(parsed: any): { source: DecorCatalogFile; entries: ImportableDecor[] } {
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
  return { source, entries };
}

function normalizeStore(raw: any): ImportedCatalogStoreV2 {
  if (!raw) return { version: 2, catalogs: {} };

  if (Array.isArray(raw)) {
    const legacyRows = raw.filter((row) => row && typeof row.id === "string" && typeof row.path === "string");
    if (!legacyRows.length) return { version: 2, catalogs: {} };
    return {
      version: 2,
      catalogs: {
        [LEGACY_CATALOG_KEY]: {
          importedAt: Date.now(),
          decorations: legacyRows,
        },
      },
    };
  }

  if (raw.version === 2 && raw.catalogs && typeof raw.catalogs === "object") {
    const out: ImportedCatalogStoreV2 = { version: 2, catalogs: {} };
    for (const [key, value] of Object.entries<any>(raw.catalogs)) {
      if (!value || typeof value !== "object") continue;
      const decorations = Array.isArray(value.decorations)
        ? value.decorations.filter((row) => row && typeof row.id === "string" && typeof row.path === "string")
        : [];
      if (!decorations.length) continue;
      out.catalogs[key] = {
        importedAt: typeof value.importedAt === "number" ? value.importedAt : Date.now(),
        decorations,
      };
    }
    return out;
  }

  return { version: 2, catalogs: {} };
}

function loadStore(): ImportedCatalogStoreV2 {
  if (!canUseLocalStorage()) return { version: 2, catalogs: {} };
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return { version: 2, catalogs: {} };
    return normalizeStore(JSON.parse(raw));
  } catch {
    return { version: 2, catalogs: {} };
  }
}

function saveStore(store: ImportedCatalogStoreV2) {
  if (!canUseLocalStorage()) return;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(store));
}

export function getImportedUnityCatalogKeys() {
  const store = loadStore();
  return Object.keys(store.catalogs).sort((a, b) => a.localeCompare(b));
}

export function validateUnityDecorCatalogJson(jsonText: string) {
  try {
    const parsed = JSON.parse(jsonText);
    const { source, entries } = parseCatalogSource(parsed);
    let validAssets = 0;
    let skipped = 0;
    for (const row of entries) {
      const clean = sanitizeDecor(row, source.baseUrl);
      if (clean) validAssets += 1;
      else skipped += 1;
    }
    if (!validAssets) {
      return { ok: false as const, error: "Catalog contains no valid assets (required: id + url/path/model/resource)." };
    }
    return {
      ok: true as const,
      validAssets,
      skipped,
      totalRows: entries.length,
      version: source.version ?? CATALOG_VERSION,
    };
  } catch (err: any) {
    return { ok: false as const, error: err?.message ?? "Invalid catalog JSON." };
  }
}

export function getImportedUnityDecorations(): UnityDecorationConfig[] {
  const store = loadStore();
  const out: UnityDecorationConfig[] = [];
  for (const key of Object.keys(store.catalogs)) {
    out.push(...store.catalogs[key].decorations);
  }
  return out;
}

export function removeImportedUnityCatalog(catalogKey: string) {
  const key = ensureValidString(catalogKey);
  if (!key) return false;
  const store = loadStore();
  if (!store.catalogs[key]) return false;
  delete store.catalogs[key];
  saveStore(store);
  return true;
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

export function importUnityDecorationsFromCatalogJson(jsonText: string, catalogKey: string) {
  const key = ensureValidString(catalogKey);
  if (!key) throw new Error("Catalog key is required.");
  if (!isValidCatalogKey(key)) {
    throw new Error("Invalid catalog key. Use 3-64 chars: letters, numbers, dot, dash, underscore.");
  }

  const store = loadStore();
  if (store.catalogs[key]) {
    throw new Error(`Catalog key '${key}' already exists. Choose a new key.`);
  }

  const parsed = JSON.parse(jsonText);
  const { source, entries } = parseCatalogSource(parsed);

  const decorations: UnityDecorationConfig[] = [];
  let skipped = 0;
  for (const row of entries) {
    const clean = sanitizeDecor(row, source.baseUrl);
    if (!clean) {
      skipped += 1;
      continue;
    }
    decorations.push(clean);
  }
  if (!decorations.length) {
    throw new Error("No valid assets found in catalog.");
  }

  store.catalogs[key] = {
    importedAt: Date.now(),
    decorations,
  };
  saveStore(store);

  return {
    catalogKey: key,
    added: decorations.length,
    skipped,
    totalImportedCatalogs: Object.keys(store.catalogs).length,
    catalogVersion: CATALOG_VERSION,
  };
}
