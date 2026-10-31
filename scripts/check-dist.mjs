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
  // Echte boom (AST): commentaar telt niet, haakjes worden uitgepakt, en een import of require
  // waarvan het argument geen letterlijke tekst is, wordt geweigerd: de herkomst staat niet vast.
  const bron = ts.createSourceFile('x.ts', tekst, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const uit = [];
  const letterlijk = (n) => {
    while (n && ts.isParenthesizedExpression(n)) n = n.expression;
    return n && (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) ? n.text : null;
  };
  const toets = (n) => {
    const t = letterlijk(n);
    if (t === null) uit.push('<niet-letterlijk>');
    else if (!t.startsWith('./') && !t.startsWith('../')) uit.push(t);
  };
  const loop = (n) => {
    if ((ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) && n.moduleSpecifier) toets(n.moduleSpecifier);
    else if (ts.isImportEqualsDeclaration(n) && ts.isExternalModuleReference(n.moduleReference)) toets(n.moduleReference.expression);
    else if (ts.isImportTypeNode(n)) toets(n.argument.literal ?? n.argument);
    else if (ts.isCallExpression(n)) {
      const f = n.expression;
      if (f.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(f) && f.text === 'require')) toets(n.arguments[0]);
    }
    ts.forEachChild(n, loop);
  };
  loop(bron);
  return [...new Set(uit)];
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
