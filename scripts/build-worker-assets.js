"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const output = path.join(root, "worker-assets");
const publicDir = path.join(root, "public");

function copyRequired(source, destination) {
  if (!fs.existsSync(source)) {
    throw new Error("Required frontend file is missing: " + path.relative(root, source));
  }
  fs.copyFileSync(source, destination);
}

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

// The current app shell lives at the repository root; browser scripts live in /public.
copyRequired(path.join(root, "index.html"), path.join(output, "index.html"));
copyRequired(path.join(root, "TERMS.md"), path.join(output, "TERMS.md"));
copyRequired(path.join(root, "PRIVACY.md"), path.join(output, "PRIVACY.md"));

if (!fs.existsSync(publicDir)) {
  throw new Error("Required public/ directory is missing.");
}
fs.cpSync(publicDir, output, { recursive: true, force: true });

const requiredBrowserFiles = [
  "kundli.js",
  "wallet.js",
  "auth.js",
  "kundli-history.js",
  "ai_chat.js",
  "panchang.js",
  "gochar.js"
];
for (const file of requiredBrowserFiles) {
  if (!fs.existsSync(path.join(output, file))) {
    throw new Error("Frontend build is missing public/" + file);
  }
}

console.log("Cloudflare assets prepared:", output);
console.log("Included app shell, legal pages and", requiredBrowserFiles.length, "browser scripts.");
