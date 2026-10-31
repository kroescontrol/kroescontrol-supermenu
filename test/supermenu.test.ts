import { describe, expect, it } from 'vitest';
import { heeftMinRol, supermenu, typelijst, typeVoorRol, naamVoor, ITEMS, type OrgRole } from '../src/index';

const ROLLEN: OrgRole[] = ['owner', 'finance', 'operations', 'internal', 'member', 'contributor', 'guest'];

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

describe('typelijst', () => {
  it('anoniem ziet alleen Docs en Website, geen interne items', () => {
    const t = typelijst('anoniem');
    expect(t.sites.map((s) => s.id)).toEqual(['docs', 'website']);
    expect(t.werelden.map((w) => w.id)).toEqual(['team']);
  });
  it('medewerker ziet Interne docs, maar geen Bedrijf en geen Operations-docs (dat is een uitzondering in de tak)', () => {
    const t = typelijst('medewerker');
    expect(t.sites.map((s) => s.id)).toContain('interne-docs');
    expect(t.sites.map((s) => s.id)).not.toContain('operations');
    expect(t.werelden.map((w) => w.id)).toEqual(['team']);
  });
  it('werelden linken buiten de hub naar de hub', () => {
    expect(typelijst('anoniem').werelden[0].url).toBe('https://hub.kroescontrol.nl/team');
  });
});

describe('supermenu', () => {
  it('Community als naam van Team voor een gast', () => {
    expect(naamVoor(ITEMS[0], 'guest')).toBe('Community');
    expect(naamVoor(ITEMS[0], 'member')).toBe('Team');
  });
  it('extra items komen erbij zonder iets weg te halen', () => {
    for (const r of ROLLEN) {
      const basis = supermenu({ wereld: 'team', werelden: ['team'], heeftMinRol: (m) => heeftMinRol(r, m) });
      const met = supermenu({
        wereld: 'team', werelden: ['team'], heeftMinRol: (m) => heeftMinRol(r, m),
        extra: [{ id: 'maps', name: 'Maps', description: '', icon: 'Map', url: 'https://maps.kroescontrol.nl', external: true, iconClassName: '', soort: 'site', werelden: ['team', 'bedrijf'] }],
      });
      expect(met.sites.map((s) => s.id)).toEqual([...basis.sites.map((s) => s.id), 'maps']);
    }
  });
});
