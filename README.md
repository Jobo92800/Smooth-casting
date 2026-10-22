# Smooth – Casting

Appli de jury pour les auditions Smooth by No-One : planning, fiches d'évaluation et questions du casting.
Les données sont dans Airtable (base « Smooth - Casting », table « Candidats »).

## Fonctionnement
- `index.html` : l'appli (aucune donnée de candidat dans le code).
- `netlify/functions/casting.mjs` : relais vers Airtable, la clé reste côté serveur.

## Variables d'environnement Netlify
| Variable | Valeur |
|---|---|
| `AIRTABLE_TOKEN` | clé Airtable « pat… » (scopes `data.records:read` + `data.records:write`, base Smooth - Casting uniquement) |
| `AIRTABLE_BASE_ID` | `appFTfbVYQyiN9G2g` |
| `APP_PASSWORD` | mot de passe demandé une fois par appareil (conseillé) |

Après avoir ajouté ou changé une variable : Deploys → Trigger deploy.
