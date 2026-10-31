// prd619 fase B, harde poort: de build importeert niets uit react, react-router-dom, '@/' of hub-hooks.
import { readdirSync, readFileSync } from 'node:fs';
const verboden = [/from ['"]react['"]/, /from ['"]react-router-dom['"]/, /from ['"]@\//, /import[^;]*\b(useAuth|useWereld|useFilteredNav)\b/];
const files = readdirSync('dist').filter((f) => f.endsWith('.js'));
if (files.length === 0) { console.error('FOUT: dist is leeg, niets getoetst'); process.exit(1); }
let fout = 0;
for (const f of files) {
  const t = readFileSync(`dist/${f}`, 'utf8');
  for (const r of verboden) if (r.test(t)) { console.error(`FOUT: ${f} bevat ${r}`); fout++; }
}
console.log(`check-dist: ${files.length} bestanden getoetst, ${fout} fouten`);
process.exit(fout ? 1 : 0);
