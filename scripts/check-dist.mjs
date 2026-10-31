// prd619 fase B, harde poort: dist/ importeert NIETS van buiten het pakket.
// Strenger dan een zwarte lijst: elke modulespecificatie die niet met './' of '../' begint is fout
// (statische en dynamische import, export-from, require), recursief over alle .js en .d.ts.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

function bestanden(map) {
  return readdirSync(map).flatMap((n) => {
    const p = join(map, n);
    return statSync(p).isDirectory() ? bestanden(p) : /\.(m?js|d\.ts)$/.test(n) ? [p] : [];
  });
}
const SPEC = [
  /\bfrom\s*['"]([^'"]+)['"]/g,
  /\bimport\s*['"]([^'"]+)['"]/g,
  /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
];
let lijst;
try { lijst = bestanden(process.argv[2] ?? 'dist'); } catch { lijst = []; }
if (lijst.length === 0) { console.error('check-dist KON NIET KIJKEN: dist is leeg of ontbreekt'); process.exit(2); }
let fout = 0;
for (const f of lijst) {
  const t = readFileSync(f, 'utf8');
  for (const r of SPEC) for (const m of t.matchAll(r)) {
    if (!m[1].startsWith('./') && !m[1].startsWith('../')) { console.error(`FOUT: ${f} importeert '${m[1]}'`); fout++; }
  }
}
console.log(`check-dist: ${lijst.length} bestanden getoetst, ${fout} fouten`);
process.exit(fout ? 1 : 0);
