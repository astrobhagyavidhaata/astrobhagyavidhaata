const fs = require("node:fs");
const path = require("node:path");

const root = path.join(process.cwd(), "node_modules");
const visited = new Set();
let patched = 0;

function patchPackage(packageDir) {
  const manifestPath = path.join(packageDir, "package.json");
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    if (!manifest.browser || typeof manifest.browser !== "object" || Array.isArray(manifest.browser)) return;

    let changed = false;
    for (const key of Object.keys(manifest.browser)) {
      const isNodeStreamShim = key === "stream" || key.endsWith("/streams") || key.endsWith("/extend-node");
      if (isNodeStreamShim && manifest.browser[key] === false) {
        delete manifest.browser[key];
        changed = true;
      }
    }

    if (changed) {
      if (Object.keys(manifest.browser).length === 0) delete manifest.browser;
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
      patched += 1;
      console.log("Patched iconv-lite browser stream mapping:", manifest.version);
    }
  } catch (error) {
    console.warn("Could not inspect iconv-lite package:", error.message);
  }
}

function walk(dir) {
  let realDir;
  try {
    realDir = fs.realpathSync(dir);
    if (visited.has(realDir)) return;
    visited.add(realDir);
  } catch {
    return;
  }

  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.name === ".bin") continue;
    const child = path.join(dir, entry.name);
    let isDirectory = entry.isDirectory();
    if (!isDirectory && entry.isSymbolicLink()) {
      try { isDirectory = fs.statSync(child).isDirectory(); } catch { /* ignore broken links */ }
    }
    if (!isDirectory) continue;
    if (entry.name === "iconv-lite") patchPackage(child);
    walk(child);
  }
}

if (fs.existsSync(root)) walk(root);
console.log(`Cloudflare iconv-lite compatibility patch: ${patched} package(s) updated.`);
