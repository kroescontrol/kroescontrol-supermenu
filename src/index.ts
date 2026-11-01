// @kroescontrol/supermenu: het Sites-menu als gegevens en regels, zonder UI (prd619).
// Besluit Serge 01-11-2026 12:48 CET (variant C'): de kop is overal logo / Sites ▾ / Sectie ▾.
// Dit pakket levert alleen Sites ▾: welke sites iemand ziet, welke de huidige is, en de
// terugweg naar de hub. Werelden (Team, Bedrijf) en secties zijn van de hub en staan hier niet
// meer in; die horen in het sectiemenu van de hub.

export type OrgRole = 'owner' | 'finance' | 'operations' | 'internal' | 'member' | 'contributor' | 'guest';
export type Type = 'anoniem' | 'member' | 'medewerker';

/** De ene rolhiërarchie; gelijk aan ROLE_HIERARCHY in de hub (useAuth.tsx). */
export const ROL_NIVEAU: Record<OrgRole, number> = {
  owner: 6, finance: 5, operations: 4, internal: 3, member: 2, contributor: 1, guest: 0,
};

export function heeftMinRol(rol: OrgRole | null | undefined, min: OrgRole): boolean {
  if (!rol) return false;
  return (ROL_NIVEAU[rol] ?? -1) >= ROL_NIVEAU[min];
}

/** Het adres van de hub als een site niets anders zegt. Per site instelbaar (nu vaak hub-next). */
export const HUB_BASIS = 'https://hub.kroescontrol.nl';

export interface Site {
  id: string;
  name: string;
  description: string;
  /** Naam van het icoon; de site kiest zelf de bijbehorende component. */
  icon: string;
  /** Volledig adres. Bij de hub leeg: dat vult sitesmenu() met hubBasis en de terugweg. */
  url: string;
  iconClassName: string;
  /** Vanaf welke rol de site in de lijst staat. Geen minRole: iedereen, ook anoniem. */
  minRole?: OrgRole;
}

// Volgorde = de rolvolgorde: eerst wat iedereen ziet (Hub, Docs), dan Interne docs (internal),
// Operations-docs (operations), en Website als uitgang naar buiten onderaan.
// Kleur van het icoon: Operations-docs teal (de sectiekleur van Operations), niet amber (Finance).
export const SITES: Site[] = [
  {
    id: 'hub', name: 'Hub', description: 'Jouw werkplek', icon: 'LayoutDashboard',
    url: '', iconClassName: 'bg-primary/10 text-primary',
  },
  // prd619 fase C (Serge 31-10, Telegram 2435): elke docs-site via /home, niet via /.
  {
    id: 'docs', name: 'Docs', description: 'Publieke documentatie', icon: 'BookOpen',
    url: 'https://docs.kroescontrol.nl/home', iconClassName: 'bg-blue-500/10 text-blue-500',
  },
  {
    id: 'interne-docs', name: 'Interne docs', description: 'Handboek voor medewerkers', icon: 'Bookmark',
    url: 'https://internal.docs.kroescontrol.nl/home', iconClassName: 'bg-muted text-muted-foreground',
    minRole: 'internal',
  },
  {
    id: 'operations', name: 'Operations-docs', description: 'Procedures', icon: 'FileText',
    url: 'https://operations.docs.kroescontrol.nl/home',
    iconClassName: 'bg-section-operations/10 text-section-operations', minRole: 'operations',
  },
  {
    id: 'website', name: 'Website', description: 'kroescontrol.nl', icon: 'Globe',
    url: 'https://kroescontrol.nl', iconClassName: 'bg-emerald-500/10 text-emerald-500',
  },
];

/** Waar je in de hub was: alleen een pad en een label, nooit een id, filter of naam van een persoon. */
export interface Terugweg {
  /** Pad binnen de hub, bijvoorbeeld /bedrijf/finance/debiteuren. Geen query, geen domein. */
  pad: string;
  /** Wat de lezer ziet, bijvoorbeeld "Finance · Debiteuren". */
  label: string;
}

