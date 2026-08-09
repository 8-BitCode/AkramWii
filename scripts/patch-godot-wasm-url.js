// scripts/patch-godot-wasm-url.js
//
// Godot's web export regenerates `public/portfolio.js` on every export from
// the editor, which always fetches `portfolio.wasm` from the same origin as
// the page. Since we host portfolio.wasm on R2 (it's too large for
// Cloudflare Workers' 25 MiB asset limit — see package.json's `postbuild`),
// we patch the primary wasm fetch to point at the CDN instead.
//
// This script is safe to run repeatedly: it checks whether the patch is
// already applied before touching the file, so re-running it after Godot
// re-exports (which restores the original unpatched file) will re-apply
// the fix, and running it on an already-patched file is a no-op.

import fs from 'node:fs';
import path from 'node:path';

const CDN_WASM_URL = 'https://assets.akramawel.com/portfolio.wasm';
const ENGINE_JS_PATH = path.resolve('public/portfolio.js');

const ORIGINAL = 'loadPromise = preloader.loadPromise(`${loadPath}.wasm`, size, true);';
const PATCHED = `loadPromise = preloader.loadPromise('${CDN_WASM_URL}', size, true);`;

function main() {
  if (!fs.existsSync(ENGINE_JS_PATH)) {
    console.warn(`[patch-godot-wasm-url] ${ENGINE_JS_PATH} not found — skipping. ` +
      `If your Godot export lives somewhere else, update ENGINE_JS_PATH in this script.`);
    return;
  }

  const src = fs.readFileSync(ENGINE_JS_PATH, 'utf8');

  if (src.includes(PATCHED)) {
    console.log('[patch-godot-wasm-url] Already patched, nothing to do.');
    return;
  }

  if (src.includes(ORIGINAL)) {
    fs.writeFileSync(ENGINE_JS_PATH, src.replace(ORIGINAL, PATCHED));
    console.log(`[patch-godot-wasm-url] Patched portfolio.js to load wasm from ${CDN_WASM_URL}`);
    return;
  }

  console.warn(
    '[patch-godot-wasm-url] WARNING: expected Engine.load line not found in portfolio.js. ' +
    'Godot\'s export template may have changed format (e.g. after a Godot version upgrade). ' +
    'The game will fall back to loading portfolio.wasm same-origin, which will 404. ' +
    'Open public/portfolio.js, search for "loadPromise = preloader.loadPromise", and update ' +
    'this script\'s ORIGINAL/PATCHED strings to match the new code.'
  );
}

main();