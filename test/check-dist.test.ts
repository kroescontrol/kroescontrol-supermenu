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
];
const goed = ['import { a } from "./a.js";', 'export * from "../b.js";', 'const s = "react";', '// import "react"'];

describe('check-dist', () => {
  for (const t of fout) it(`weigert: ${t}`, () => expect(externeImports(t).length).toBeGreaterThan(0));
  for (const t of goed) it(`laat door: ${t}`, () => expect(externeImports(t)).toEqual([]));
});
