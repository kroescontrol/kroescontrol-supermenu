// C' (Serge 01-11-2026 12:48 CET): het pakket is Sites ▾. Geen werelden meer.
import { describe, expect, it } from 'vitest';
import * as pakket from '../src/index';
import { heeftMinRol, hubSiteVoorPad, sitesmenu, typelijst, typeVoorRol, SITES, HUB_BASIS, HUB_SITES, type OrgRole } from '../src/index';

const ROLLEN: OrgRole[] = ['owner', 'finance', 'operations', 'internal', 'member', 'contributor', 'guest'];
const ids = (u: { sites: { id: string }[] }) => u.sites.map((s) => s.id);
const voor = (rol: OrgRole | null, huidig = 'hub') => sitesmenu({ huidig, heeftMinRol: (m) => heeftMinRol(rol, m) });

// De verwachting letterlijk, als tabel (ander frame dan de code): gast Hub, Docs, Website;
// vanaf internal Interne docs; vanaf operations Bedrijf en Operations-docs (0.4.0, Serge 01-11 14:41).
const VERWACHT: Record<OrgRole | 'anoniem', string[]> = {
  anoniem: ['hub', 'docs', 'website'],
  guest: ['hub', 'docs', 'website'],
  contributor: ['hub', 'docs', 'website'],
  member: ['hub', 'docs', 'website'],
  internal: ['hub', 'docs', 'interne-docs', 'website'],
  operations: ['hub', 'bedrijf', 'docs', 'interne-docs', 'operations', 'website'],
  finance: ['hub', 'bedrijf', 'docs', 'interne-docs', 'operations', 'website'],
  owner: ['hub', 'bedrijf', 'docs', 'interne-docs', 'operations', 'website'],
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
  it('geen werelden meer in het pakket; Bedrijf is een site', () => {
    expect(Object.keys(pakket)).not.toContain('ITEMS');
    expect(Object.keys(pakket)).not.toContain('supermenu');
    expect(JSON.stringify(SITES)).not.toMatch(/wereld/i);
    expect(SITES.map((s) => s.name)).toEqual(['Hub', 'Bedrijf', 'Docs', 'Interne docs', 'Operations-docs', 'Website']);
    const b = SITES.find((s) => s.id === 'bedrijf')!;
    expect(b.description).toBe('Finance, operations en beheer');
    expect(b.minRole).toBe('operations');
    expect(HUB_SITES).toEqual(['hub', 'bedrijf']);
  });
  it('huidig bedrijf: label Bedrijf, vinkje bij Bedrijf, adressen binnen de hub', () => {
    const m = sitesmenu({ huidig: 'bedrijf', heeftMinRol: () => true, hubBasis: 'https://hub-next.kroescontrol.nl' });
    expect(m.label).toBe('Bedrijf');
    expect(m.sites.filter((s) => s.aan).map((s) => s.id)).toEqual(['bedrijf']);
    expect(m.sites[0].url).toBe('https://hub-next.kroescontrol.nl/');
    expect(m.sites[1].url).toBe('https://hub-next.kroescontrol.nl/bedrijf');
  });
  it('hubSiteVoorPad: /bedrijf en daaronder is Bedrijf, de rest Hub', () => {
    expect(hubSiteVoorPad('/bedrijf')).toBe('bedrijf');
    expect(hubSiteVoorPad('/bedrijf/')).toBe('bedrijf');
    expect(hubSiteVoorPad('/bedrijf/finance/debiteuren')).toBe('bedrijf');
    expect(hubSiteVoorPad('/bedrijfsleven')).toBe('hub');
    expect(hubSiteVoorPad('/team')).toBe('hub');
    expect(hubSiteVoorPad('/')).toBe('hub');
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
  const regel = (m: { sites: { id: string; url: string; verder?: string }[] }, id: string) => m.sites.find((s) => s.id === id)!;
  it('buiten de hub, terugweg onder /bedrijf: "Verder in" bij Bedrijf, Hub naar de start', () => {
    const m = sitesmenu({ huidig: 'operations', heeftMinRol: () => true, terugweg, hubBasis: 'https://hub-next.kroescontrol.nl' });
    expect(regel(m, 'bedrijf').url).toBe('https://hub-next.kroescontrol.nl/bedrijf/finance/debiteuren');
    expect(regel(m, 'bedrijf').verder).toBe('Verder in Finance · Debiteuren');
    expect(regel(m, 'hub').url).toBe('https://hub-next.kroescontrol.nl/');
    expect(regel(m, 'hub').verder).toBeUndefined();
  });
  it('buiten de hub, terugweg buiten /bedrijf: "Verder in" bij Hub, Bedrijf naar /bedrijf', () => {
    const m = sitesmenu({ huidig: 'docs', heeftMinRol: () => true, terugweg: { pad: '/team/smoelen', label: 'Smoelen' } });
    expect(regel(m, 'hub').url).toBe(`${HUB_BASIS}/team/smoelen`);
    expect(regel(m, 'hub').verder).toBe('Verder in Smoelen');
    expect(regel(m, 'bedrijf').url).toBe(`${HUB_BASIS}/bedrijf`);
    expect(regel(m, 'bedrijf').verder).toBeUndefined();
  });
  it('terugweg onder /bedrijf maar Bedrijf staat er niet in: "Verder in" bij Hub, niet kwijt', () => {
    const m = typelijst('medewerker', 'docs', undefined, terugweg);
    expect(ids(m)).not.toContain('bedrijf');
    expect(regel(m, 'hub').url).toBe(`${HUB_BASIS}/bedrijf/finance/debiteuren`);
    expect(regel(m, 'hub').verder).toBe('Verder in Finance · Debiteuren');
  });
  it('/bedrijfsleven is geen Bedrijf', () => {
    const m = sitesmenu({ huidig: 'docs', heeftMinRol: () => true, terugweg: { pad: '/bedrijfsleven', label: 'X' } });
    expect(regel(m, 'hub').verder).toBe('Verder in X');
    expect(regel(m, 'hub').url).toBe(`${HUB_BASIS}/bedrijfsleven`);
    expect(regel(m, 'bedrijf').url).toBe(`${HUB_BASIS}/bedrijf`);
    expect(regel(m, 'bedrijf').verder).toBeUndefined();
  });
  it('terugweg precies /bedrijf hoort bij Bedrijf', () => {
    const m = sitesmenu({ huidig: 'docs', heeftMinRol: () => true, terugweg: { pad: '/bedrijf', label: 'Bedrijf' } });
    expect(regel(m, 'bedrijf')).toMatchObject({ url: `${HUB_BASIS}/bedrijf`, verder: 'Verder in Bedrijf' });
    expect(regel(m, 'hub').verder).toBeUndefined();
  });
  for (const huidig of ['hub', 'bedrijf']) {
    it(`in de hub-app zelf (${huidig}): geen terugweg`, () => {
      const m = sitesmenu({ huidig, heeftMinRol: () => true, terugweg });
      expect(m.sites.some((s) => s.verder)).toBe(false);
      expect(regel(m, 'hub').url).toBe(`${HUB_BASIS}/`);
      expect(regel(m, 'bedrijf').url).toBe(`${HUB_BASIS}/bedrijf`);
    });
  }
  for (const pad of ['//evil.example', 'https://evil.example', '/a?b=c', '/a#x', '/a/../b', '/a\\b', 'relatief', '/%2F%2Fevil', '/a//b']) {
    it(`een terugweg ${pad} wordt genegeerd (nooit naar buiten)`, () => {
      const m = sitesmenu({ huidig: 'docs', heeftMinRol: () => true, terugweg: { pad, label: 'X' } });
      expect(regel(m, 'hub').url).toBe(`${HUB_BASIS}/`);
      expect(regel(m, 'bedrijf').url).toBe(`${HUB_BASIS}/bedrijf`);
      expect(m.sites.some((s) => s.verder)).toBe(false);
    });
  }
});

describe('typelijst (buiten de hub, uit het type)', () => {
  it('anoniem: Hub, Docs, Website', () => expect(ids(typelijst('anoniem', 'docs'))).toEqual(['hub', 'docs', 'website']));
  it('medewerker: Interne docs, maar geen Bedrijf en geen Operations-docs (dat vraagt de echte rol, in de tak)', () => {
    expect(ids(typelijst('medewerker', 'docs'))).toEqual(['hub', 'docs', 'interne-docs', 'website']);
  });
  it('op Operations-docs zelf staat die er wel, als huidige site', () => {
    expect(ids(typelijst('medewerker', 'operations'))).toEqual(['hub', 'docs', 'interne-docs', 'operations', 'website']);
  });
});
