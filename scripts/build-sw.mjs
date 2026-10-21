import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcPath = path.resolve(__dirname, "../src/service-worker/sw.js");
const destPath = path.resolve(__dirname, "../public/sw.js");

try {
  fs.copyFileSync(srcPath, destPath);
  console.log("✓ Service Worker copiado para public/sw.js com sucesso");
} catch (err) {
  console.error("Erro ao gerar public/sw.js:", err);
  process.exit(1);
}
