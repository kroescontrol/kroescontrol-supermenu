# @kroescontrol/supermenu

Het Sites-menu van Kroescontrol als gegevens en regels, zonder UI en zonder React.
Bron: prd619 fase B (`airflow/projects/wp_hub/prds/prd619-…`), task900.

Sinds 0.3.0 (variant C', besluit Serge 01-11-2026 12:48 CET) is dit pakket alleen **Sites ▾**: de kop is overal
logo / Sites ▾ / Sectie ▾, en Sectie ▾ is van de hub. Werelden staan hier niet meer in.

Sinds 0.4.0 (besluit Serge 01-11-2026 14:41 CET) is **Bedrijf een eigen site**, op `<hubBasis>/bedrijf` in dezelfde
app en met dezelfde inlog. Hub en Bedrijf zijn samen de hub-app (`HUB_SITES`); de rest is extern.

- `SITES`: Hub, Bedrijf, Docs, Interne docs, Operations-docs, Website.
- Bedrijf (`bedrijf`, "Finance, operations en beheer") vanaf **operations**. Afgeleid uit de hub-config: alleen
  operations, finance en owner hebben een sectie in Bedrijf (Overzicht en Operations vanaf operations, Finance en
  Audit vanaf finance, Beheer de owner). In de typelijst (buiten de hub, type medewerker) staat Bedrijf dus niet.
- `hubSiteVoorPad(pad)`: `'bedrijf'` voor `/bedrijf` en alles daaronder, anders `'hub'`. De hub gebruikt dat als `huidig`.
- `sitesmenu({ huidig, heeftMinRol, hubBasis?, terugweg? })`: de lijst voor deze gebruiker, met `label` (de
  huidige site) en per regel `aan` (vinkje). Gast en anoniem: Hub, Docs, Website; vanaf internal Interne docs;
  vanaf operations Bedrijf en Operations-docs. De huidige site staat er altijd in.
- Items Hub en Bedrijf: `hubBasis` (standaard `https://hub.kroescontrol.nl`) plus `/` of `/bedrijf`. Buiten de
  hub-app krijgt één van beide de terugweg als link en als tweede regel `verder` ("Verder in Finance · Debiteuren"):
  Bedrijf als het pad onder `/bedrijf` ligt en Bedrijf in de lijst staat, anders Hub. Op Hub en Bedrijf zelf geen terugweg.
- `typelijst(type, huidig, hubBasis?, terugweg?)` en `sitesUitCookie(cookie, huidig, hubBasis?)`: buiten de hub, op
  basis van het type uit het feitjes-cookie. **Een hint, geen recht.**
- `leesFeiten(cookie)`, `typeUitCookie(cookie)`: het feitjes-cookie `kc_feiten` lezen. Streng: geen geldige JSON,
  `v` niet 1, een onbekende waarde of een ongeldige terugweg maakt het hele cookie leeg.
- `feitenMet(cookie, wijziging)`, `feitenCookie(waarde, { domein })`, `cookieDomein(hostname)`: schrijven. Behoudt
  velden die de schrijver niet kent; niet ingelogd is altijd anoniem zonder terugweg.
- Terugweg `terug: { pad, label }`: alleen een pad binnen de hub (geen domein, query of `//`) en een kort label.

### Van 0.3 naar 0.4

Nieuw: site `bedrijf`, `HUB_SITES`, `BEDRIJF_PAD`, `hubSiteVoorPad()`. Let op voor wie `sites[0]` als Hub las: dat
klopt nog, maar de terugweg onder `/bedrijf` staat nu bij Bedrijf (index 1) als die in de lijst staat. Zoek op `id`.
Wie `SITES` filtert als "externe sites": met `id !== 'hub'` blijft Bedrijf staan (met lege `url`), dus filter op
`!HUB_SITES.includes(id)`.

### Van 0.2 naar 0.3

`ITEMS`, `supermenu()`, `naamVoor()`, `menuUitCookie()` en de types `Wereld`, `Item`, `Invoer` en `Uitvoer` zijn weg.
Vervangers: `SITES` (type `Site`, zonder `external`, `soort` en `werelden`: elke site behalve de huidige is extern),
`sitesmenu()` met `SitesInvoer`/`SitesUitvoer`/`SiteRegel`, en `sitesUitCookie()`. `typelijst()` neemt nu de
huidige site als tweede argument en geeft `{ label, sites }`. Een site die nog 0.2.0 vastpint, blijft werken.

Geschikt voor een Next-build: ESM met `exports`, `sideEffects: false`, geen React, geen router, geen hub-code.

`npm run check` = build, tests en de poort dat `dist/` niets uit React, de router of de hub importeert.

## Installeren

Publiek op GitHub, geen token nodig (besluit Serge 31-10-2026). Installeer op een vaste versie:

```bash
npm install github:kroescontrol/kroescontrol-supermenu#v0.4.0
```

`prepare` bouwt `dist/` bij het installeren. GitHub Packages is bewust niet gekozen: daar vraagt ook een publiek pakket een token.
