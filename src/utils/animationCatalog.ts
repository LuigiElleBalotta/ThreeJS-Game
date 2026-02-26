import { loadModelByPath, mergeAnimationClips } from "./modelLoader";

export class AnimationCatalog {
  private static cache = new Map<string, string[]>();

  private static makeCacheKey(modelPath: string, animationSources?: string[]) {
    const extra = (animationSources ?? []).join("|");
    return `${modelPath}::${extra}`;
  }

  static async listClipNames(modelPath: string, animationSources?: string[]) {
    const key = this.makeCacheKey(modelPath, animationSources);
    const cached = this.cache.get(key);
    if (cached) return cached;

    const base = await loadModelByPath(modelPath);
    if (!base) {
      this.cache.set(key, []);
      return [];
    }

    const groups = [base.animations ?? []];
    for (const animPath of animationSources ?? []) {
      const extra = await loadModelByPath(animPath);
      if (extra?.animations?.length) groups.push(extra.animations);
    }

    const merged = mergeAnimationClips(...groups);
    const names = merged
      .map((clip) => clip?.name?.trim())
      .filter((name): name is string => !!name);
    const unique = Array.from(new Set(names));
    this.cache.set(key, unique);
    return unique;
  }
}

