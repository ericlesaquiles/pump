// Downloads the exercise GIFs listed in data/gif-map.json into public/media/gymvisual/
// for builds made on this machine. Run: npm run fetch:gifs
//
// The GIFs are © Gym visual (https://gymvisual.com/). They are NOT licensed with the
// exercises-dataset repository they're downloaded from, so this folder is git-ignored and
// must stay out of anything you share or publish. Build without them: PUMP_NO_GIFS=1.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

interface GifMap { map: Record<string, { id: string; name: string; file: string }> }

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(root, "public/media/gymvisual");
const BASE = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/";
const { map } = JSON.parse(readFileSync(path.join(root, "data/gif-map.json"), "utf8")) as GifMap;

mkdirSync(outDir, { recursive: true });
const index: Record<string, string> = {};
let fetched = 0;
let failed = 0;
for (const [exId, { file }] of Object.entries(map)) {
  const dest = path.join(outDir, file);
  if (!existsSync(dest)) {
    const res = await fetch(BASE + file);
    if (!res.ok) { console.error(`${exId}: ${file} → HTTP ${res.status}`); failed++; continue; }
    writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    fetched++;
  }
  index[exId] = file;
}
writeFileSync(path.join(outDir, "index.json"), JSON.stringify(index));
console.log(`${Object.keys(index).length} GIFs ready in public/media/gymvisual (${fetched} downloaded, ${failed} failed).`);
console.log("© Gym visual — for personal use on your own device only; don't commit, share or publish these files.");
