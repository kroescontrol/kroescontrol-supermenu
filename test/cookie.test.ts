// prd619 fase C2: het type komt uit het feitjes-cookie en stuurt alleen het menu, nooit rechten.
import { describe, expect, it } from 'vitest';
import { cookieWaarde, leesFeiten, menuUitCookie, typeUitCookie, typelijst, FEITEN_LEEG } from '../src/index';

const koek = (o: unknown, naam = 'kc_feiten') => `thema=dark; ${naam}=${encodeURIComponent(JSON.stringify(o))}; _ga=x`;

describe('cookieWaarde', () => {
  it('vindt precies de naam, ook tussen andere cookies', () => {
    expect(cookieWaarde('a=1; kc_feiten=%7B%22v%22%3A1%7D; kc_feiten_oud=2')).toBe('{"v":1}');
    expect(cookieWaarde('kc_feiten_oud=2')).toBeNull();
    expect(cookieWaarde(null)).toBeNull();
    expect(cookieWaarde('')).toBeNull();
  });
});

describe('leesFeiten: streng, anders leeg', () => {
  it('geldig cookie', () => {
    expect(leesFeiten(koek({ v: 1, ingelogd: true, type: 'medewerker', thema: 'dark', taal: 'nl' })))
      .toEqual({ v: 1, ingelogd: true, type: 'medewerker', thema: 'dark', taal: 'nl' });
  });
  it('onbekende velden worden genegeerd, bekende blijven', () => {
    expect(leesFeiten(koek({ v: 1, ingelogd: false, type: 'member', later: 'x' }))).toEqual({ v: 1, ingelogd: false, type: 'member' });
  });
  const leeg: [string, string | null][] = [
    ['geen cookie', null],
    ['geen JSON', 'kc_feiten=medewerker'],
    ['geen object', koek(['medewerker'])],
    ['verkeerde versie', koek({ v: 2, ingelogd: true, type: 'medewerker' })],
    ['versie ontbreekt', koek({ ingelogd: true, type: 'medewerker' })],
    ['onbekend type', koek({ v: 1, ingelogd: true, type: 'owner' })],
    ['type ontbreekt', koek({ v: 1, ingelogd: true })],
    ['ingelogd geen boolean', koek({ v: 1, ingelogd: 'ja', type: 'member' })],
    ['onbekend thema', koek({ v: 1, ingelogd: false, type: 'member', thema: 'paars' })],
    ['onbekende taal', koek({ v: 1, ingelogd: false, type: 'member', taal: 'xx' })],
    ['te lang', `kc_feiten=${'x'.repeat(2000)}`],
  ];
  for (const [naam, c] of leeg) it(`leeg bij ${naam}`, () => expect(leesFeiten(c)).toEqual(FEITEN_LEEG));
  it('het lege cookie is anoniem en niet ingelogd', () => {
    expect(FEITEN_LEEG).toEqual({ v: 1, ingelogd: false, type: 'anoniem' });
  });
});

describe('vervalst cookie toont alleen de typelijst (harde poort C2)', () => {
  it('medewerker als type: wel Interne docs, nooit Bedrijf of Operations-docs', () => {
    const m = menuUitCookie(koek({ v: 1, ingelogd: true, type: 'medewerker' }));
    expect(m).toEqual(typelijst('medewerker'));
    expect(m.werelden.map((w) => w.id)).toEqual(['team']);
    expect(m.sites.map((s) => s.id)).toEqual(['docs', 'interne-docs', 'website']);
    expect(m.sites.map((s) => s.id)).not.toContain('operations');
  });
  it('een type dat niet bestaat valt terug op anoniem', () => {
    const m = menuUitCookie(koek({ v: 1, ingelogd: true, type: 'owner' }));
    expect(m).toEqual(typelijst('anoniem'));
    expect(m.sites.map((s) => s.id)).toEqual(['docs', 'website']);
  });
  it('ingelogd op ja zonder geldig type geeft niets extra', () => {
    expect(typeUitCookie(koek({ v: 1, ingelogd: true, type: 'finance' }))).toBe('anoniem');
  });
  it('elk type uit het cookie geeft precies typelijst(type)', () => {
    for (const t of ['anoniem', 'member', 'medewerker'] as const) {
      expect(menuUitCookie(koek({ v: 1, ingelogd: t !== 'anoniem', type: t }), 'https://hub.voorbeeld')).toEqual(typelijst(t, 'https://hub.voorbeeld'));
    }
  });
});