export interface SitesInvoer {
  /** Op welke site dit menu staat (id uit SITES). Die staat altijd in de lijst, met een vinkje. */
  huidig: string;
  /** Mag deze gebruiker minstens deze rol? In de hub: hasMinRole; buiten de hub: uit het type. */
  heeftMinRol: (min: OrgRole) => boolean;
  /** Het adres van de hub, zonder slash aan het eind. Standaard HUB_BASIS. */
  hubBasis?: string;
  /** De terugweg naar de hub; alleen gebruikt buiten de hub. */
  terugweg?: Terugweg | null;
  /** Extra sites die een site toevoegt (bijvoorbeeld Maps zodra die bestaat). */
  extra?: Site[];
}

export interface SiteRegel extends Site {
  /** Dit is de site waar het menu nu op staat. */
  aan: boolean;
  /** Tweede regel bij de hub buiten de hub: "Verder in Finance · Debiteuren". */
  verder?: string;
}

export interface SitesUitvoer {
  /** Het label op de knop: de naam van de huidige site. */
  label: string;
  sites: SiteRegel[];
}

/** Welke sites in Sites ▾ staan, en welke de huidige is. */
export function sitesmenu(invoer: SitesInvoer, sites: Site[] = SITES): SitesUitvoer {
  const basis = (invoer.hubBasis ?? HUB_BASIS).replace(/\/+$/, '');
  const terug = invoer.huidig !== 'hub' && invoer.terugweg && terugwegGeldig(invoer.terugweg) ? invoer.terugweg : null;
  const alle = [...sites, ...(invoer.extra ?? [])];
  const regels: SiteRegel[] = alle
    .filter((s) => s.id === invoer.huidig || !s.minRole || invoer.heeftMinRol(s.minRole))
    .map((s) => {
      const aan = s.id === invoer.huidig;
      if (s.id !== 'hub') return { ...s, aan };
      return {
        ...s, aan,
        url: basis + (terug ? terug.pad : '/'),
        ...(terug ? { verder: `Verder in ${terug.label}` } : {}),
      };
    });
  const huidig = alle.find((s) => s.id === invoer.huidig);
  return { label: huidig?.name ?? 'Sites', sites: regels };
}

/** Het type uit het feitjes-cookie, afgeleid uit de echte rol (prd619, "De twee cookies"). */
export function typeVoorRol(rol: OrgRole | null | undefined): Type {
  if (!rol) return 'anoniem';
  if (heeftMinRol(rol, 'internal')) return 'medewerker';
  if (rol === 'member' || rol === 'contributor') return 'member';
  return 'anoniem';
}

/** Een representatieve rol per type, voor sites buiten de hub. */
const ROL_VAN_TYPE: Record<Type, OrgRole | null> = { anoniem: null, member: 'member', medewerker: 'internal' };

/**
 * De typelijst: Sites ▾ voor een site buiten de hub, alleen op basis van het type.
 * Geen recht: het type is een hint die iedereen kan vervalsen (prd619). Operations-docs staat er
 * daarom niet in voor het type medewerker; een site in de tak met de echte rol gebruikt sitesmenu().
 */
export function typelijst(type: Type, huidig: string, hubBasis?: string, terugweg?: Terugweg | null): SitesUitvoer {
  const rol = ROL_VAN_TYPE[type];
  return sitesmenu({ huidig, heeftMinRol: (min) => heeftMinRol(rol, min), hubBasis, terugweg });
}

// ---------------------------------------------------------------------------------------------
// Het feitjes-cookie (prd619, "De twee cookies"). Eén JSON-waarde in `kc_feiten` op
// .kroescontrol.nl. Elke site op dat domein kan hem schrijven, dus de lezer is streng: geldige
// JSON, v gelijk aan 1, alleen bekende waarden; anders is het cookie leeg. Het cookie is een
// hint voor het menu en nooit een recht: een vervalst type geeft hooguit links die de site bij
// openen weigert.

