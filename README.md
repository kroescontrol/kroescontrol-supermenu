# @kroescontrol/supermenu

Het supermenu van Kroescontrol als gegevens en regels, zonder UI en zonder React.
Bron: prd619 fase B (`airflow/projects/wp_hub/prds/prd619-…`), task900.

- `ITEMS`: de werelden (Team, Bedrijf) en sites (Docs, Interne docs, Operations-docs, Website).
- `supermenu(invoer)`: welke werelden en sites iemand ziet; in de hub levert de hub de werelden en `heeftMinRol` aan.
- `typelijst(type)`: het menu buiten de hub, op basis van het type uit het feitjes-cookie. **Een hint, geen recht.**
- `typeVoorRol(rol)`: van echte rol naar type.
- `leesFeiten(cookie)`, `typeUitCookie(cookie)`, `menuUitCookie(cookie)`: het feitjes-cookie `kc_feiten` lezen uit een
  `Cookie`-header (Next, server) of `document.cookie` (browser). Streng: geen geldige JSON, `v` niet 1 of een onbekende
  waarde maakt het hele cookie leeg (`anoniem`, niet ingelogd). Het cookie stuurt alleen het menu, nooit rechten (prd619 fase C2).

Geschikt voor een Next-build: ESM met `exports`, `sideEffects: false`, geen React, geen router, geen hub-code.

`npm run check` = build, tests en de poort dat `dist/` niets uit React, de router of de hub importeert.

## Installeren

Publiek op GitHub, geen token nodig (besluit Serge 31-10-2026). Installeer op een vaste versie:

```bash
npm install github:kroescontrol/kroescontrol-supermenu#v0.2.0
```

`prepare` bouwt `dist/` bij het installeren. GitHub Packages is bewust niet gekozen: daar vraagt ook een publiek pakket een token.
