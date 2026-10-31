import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs
import { externeImports } from '../scripts/check-dist.mjs';

const fout = [
  'import "react";',
  'const x = import("react");',
  'const x = import(`react`);',
  'const x = import /* chunk */ ("react");',
  'const x = import(/* webpackChunk */ "react");',
  'import { jsx } from "react/jsx-runtime";',
  'export * from "@/hooks/useAuth";',
  'export { a } from "react-router-dom";',
  'const r = require("react-dom");',
  'import type { X } from "react";',
  'const x = import(("react"));',
  'const n = "react"; const x = import(n);',
  'const r = require(n);',
  'type T = import("react").X;',
  'const x = import("../node_modules/typescript/lib/typescript.js");',
  'import "../package.json";',
  'import "./sub/../../x.js";',
];
const goed = ['import { a } from "./a.js";', 'import "./sub/b.js";', 'const s = "react";', '// import "react"', '// import(`react`)', '/* require("react") */'];

describe('check-dist', () => {
  for (const t of fout) it(`weigert: ${t}`, () => expect(externeImports(t).length).toBeGreaterThan(0));
  for (const t of goed) it(`laat door: ${t}`, () => expect(externeImports(t)).toEqual([]));
});
