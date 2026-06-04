import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import esbuild from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "dist");
const srcDir = path.join(__dirname, "src");

async function buildBundle(entryPoint, outfile, format) {
  await esbuild.build({
    entryPoints: [path.join(srcDir, entryPoint)],
    outfile: path.join(distDir, outfile),
    bundle: true,
    format,
    target: "chrome120",
    sourcemap: false,
    minify: false,
    logLevel: "info"
  });
}

async function main() {
  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });

  await Promise.all([
    buildBundle("background.js", "background.js", "esm"),
    buildBundle("content.js", "content.js", "iife"),
    buildBundle("popup.js", "popup.js", "iife"),
    cp(path.join(srcDir, "manifest.json"), path.join(distDir, "manifest.json")),
    cp(path.join(srcDir, "popup.html"), path.join(distDir, "popup.html")),
    cp(path.join(srcDir, "popup.css"), path.join(distDir, "popup.css"))
  ]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
