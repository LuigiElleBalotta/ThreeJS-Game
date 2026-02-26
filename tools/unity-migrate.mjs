import fs from "node:fs/promises";
import path from "node:path";

const cwd = process.cwd();

function parseArgs(argv) {
  const parsed = {
    source: "",
    target: path.join(cwd, "public", "unity-import"),
    copy: false,
    includeExt: new Set([".glb", ".gltf", ".fbx", ".obj", ".mtl", ".png", ".jpg", ".jpeg", ".bmp", ".mp3", ".wav"]),
    scriptsOut: path.join(cwd, "docs", "unity-script-inventory.json"),
    assetsOut: path.join(cwd, "docs", "unity-asset-report.json"),
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--source") parsed.source = argv[++i] ?? "";
    else if (arg === "--target") parsed.target = argv[++i] ?? parsed.target;
    else if (arg === "--copy") parsed.copy = true;
    else if (arg === "--dry-run") parsed.copy = false;
    else if (arg === "--include-ext") {
      const value = argv[++i] ?? "";
      parsed.includeExt = new Set(
        value
          .split(",")
          .map((ext) => ext.trim().toLowerCase())
          .filter(Boolean)
          .map((ext) => (ext.startsWith(".") ? ext : `.${ext}`)),
      );
    } else if (arg === "--scripts-out") parsed.scriptsOut = argv[++i] ?? parsed.scriptsOut;
    else if (arg === "--assets-out") parsed.assetsOut = argv[++i] ?? parsed.assetsOut;
  }

  return parsed;
}

async function walkFiles(rootDir) {
  const files = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const dir = stack.pop();
    if (!dir) continue;
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

function toPosix(p) {
  return p.split(path.sep).join("/");
}

function classifyScript(relativePath) {
  const lowered = relativePath.toLowerCase();
  if (lowered.includes("editor/")) return { category: "editor", runtimeCandidate: false };
  if (lowered.includes("standard assets/")) return { category: "standard-assets", runtimeCandidate: false };
  if (lowered.includes("realistic effects pack/")) return { category: "third-party-effects", runtimeCandidate: false };
  if (lowered.includes("objimport/")) return { category: "third-party-objimport", runtimeCandidate: false };
  if (lowered.startsWith("scripts/core/")) return { category: "core", runtimeCandidate: true };
  if (lowered.startsWith("game/scripts/")) return { category: "gameplay", runtimeCandidate: true };
  if (lowered.startsWith("game/pills/")) return { category: "gameplay", runtimeCandidate: true };
  return { category: "unclassified", runtimeCandidate: true };
}

async function ensureParent(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function writeJson(filePath, data) {
  await ensureParent(filePath);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.source) {
    console.error("Missing required argument: --source <UnityProjectPath>");
    process.exitCode = 1;
    return;
  }

  const unityAssetsRoot = path.join(args.source, "Assets");
  const allFiles = await walkFiles(unityAssetsRoot);

  const scriptRows = [];
  const assetRows = [];
  const copyRows = [];
  let totalAssetBytes = 0;

  for (const filePath of allFiles) {
    const ext = path.extname(filePath).toLowerCase();
    const relativeToAssets = toPosix(path.relative(unityAssetsRoot, filePath));
    const stat = await fs.stat(filePath);

    if (ext === ".meta") continue;

    if (ext === ".cs") {
      const scriptClass = classifyScript(relativeToAssets);
      scriptRows.push({
        path: relativeToAssets,
        runtimeCandidate: scriptClass.runtimeCandidate,
        category: scriptClass.category,
      });
      continue;
    }

    const accepted = args.includeExt.has(ext);
    if (!accepted) continue;

    totalAssetBytes += stat.size;
    assetRows.push({
      path: relativeToAssets,
      ext,
      bytes: stat.size,
    });

    if (args.copy) {
      const targetPath = path.join(args.target, relativeToAssets);
      await ensureParent(targetPath);
      await fs.copyFile(filePath, targetPath);
      copyRows.push({ from: filePath, to: targetPath });
    }
  }

  const runtimeScripts = scriptRows.filter((s) => s.runtimeCandidate);
  const editorOrThirdPartyScripts = scriptRows.filter((s) => !s.runtimeCandidate);

  await writeJson(args.scriptsOut, {
    generatedAt: new Date().toISOString(),
    source: args.source,
    totalScripts: scriptRows.length,
    runtimeScriptCandidates: runtimeScripts.length,
    editorOrThirdPartyScripts: editorOrThirdPartyScripts.length,
    scripts: scriptRows.sort((a, b) => a.path.localeCompare(b.path)),
  });

  const extCounts = {};
  for (const row of assetRows) {
    extCounts[row.ext] = (extCounts[row.ext] ?? 0) + 1;
  }

  await writeJson(args.assetsOut, {
    generatedAt: new Date().toISOString(),
    source: args.source,
    dryRun: !args.copy,
    target: args.target,
    totalAssetsMatched: assetRows.length,
    totalAssetBytes,
    totalAssetMegabytes: Number((totalAssetBytes / (1024 * 1024)).toFixed(2)),
    byExtension: extCounts,
    copiedAssets: args.copy ? copyRows.length : 0,
    includeExtensions: Array.from(args.includeExt).sort(),
  });

  console.log("Unity migration summary");
  console.log(`- Source: ${args.source}`);
  console.log(`- Assets matched: ${assetRows.length}`);
  console.log(`- Estimated size: ${(totalAssetBytes / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`- Scripts found: ${scriptRows.length} (runtime candidates: ${runtimeScripts.length})`);
  console.log(`- Copy mode: ${args.copy ? "enabled" : "dry-run"}`);
  console.log(`- Script inventory: ${args.scriptsOut}`);
  console.log(`- Asset report: ${args.assetsOut}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
