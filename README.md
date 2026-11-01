# @kroescontrol/supermenu

Het Sites-menu van Kroescontrol als gegevens en regels, zonder UI en zonder React.
Bron: prd619 fase B (`airflow/projects/wp_hub/prds/prd619-…`), task900.

Sinds 0.3.0 (variant C', besluit Serge 01-11-2026 12:48 CET) is dit pakket alleen **Sites ▾**: de kop is overal
logo / Sites ▾ / Sectie ▾, en Sectie ▾ is van de hub. Werelden (Team, Bedrijf) staan hier niet meer in.

- `SITES`: Hub, Docs, Interne docs, Operations-docs, Website, in de rolvolgorde.
- `sitesmenu({ huidig, heeftMinRol, hubBasis?, terugweg? })`: de lijst voor deze gebruiker, met `label` (de
  huidige site) en per regel `aan` (vinkje). Gast en anoniem: Hub, Docs, Website; vanaf internal Interne docs;
  vanaf operations Operations-docs. De huidige site staat er altijd in.
- Item Hub: `hubBasis` (standaard `https://hub.kroescontrol.nl`) plus de terugweg; buiten de hub krijgt het een
  tweede regel `verder`, bijvoorbeeld "Verder in Finance · Debiteuren".
- `typelijst(type, huidig, hubBasis?, terugweg?)` en `sitesUitCookie(cookie, huidig, hubBasis?)`: buiten de hub, op
  basis van het type uit het feitjes-cookie. **Een hint, geen recht.**
- `leesFeiten(cookie)`, `typeUitCookie(cookie)`: het feitjes-cookie `kc_feiten` lezen. Streng: geen geldige JSON,
  `v` niet 1, een onbekende waarde of een ongeldige terugweg maakt het hele cookie leeg.
- `feitenMet(cookie, wijziging)`, `feitenCookie(waarde, { domein })`, `cookieDomein(hostname)`: schrijven. Behoudt
  velden die de schrijver niet kent; niet ingelogd is altijd anoniem zonder terugweg.
- Terugweg `terug: { pad, label }`: alleen een pad binnen de hub (geen domein, query of `//`) en een kort label.

### Van 0.2 naar 0.3

`ITEMS`, `supermenu()`, `naamVoor()`, `menuUitCookie()` en het type `Wereld` zijn weg. `typelijst()` neemt nu de
huidige site als tweede argument en geeft `{ label, sites }`. Een site die nog 0.2.0 vastpint, blijft werken.

Geschikt voor een Next-build: ESM met `exports`, `sideEffects: false`, geen React, geen router, geen hub-code.

`npm run check` = build, tests en de poort dat `dist/` niets uit React, de router of de hub importeert.

## Installeren

Publiek op GitHub, geen token nodig (besluit Serge 31-10-2026). Installeer op een vaste versie:

```bash
npm install github:kroescontrol/kroescontrol-supermenu#v0.3.0
```

`prepare` bouwt `dist/` bij het installeren. GitHub Packages is bewust niet gekozen: daar vraagt ook een publiek pakket een token.
