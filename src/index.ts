// @kroescontrol/supermenu: het supermenu als gegevens en regels, zonder UI (prd619 fase B).
// Elke site tekent zijn eigen knop; dit pakket zegt welke werelden en sites erin staan.
// In de hub levert de hub zelf de werelden aan (uit zijn eigen gates); buiten de hub
// kiest het pakket op basis van het type uit het feitjes-cookie.

export type OrgRole = 'owner' | 'finance' | 'operations' | 'internal' | 'member' | 'contributor' | 'guest';
export type Wereld = 'team' | 'bedrijf';
export type Type = 'anoniem' | 'member' | 'medewerker';

/** De ene rolhiërarchie; gelijk aan ROLE_HIERARCHY in de hub (useAuth.tsx). */
export const ROL_NIVEAU: Record<OrgRole, number> = {
  owner: 6, finance: 5, operations: 4, internal: 3, member: 2, contributor: 1, guest: 0,
};

export function heeftMinRol(rol: OrgRole | null | undefined, min: OrgRole): boolean {
  if (!rol) return false;
  return (ROL_NIVEAU[rol] ?? -1) >= ROL_NIVEAU[min];
}

export interface Item {
  id: string;
  name: string;
  description: string;
  /** Naam van het icoon; de site kiest zelf de bijbehorende component. */
  icon: string;
  url: string;
  external: boolean;
  iconClassName: string;
  soort: 'wereld' | 'site';
  werelden: Wereld[];
  minRole?: OrgRole;
  naamPerRol?: Partial<Record<OrgRole, string>>;
}

export const ITEMS: Item[] = [
  {
    id: 'team', name: 'Team', description: "Home, community en collega's", icon: 'Users',
    url: '/team', external: false, iconClassName: 'bg-primary/10 text-primary',
    soort: 'wereld', werelden: ['team'], naamPerRol: { guest: 'Community' },
  },
  {
    id: 'bedrijf', name: 'Bedrijf', description: 'Finance, operations, audit en beheer', icon: 'Building2',
    url: '/bedrijf', external: false, iconClassName: 'bg-section-finance/10 text-section-finance',
    soort: 'wereld', werelden: ['bedrijf'], minRole: 'operations',
  },
  // prd619 fase C (Serge 31-10, Telegram 2435): het supermenu linkt naar /home van elke docs-site,
  // niet naar /. Op internal en operations staat /home achter de inlog.
  {
    id: 'docs', name: 'Docs', description: 'Publieke documentatie', icon: 'BookOpen',
    url: 'https://docs.kroescontrol.nl/home', external: true, iconClassName: 'bg-blue-500/10 text-blue-500',
    soort: 'site', werelden: ['team', 'bedrijf'],
  },
  {
    id: 'interne-docs', name: 'Interne docs', description: 'Handboek voor medewerkers', icon: 'Bookmark',
    url: 'https://internal.docs.kroescontrol.nl/home', external: true, iconClassName: 'bg-muted text-muted-foreground',
    soort: 'site', werelden: ['team', 'bedrijf'], minRole: 'internal',
  },
  {
    id: 'operations', name: 'Operations-docs', description: 'Interne procedures', icon: 'FileText',
    url: 'https://operations.docs.kroescontrol.nl/home', external: true, iconClassName: 'bg-amber-500/10 text-amber-500',
    soort: 'site', werelden: ['bedrijf'], minRole: 'operations',
  },
  {
    id: 'website', name: 'Website', description: 'kroescontrol.nl', icon: 'Globe',
    url: 'https://kroescontrol.nl', external: true, iconClassName: 'bg-emerald-500/10 text-emerald-500',
    soort: 'site', werelden: ['team', 'bedrijf'],
  },
];

/** De naam van een wereld of site voor deze rol. */
export function naamVoor(item: Item, rol: OrgRole | null | undefined): string {
  return (rol && item.naamPerRol?.[rol]) || item.name;
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

export interface Invoer {
  /** De actieve wereld. Buiten de hub: 'team'. */
  wereld: Wereld;
  /** De werelden die de gebruiker mag zien. In de hub uit de hub-gates. */
  werelden: Wereld[];
  /** Mag deze gebruiker minstens deze rol? In de hub: hasMinRole. */
  heeftMinRol: (min: OrgRole) => boolean;
  /** Extra items die een site toevoegt (bijvoorbeeld Maps zodra die bestaat). */
  extra?: Item[];
}

export interface Uitvoer {
  actief: Item | undefined;
  werelden: Item[];
  sites: Item[];
}

/** Welke werelden en sites in het supermenu staan. Zelfde regels als SuperAppSwitcher in de hub. */
export function supermenu(invoer: Invoer, items: Item[] = ITEMS): Uitvoer {
  const alle = [...items, ...(invoer.extra ?? [])];
  return {
    actief: alle.find((a) => a.soort === 'wereld' && a.id === invoer.wereld),
    werelden: alle.filter((a) => a.soort === 'wereld' && invoer.werelden.includes(a.id as Wereld)),
    sites: alle.filter(
      (a) => a.soort === 'site' && a.werelden.includes(invoer.wereld) && (!a.minRole || invoer.heeftMinRol(a.minRole)),
    ),
  };
}

/**
 * De typelijst: het menu voor een site buiten de hub, alleen op basis van het type.
 * Geen recht: het type is een hint die iedereen kan vervalsen (prd619).
 * Werelden zijn buiten de hub links naar de hub.
 */
export function typelijst(type: Type, hubBasis = 'https://hub.kroescontrol.nl'): Uitvoer {
  const rol = ROL_VAN_TYPE[type];
  const werelden: Wereld[] = rol && heeftMinRol(rol, 'operations') ? ['team', 'bedrijf'] : ['team'];
  const uit = supermenu({ wereld: 'team', werelden, heeftMinRol: (min) => heeftMinRol(rol, min) });
  const naarHub = (i: Item): Item => (i.external ? i : { ...i, url: hubBasis + i.url, external: true });
  return { actief: uit.actief && naarHub(uit.actief), werelden: uit.werelden.map(naarHub), sites: uit.sites };
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
  const uit: Feiten = { v: 1, ingelogd: o.ingelogd, type: o.type as Type };
  if (o.thema !== undefined) uit.thema = o.thema as Thema;
  if (o.taal !== undefined) uit.taal = o.taal as Taal;
  return uit;
}

/** Het type uit het feitjes-cookie; 'anoniem' bij alles wat niet klopt. */
export function typeUitCookie(cookie: string | null | undefined): Type {
  return leesFeiten(cookie).type;
}

/**
 * Het menu voor een site buiten de hub, rechtstreeks uit het cookie: altijd precies de typelijst.
 * Het cookie stuurt het menu, nooit rechten; uitzonderingen per echte rol bestaan alleen in de tak.
 */
export function menuUitCookie(cookie: string | null | undefined, hubBasis?: string): Uitvoer {
  return typelijst(typeUitCookie(cookie), hubBasis);
}
