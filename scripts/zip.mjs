#!/usr/bin/env node

/**
 * Crée un zip de l'extension buildée pour distribution.
 *
 * Usage : node scripts/zip.mjs <target>
 * <target> = chrome | firefox | chrome-lite | firefox-lite
 *
 * Le zip est généré dans dist/<name>-v<version>-<target>.zip
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ZipArchive } from "archiver";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const target = process.argv[2];
const validTargets = ["chrome", "firefox", "chrome-lite", "firefox-lite"];

if (!target || !validTargets.includes(target)) {
  console.error(`❌ Usage: node scripts/zip.mjs <${validTargets.join("|")}>`);
  process.exit(1);
}

const pkg = JSON.parse(
  fs.readFileSync(path.join(projectRoot, "package.json"), "utf-8"),
);

const distDir = path.join(projectRoot, "dist", target);
const zipName = `${pkg.name}-v${pkg.version}-${target}.zip`;
const zipPath = path.join(projectRoot, "dist", zipName);

if (!fs.existsSync(distDir)) {
  console.error(
    `❌ Le dossier ${distDir} n'existe pas. Lance d'abord le build.`,
  );
  process.exit(1);
}

const output = fs.createWriteStream(zipPath);
const archive = new ZipArchive({ zlib: { level: 9 } });

output.on("close", () => {
  const sizeKB = (archive.pointer() / 1024).toFixed(2);
  console.log(
    `📦 [${target.toUpperCase()}] Zip créé : dist/${zipName} (${sizeKB} Ko)`,
  );
});

output.on("error", (err) => {
  console.error("❌ Erreur d'écriture du zip :", err);
  process.exit(1);
});

archive.on("error", (err) => {
  console.error("❌ Erreur d'archivage :", err);
  process.exit(1);
});

archive.pipe(output);
archive.directory(distDir, false);
archive.finalize();
