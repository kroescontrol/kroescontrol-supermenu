// prd619 fase C2: het type komt uit het feitjes-cookie en stuurt alleen het menu, nooit rechten.
import { describe, expect, it } from 'vitest';
import { cookieWaarde, cookieDomein, feitenCookie, feitenMet, leesFeiten, sitesUitCookie, typeUitCookie, typelijst, FEITEN_LEEG } from '../src/index';

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
  it('medewerker als type: wel Interne docs, nooit Operations-docs', () => {
    const m = sitesUitCookie(koek({ v: 1, ingelogd: true, type: 'medewerker' }), 'docs');
    expect(m).toEqual(typelijst('medewerker', 'docs'));
    expect(m.sites.map((s) => s.id)).toEqual(['hub', 'docs', 'interne-docs', 'website']);
  });
  it('een type dat niet bestaat valt terug op anoniem', () => {
    const m = sitesUitCookie(koek({ v: 1, ingelogd: true, type: 'owner' }), 'docs');
    expect(m).toEqual(typelijst('anoniem', 'docs'));
    expect(m.sites.map((s) => s.id)).toEqual(['hub', 'docs', 'website']);
  });
  it('ingelogd op ja zonder geldig type geeft niets extra', () => {
    expect(typeUitCookie(koek({ v: 1, ingelogd: true, type: 'finance' }))).toBe('anoniem');
  });
  it('elk type uit het cookie geeft precies typelijst(type)', () => {
    for (const t of ['anoniem', 'member', 'medewerker'] as const) {
      expect(sitesUitCookie(koek({ v: 1, ingelogd: t !== 'anoniem', type: t }), 'website', 'https://hub.voorbeeld')).toEqual(typelijst(t, 'website', 'https://hub.voorbeeld'));
    }
  });
});

describe('terugweg in het cookie (C\', Serge 01-11)', () => {
  const t = { pad: '/bedrijf/finance/debiteuren', label: 'Finance · Debiteuren' };
  it('geldige terugweg wordt gelezen', () => {
    expect(leesFeiten(koek({ v: 1, ingelogd: true, type: 'medewerker', terug: t })).terug).toEqual(t);
  });
  for (const [naam, terug] of [
    ['extern adres', { pad: '//evil.example/x', label: 'X' }],
    ['volledige url', { pad: 'https://evil.example', label: 'X' }],
    ['query', { pad: '/a?token=1', label: 'X' }],
    ['html in label', { pad: '/a', label: '<b>x</b>' }],
    ['te lang label', { pad: '/a', label: 'x'.repeat(61) }],
    ['geen object', '/a'],
  ] as [string, unknown][]) {
    it(`ongeldige terugweg (${naam}) maakt het cookie leeg`, () => {
      expect(leesFeiten(koek({ v: 1, ingelogd: true, type: 'medewerker', terug }))).toEqual(FEITEN_LEEG);
    });
  }
  it('sitesUitCookie toont de terugweg alleen als je ingelogd bent', () => {
    const aan = sitesUitCookie(koek({ v: 1, ingelogd: true, type: 'medewerker', terug: t }), 'docs', 'https://hub-next.kroescontrol.nl');
    expect(aan.sites[0]).toMatchObject({ id: 'hub', url: 'https://hub-next.kroescontrol.nl/bedrijf/finance/debiteuren', verder: 'Verder in Finance · Debiteuren' });
    const uit = sitesUitCookie(koek({ v: 1, ingelogd: false, type: 'anoniem', terug: t }), 'docs');
    expect(uit.sites[0].verder).toBeUndefined();
  });
});

describe('schrijven: feitenMet en feitenCookie', () => {
  const t = { pad: '/bedrijf/finance', label: 'Finance' };
  it('behoudt velden die de schrijver niet kent, en thema', () => {
    const w = feitenMet(koek({ v: 1, ingelogd: true, type: 'member', thema: 'dark', later: 'x' }), { ingelogd: true, type: 'medewerker', terug: t });
    expect(w).toEqual({ v: 1, ingelogd: true, type: 'medewerker', thema: 'dark', later: 'x', terug: t });
  });
  it('ongeldig bestaand cookie: begint bij leeg', () => {
    expect(feitenMet('kc_feiten=rommel', { ingelogd: true, type: 'member' })).toEqual({ v: 1, ingelogd: true, type: 'member' });
  });
  it('een bestaande terugweg wordt teruggebracht tot pad en label', () => {
    expect(feitenMet(koek({ v: 1, ingelogd: true, type: 'member', terug: { ...t, href: 'x' } }), {})).toEqual({ v: 1, ingelogd: true, type: 'member', terug: t });
  });
  it('het lege cookie is bevroren en elke lege lezing is een eigen kopie', () => {
    const a = leesFeiten(null); a.type = 'medewerker';
    expect(leesFeiten(null).type).toBe('anoniem');
    expect(Object.isFrozen(FEITEN_LEEG)).toBe(true);
  });
  it('niet ingelogd: altijd anoniem en geen terugweg', () => {
    expect(feitenMet(koek({ v: 1, ingelogd: true, type: 'medewerker', terug: t }), { ingelogd: false })).toEqual({ v: 1, ingelogd: false, type: 'anoniem' });
  });
  it('een ongeldige terugweg wordt niet geschreven en laat de oude staan; null haalt hem weg', () => {
    expect(feitenMet(null, { ingelogd: true, type: 'member', terug: { pad: '//x', label: 'X' } })).toEqual({ v: 1, ingelogd: true, type: 'member' });
    expect(feitenMet(koek({ v: 1, ingelogd: true, type: 'member', terug: t }), { terug: { pad: '//x', label: 'X' } })).toEqual({ v: 1, ingelogd: true, type: 'member', terug: t });
    expect(feitenMet(koek({ v: 1, ingelogd: true, type: 'member', terug: t }), { terug: null })).toEqual({ v: 1, ingelogd: true, type: 'member' });
  });
  it('dezelfde lengtemaat als de lezer: een geldig cookie met lange onbekende velden blijft schrijfbaar', () => {
    const c = koek({ v: 1, ingelogd: true, type: 'member', later: 'é'.repeat(180) });
    expect(leesFeiten(c).type).toBe('member');
    expect(feitenMet(c, {})).not.toBeNull();
  });
  it('wat feitenMet schrijft, leest leesFeiten terug', () => {
    const w = feitenMet(null, { ingelogd: true, type: 'medewerker', thema: 'light', terug: t })!;
    const tekst = feitenCookie(w, { domein: '.kroescontrol.nl' });
    expect(tekst).toMatch(/^kc_feiten=[^;]+; Path=\/; Max-Age=\d+; SameSite=Lax; Secure; Domain=\.kroescontrol\.nl$/);
    expect(leesFeiten(tekst.split(';')[0])).toEqual({ v: 1, ingelogd: true, type: 'medewerker', thema: 'light', terug: t });
  });
  it('cookieDomein alleen op het eigen domein', () => {
    expect(cookieDomein('hub-next.kroescontrol.nl')).toBe('.kroescontrol.nl');
    expect(cookieDomein('kroescontrol.nl')).toBe('.kroescontrol.nl');
    expect(cookieDomein('localhost')).toBeUndefined();
    expect(cookieDomein('x.vercel.app')).toBeUndefined();
    expect(cookieDomein('evilkroescontrol.nl')).toBeUndefined();
  });
});
