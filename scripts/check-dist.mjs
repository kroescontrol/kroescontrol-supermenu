// prd619 fase B, harde poort: dist/ importeert NIETS van buiten het pakket.
// Leest de importen met de parser van TypeScript (ts.preProcessFile), dus ook dynamische import
// met backticks of commentaar, export-from en require. Elke specificatie die niet met './' of
// '../' begint is fout. Recursief over alle .js, .mjs en .d.ts.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';

function bestanden(map) {
  return readdirSync(map).flatMap((n) => {
    const p = join(map, n);
    return statSync(p).isDirectory() ? bestanden(p) : /\.(m?js|d\.ts)$/.test(n) ? [p] : [];
  });
}
export function externeImports(tekst) {
  const info = ts.preProcessFile(tekst, true, true);
  const uit = info.importedFiles.map((f) => f.fileName);
  // preProcessFile ziet import(`x`) met een template zonder substituties ook; vang de rest grof af:
  for (const m of tekst.matchAll(/\bimport\s*(?:\/\*[\s\S]*?\*\/\s*)*\(\s*(?:\/\*[\s\S]*?\*\/\s*)*[`'"]([^`'"]+)[`'"]/g)) uit.push(m[1]);
  for (const m of tekst.matchAll(/\brequire\s*\(\s*[`'"]([^`'"]+)[`'"]/g)) uit.push(m[1]);
  return [...new Set(uit)].filter((s) => !s.startsWith('./') && !s.startsWith('../'));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let lijst;
  try { lijst = bestanden(process.argv[2] ?? 'dist'); } catch { lijst = []; }
  if (lijst.length === 0) { console.error('check-dist KON NIET KIJKEN: dist is leeg of ontbreekt'); process.exit(2); }
  let fout = 0;
  for (const f of lijst) for (const s of externeImports(readFileSync(f, 'utf8'))) { console.error(`FOUT: ${f} importeert '${s}'`); fout++; }
  console.log(`check-dist: ${lijst.length} bestanden getoetst, ${fout} fouten`);
  process.exit(fout ? 1 : 0);
}
