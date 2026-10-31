# @kroescontrol/supermenu

Het supermenu van Kroescontrol als gegevens en regels, zonder UI en zonder React.
Bron: prd619 fase B (`airflow/projects/wp_hub/prds/prd619-…`), task900.

- `ITEMS`: de werelden (Team, Bedrijf) en sites (Docs, Interne docs, Operations-docs, Website).
- `supermenu(invoer)`: welke werelden en sites iemand ziet; in de hub levert de hub de werelden en `heeftMinRol` aan.
- `typelijst(type)`: het menu buiten de hub, op basis van het type uit het feitjes-cookie. **Een hint, geen recht.**
- `typeVoorRol(rol)`: van echte rol naar type.

`npm run check` = build, tests en de poort dat `dist/` niets uit React, de router of de hub importeert.
