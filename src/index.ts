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
    id: 'bedrijf', name: 'Bedrijf', description: 'Finance, operations en beheer', icon: 'Building2',
    url: '/bedrijf', external: false, iconClassName: 'bg-section-finance/10 text-section-finance',
    soort: 'wereld', werelden: ['bedrijf'], minRole: 'operations',
  },
  {
    id: 'docs', name: 'Docs', description: 'Publieke documentatie', icon: 'BookOpen',
    url: 'https://docs.kroescontrol.nl/home', external: true, iconClassName: 'bg-blue-500/10 text-blue-500',
    soort: 'site', werelden: ['team', 'bedrijf'],
  },
  {
    id: 'interne-docs', name: 'Interne docs', description: 'Handboek voor medewerkers', icon: 'Bookmark',
    url: 'https://internal.docs.kroescontrol.nl', external: true, iconClassName: 'bg-muted text-muted-foreground',
    soort: 'site', werelden: ['team', 'bedrijf'], minRole: 'internal',
  },
  {
    id: 'operations', name: 'Operations-docs', description: 'Interne procedures', icon: 'FileText',
    url: 'https://operations.docs.kroescontrol.nl', external: true, iconClassName: 'bg-amber-500/10 text-amber-500',
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
