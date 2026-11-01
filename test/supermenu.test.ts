// C' (Serge 01-11-2026 12:48 CET): het pakket is Sites ▾. Geen werelden meer.
import { describe, expect, it } from 'vitest';
import * as pakket from '../src/index';
import { heeftMinRol, sitesmenu, typelijst, typeVoorRol, SITES, HUB_BASIS, type OrgRole } from '../src/index';

const ROLLEN: OrgRole[] = ['owner', 'finance', 'operations', 'internal', 'member', 'contributor', 'guest'];
const ids = (u: { sites: { id: string }[] }) => u.sites.map((s) => s.id);
const voor = (rol: OrgRole | null, huidig = 'hub') => sitesmenu({ huidig, heeftMinRol: (m) => heeftMinRol(rol, m) });

// De verwachting letterlijk, als tabel (ander frame dan de code): gast Hub, Docs, Website;
// vanaf internal Interne docs; vanaf operations Operations-docs.
const VERWACHT: Record<OrgRole | 'anoniem', string[]> = {
  anoniem: ['hub', 'docs', 'website'],
  guest: ['hub', 'docs', 'website'],
  contributor: ['hub', 'docs', 'website'],
  member: ['hub', 'docs', 'website'],
  internal: ['hub', 'docs', 'interne-docs', 'website'],
  operations: ['hub', 'docs', 'interne-docs', 'operations', 'website'],
  finance: ['hub', 'docs', 'interne-docs', 'operations', 'website'],
  owner: ['hub', 'docs', 'interne-docs', 'operations', 'website'],
};

describe('rolhiërarchie', () => {
  it('owner is alles, guest is het minst', () => {
    expect(heeftMinRol('owner', 'finance')).toBe(true);
    expect(heeftMinRol('guest', 'member')).toBe(false);
    expect(heeftMinRol(null, 'guest')).toBe(false);
  });
});

describe('typeVoorRol', () => {
  it('volgt de tabel uit prd619', () => {
    expect(typeVoorRol(null)).toBe('anoniem');
    expect(typeVoorRol('guest')).toBe('anoniem');
    expect(typeVoorRol('member')).toBe('member');
    expect(typeVoorRol('contributor')).toBe('member');
    for (const r of ['internal', 'operations', 'finance', 'owner'] as OrgRole[]) expect(typeVoorRol(r)).toBe('medewerker');
  });
});

describe('sitesmenu per rol', () => {
  for (const rol of [null, ...ROLLEN]) {
    it(`${rol ?? 'anoniem'}`, () => expect(ids(voor(rol))).toEqual(VERWACHT[rol ?? 'anoniem']));
  }
  it('geen werelden meer in het pakket', () => {
    expect(Object.keys(pakket)).not.toContain('ITEMS');
    expect(Object.keys(pakket)).not.toContain('supermenu');
    expect(JSON.stringify(SITES)).not.toMatch(/wereld|bedrijf/i);
  });
  it('label is de huidige site, met precies één vinkje', () => {
    const m = voor('owner', 'operations');
    expect(m.label).toBe('Operations-docs');
    expect(m.sites.filter((s) => s.aan).map((s) => s.id)).toEqual(['operations']);
    expect(voor('owner', 'hub').label).toBe('Hub');
  });
  it('de huidige site staat er altijd in, ook als de rol hem niet zou tonen', () => {
    expect(ids(voor(null, 'interne-docs'))).toEqual(['hub', 'docs', 'interne-docs', 'website']);
  });
  it('onbekende huidige site: label Sites, geen vinkje', () => {
    const m = voor('owner', 'bestaat-niet');
    expect(m.label).toBe('Sites');
    expect(m.sites.some((s) => s.aan)).toBe(false);
  });
  it('Operations-docs is teal, niet amber (amber is Finance)', () => {
    const o = SITES.find((s) => s.id === 'operations')!;
    expect(o.iconClassName).toContain('section-operations');
    expect(o.iconClassName).not.toMatch(/amber|finance/);
  });
  it('extra sites komen erbij zonder iets weg te halen', () => {
    for (const r of ROLLEN) {
      const met = sitesmenu({
        huidig: 'hub', heeftMinRol: (m) => heeftMinRol(r, m),
        extra: [{ id: 'maps', name: 'Maps', description: '', icon: 'Map', url: 'https://maps.kroescontrol.nl', iconClassName: '' }],
      });
      expect(ids(met)).toEqual([...VERWACHT[r], 'maps']);
    }
  });
});

describe('item Hub: adres en terugweg', () => {
  const terugweg = { pad: '/bedrijf/finance/debiteuren', label: 'Finance · Debiteuren' };
  it('standaard naar de hub-start, hubBasis instelbaar (ook met slash aan het eind)', () => {
    expect(voor('owner', 'docs').sites[0].url).toBe(`${HUB_BASIS}/`);
    const m = sitesmenu({ huidig: 'docs', heeftMinRol: () => true, hubBasis: 'https://hub-next.kroescontrol.nl/' });
    expect(m.sites[0].url).toBe('https://hub-next.kroescontrol.nl/');
  });
  it('buiten de hub: terugweg als tweede regel en als link', () => {
    const hub = sitesmenu({ huidig: 'operations', heeftMinRol: () => true, terugweg, hubBasis: 'https://hub-next.kroescontrol.nl' }).sites[0];
    expect(hub.url).toBe('https://hub-next.kroescontrol.nl/bedrijf/finance/debiteuren');
    expect(hub.verder).toBe('Verder in Finance · Debiteuren');
  });
  it('in de hub zelf: geen terugweg', () => {
    const hub = sitesmenu({ huidig: 'hub', heeftMinRol: () => true, terugweg }).sites[0];
    expect(hub.verder).toBeUndefined();
    expect(hub.url).toBe(`${HUB_BASIS}/`);
  });
  for (const pad of ['//evil.example', 'https://evil.example', '/a?b=c', '/a#x', '/a/../b', '/a\\b', 'relatief', '/%2F%2Fevil', '/a//b']) {
    it(`een terugweg ${pad} wordt genegeerd (nooit naar buiten)`, () => {
      const hub = sitesmenu({ huidig: 'docs', heeftMinRol: () => true, terugweg: { pad, label: 'X' } }).sites[0];
      expect(hub.url).toBe(`${HUB_BASIS}/`);
      expect(hub.verder).toBeUndefined();
    });
  }
});

describe('typelijst (buiten de hub, uit het type)', () => {
  it('anoniem: Hub, Docs, Website', () => expect(ids(typelijst('anoniem', 'docs'))).toEqual(['hub', 'docs', 'website']));
  it('medewerker: Interne docs, maar geen Operations-docs (dat vraagt de echte rol, in de tak)', () => {
    expect(ids(typelijst('medewerker', 'docs'))).toEqual(['hub', 'docs', 'interne-docs', 'website']);
  });
  it('op Operations-docs zelf staat die er wel, als huidige site', () => {
    expect(ids(typelijst('medewerker', 'operations'))).toEqual(['hub', 'docs', 'interne-docs', 'operations', 'website']);
  });
});