export const COOKIE_NAAM = 'kc_feiten';
export type Thema = 'light' | 'dark' | 'system';
export type Taal = 'nl' | 'en';
export const TYPES: readonly Type[] = ['anoniem', 'member', 'medewerker'];
const THEMAS: readonly Thema[] = ['light', 'dark', 'system'];
const TALEN: readonly Taal[] = ['nl', 'en'];

export interface Feiten {
  v: 1;
  /** Hint, geen bewijs: stuurt alleen door naar de tak, geeft niets vrij. */
  ingelogd: boolean;
  type: Type;
  thema?: Thema;
  taal?: Taal;
  /** Waar je in de hub was (C', Serge 01-11). Alleen pad en label; de lezer toetst beide. */
  terug?: Terugweg;
}

/** Het lege cookie: wat elke lezer aanneemt als er niets geldigs staat. */
export const FEITEN_LEEG: Feiten = { v: 1, ingelogd: false, type: 'anoniem' };

/** De ruwe waarde van één cookie uit een Cookie-header of document.cookie; null als hij er niet staat. */
export function cookieWaarde(cookie: string | null | undefined, naam: string = COOKIE_NAAM): string | null {
  if (!cookie) return null;
  for (const deel of cookie.split(';')) {
    const i = deel.indexOf('=');
    if (i < 0) continue;
    if (deel.slice(0, i).trim() !== naam) continue;
    const ruw = deel.slice(i + 1).trim();
    try { return decodeURIComponent(ruw); } catch { return ruw; }
  }
  return null;
}

/**
 * Leest het feitjes-cookie uit een Cookie-header (server, bijvoorbeeld Next) of document.cookie
 * (browser). Alles wat niet klopt maakt het hele cookie leeg: geen gedeeltelijk vertrouwen.
 * Onbekende velden worden genegeerd (een schrijver mag velden dragen die deze lezer niet kent).
 */
export function leesFeiten(cookie: string | null | undefined): Feiten {
  const ruw = cookieWaarde(cookie);
  if (ruw === null || ruw.length > 1024) return FEITEN_LEEG;
  let obj: unknown;
  try { obj = JSON.parse(ruw); } catch { return FEITEN_LEEG; }
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return FEITEN_LEEG;
  const o = obj as Record<string, unknown>;
  if (o.v !== 1) return FEITEN_LEEG;
  if (typeof o.ingelogd !== 'boolean') return FEITEN_LEEG;
  if (typeof o.type !== 'string' || !TYPES.includes(o.type as Type)) return FEITEN_LEEG;
  if (o.thema !== undefined && (typeof o.thema !== 'string' || !THEMAS.includes(o.thema as Thema))) return FEITEN_LEEG;
  if (o.taal !== undefined && (typeof o.taal !== 'string' || !TALEN.includes(o.taal as Taal))) return FEITEN_LEEG;
  if (o.terug !== undefined && !terugwegGeldig(o.terug)) return FEITEN_LEEG;
  const uit: Feiten = { v: 1, ingelogd: o.ingelogd, type: o.type as Type };
  if (o.terug !== undefined) { const t = o.terug as Terugweg; uit.terug = { pad: t.pad, label: t.label }; }
  if (o.thema !== undefined) uit.thema = o.thema as Thema;
  if (o.taal !== undefined) uit.taal = o.taal as Taal;
  return uit;
}

/** Het type uit het feitjes-cookie; 'anoniem' bij alles wat niet klopt. */
export function typeUitCookie(cookie: string | null | undefined): Type {
  return leesFeiten(cookie).type;
}

/**
 * Sites ▾ voor een site buiten de hub, rechtstreeks uit het cookie: altijd precies de typelijst,
 * met de terugweg als die er is en je ingelogd bent. Het cookie stuurt het menu, nooit rechten.
 */
export function sitesUitCookie(cookie: string | null | undefined, huidig: string, hubBasis?: string): SitesUitvoer {
  const f = leesFeiten(cookie);
  return typelijst(f.type, huidig, hubBasis, f.ingelogd ? f.terug : null);
}

