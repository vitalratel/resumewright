// ABOUTME: Bundles the Gleam background service worker using esbuild.
// ABOUTME: Resolves @pkg alias for the WASM bridge and outputs to the extension's public dir.

import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appGleamDir = path.resolve(__dirname, "..");
const packagesDir = path.resolve(appGleamDir, "..");
const rootDir = path.resolve(packagesDir, "..");

// Use the root node_modules esbuild (available as a transitive dep of vite)
const esbuildPath = path.join(rootDir, "node_modules/esbuild/lib/main.js");
const { build } = await import(esbuildPath);

await build({
  entryPoints: [path.join(appGleamDir, "background_entry.mjs")],
  bundle: true,
  format: "esm",
  outfile: path.join(packagesDir, "extension/public/gleam/background.mjs"),
  platform: "browser",
  // Resolve @pkg to the WASM bridge package
  alias: {
    "@pkg": path.join(packagesDir, "rust-core/wasm-bridge/pkg"),
  },
  // Don't attempt to bundle the .wasm binary — it's fetched at runtime
  loader: {
    ".wasm": "empty",
  },
});

console.log("✓ Background service worker bundled to extension/public/gleam/background.mjs");
