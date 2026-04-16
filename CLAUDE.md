# Kubo Pâtisserie — App interne

## Stack
- React + Vite, CSS custom properties, Poppins
- État local (transitoire → API centralisée à venir)
- Tablette iPad en production

## Règles absolues design system
- 3 niveaux de tokens : primitifs → sémantiques → module
- Préfixes : `--color-*` / `--bg-*` / `--[module]-*`
- Zéro valeur hardcodée (hex, px) dans les composants
- Zéro logique métier dans les composants génériques
- Chaque module a ses propres tokens (`[module]-tokens.css`)
- Lire `.claude/skills/design-system.md` avant toute modif de styles

## Modules actifs
| Module        | Dossier                      |
|---------------|------------------------------|
| Planning      | `src/modules/planning/`      |
| Commandes     | `src/modules/orders/`        |
| Produits      | `src/modules/products/`      |
| Nettoyage     | `src/modules/cleaning/`      |
| Températures  | `src/modules/temperatures/`  |
| Traçabilité   | `src/modules/traceability/`  |

## Skills — quand les lire
| Skill                              | Contexte                                      |
|------------------------------------|-----------------------------------------------|
| `design-system.md`                 | Styles, tokens, composants, toute UI          |
| `ux-designer.md`                   | Nouveaux écrans, flows, interactions          |
| `frontend-engineer.md`             | Composants React                              |
| `integration-engineer.md`          | Google Sheets / Drive / Webflow               |
| `software-architect.md`            | Structure, nouveaux modules                   |
| `database-architect.md`            | Schéma de données                             |
| `backend-engineer.md`              | API, services                                 |
| `bakery-operations.md`             | Pertinence métier, logique boulangerie        |
| `devops.md`                        | CI/CD, variables d'environnement, déploiement |

Lire aussi `.claude/skills/README.md` pour les conventions générales.

## Docs de référence
| Fichier                    | Quand le lire                                 |
|----------------------------|-----------------------------------------------|
| `/docs/vision.md`          | Architecture globale, décisions structurelles |
| `/docs/master-prompt.md`   | Règles de développement générales             |
| `/docs/database.md`        | Modèle de données                             |
| `/docs/features.md`        | État des modules actifs                       |
| `/docs/orders-context.md`  | Module Commandes (obligatoire avant toute tâche commandes) |

**En cas de conflit entre une instruction et `/docs` → suivre `/docs`.**

## Intégrations actives
- **Google Auth** — `src/services/googleAuth.js` — OAuth2 GIS, scope `spreadsheets` + `drive.file` + `drive.readonly`
- **Google Sheets** — `src/services/sheetsExport.js` — export manuel depuis Supabase (miroir lecture seule)
- **Google Drive** — `src/services/googleDrive.js` — upload/liste photos étiquettes traçabilité
- **Webflow** — import commandes web via API Vercel Serverless
- **Supabase** — source de vérité unique pour toutes les données

## Données de démo
- Shifts : `src/data/demoShifts.js`
- Équipe : `src/data/team.json`
- Ne jamais mettre de données dans les hooks ou composants

## Règles tablette
- Tap target minimum : var(--control-height-md)
- Zéro interaction hover-only
- Toutes les actions fonctionnent au tap

## Règles CSS
- Toujours utiliser les tokens, jamais de valeurs brutes
- Rayon : cards `--radius-sm`, modals `--radius-md`, pills `--radius-full`
- Modifications ciblées — ne pas régénérer ce qui fonctionne
- Isoler les styles par module, pas de fuite entre modules