// ---------------------------------------------------------------------------------------------
// Schrijven (de hub, en later elke site in de tak). Regel uit prd619: elke schrijver leest eerst
// en behoudt de velden die hij niet kent; Path=/ is verplicht, anders ontstaan kopieën per pad.

/** Het cookie-domein voor deze host: .kroescontrol.nl op het eigen domein, anders geen (lokaal, vercel.app). */
export function cookieDomein(hostname: string): string | undefined {
  return hostname === 'kroescontrol.nl' || hostname.endsWith('.kroescontrol.nl') ? '.kroescontrol.nl' : undefined;
}

export interface Wijziging {
  ingelogd?: boolean;
  type?: Type;
  thema?: Thema;
  taal?: Taal;
  /** null haalt de terugweg weg. */
  terug?: Terugweg | null;
}

/**
 * De nieuwe waarde van kc_feiten: het bestaande cookie (met velden die deze schrijver niet kent)
 * plus de wijziging. Is het bestaande cookie ongeldig, dan begint hij bij het lege cookie.
 * Niet ingelogd betekent altijd type anoniem en geen terugweg. Een ongeldige terugweg wordt
 * niet geschreven. Geeft null als het resultaat niet geldig of te lang zou zijn.
 */
export function feitenMet(cookie: string | null | undefined, w: Wijziging): Record<string, unknown> | null {
  const geldig = leesFeiten(cookie) !== FEITEN_LEEG;
  const uit: Record<string, unknown> = geldig ? { ...(JSON.parse(cookieWaarde(cookie)!) as object) } : { ...FEITEN_LEEG };
  for (const k of ['ingelogd', 'type', 'thema', 'taal'] as const) if (w[k] !== undefined) uit[k] = w[k];
  if (w.terug === null) delete uit.terug;
  else if (w.terug !== undefined) {
    if (terugwegGeldig(w.terug)) uit.terug = { pad: w.terug.pad, label: w.terug.label };
    else delete uit.terug;
  }
  if (uit.ingelogd !== true) { uit.ingelogd = false; uit.type = 'anoniem'; delete uit.terug; }
  const tekst = JSON.stringify(uit);
  if (encodeURIComponent(tekst).length > 1024 || leesFeiten(`${COOKIE_NAAM}=${encodeURIComponent(tekst)}`) === FEITEN_LEEG) return null;
  return uit;
}

/** De tekst voor document.cookie (of een Set-Cookie-header) met de vaste attributen uit prd619. */
export function feitenCookie(waarde: Record<string, unknown>, opties: { domein?: string; maxAge?: number } = {}): string {
  const delen = [
    `${COOKIE_NAAM}=${encodeURIComponent(JSON.stringify(waarde))}`,
    'Path=/',
    `Max-Age=${opties.maxAge ?? 60 * 60 * 24 * 365}`,
    'SameSite=Lax',
    'Secure',
  ];
  if (opties.domein) delen.push(`Domain=${opties.domein}`);
  return delen.join('; ');
}


/**
 * Is dit een terugweg die we durven tonen en volgen? Het cookie kan door elke site op het domein
 * geschreven zijn, dus streng: een pad binnen de hub (begint met één /, geen //, geen backslash,
 * geen query, geen fragment, geen procent-codering) en een kort label van gewone tekens.
 */
export function terugwegGeldig(t: unknown): t is Terugweg {
  if (typeof t !== 'object' || t === null || Array.isArray(t)) return false;
  const { pad, label } = t as Record<string, unknown>;
  if (typeof pad !== 'string' || typeof label !== 'string') return false;
  if (!/^\/(?!\/)[A-Za-z0-9\-._~/]{0,199}$/.test(pad)) return false;
  if (pad.split('/').some((d) => d === '..' || d === '.')) return false;
  return /^[\p{L}\p{N} ·&'.,()\-]{1,60}$/u.test(label) && label.trim() === label;
}
