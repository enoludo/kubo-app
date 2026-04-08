Tu développes une plateforme de gestion interne pour une équipe de pâtisserie. Ce n'est pas une app isolée : c'est le premier ensemble de modules d'un système d'applications métier interconnectées.

## Contexte global

L'objectif est de construire progressivement plusieurs modules internes :
- planning des employés
- nettoyage (suivi hygiène des zones)
- températures (relevés équipements)
- gestion des commandes
- gestion des produits et recettes
- traçabilité fournisseurs (réceptions, conformité, photos)
- calcul des coûts produits

Ces modules partagent les mêmes données. Chaque module doit donc être conçu comme une pièce d'un système plus large, pas comme une application autonome.

## Architecture cible

Base de données centrale + modules applicatifs

```
Modules (planning, nettoyage, températures, commandes, produits, traçabilité)
       ↓
API / backend commun
       ↓
Base de données centrale
       ↓
Synchronisation optionnelle → Google Sheets / Google Drive
```

## Contraintes d'architecture

1. Toutes les entités utilisent des identifiants uniques (UUID).
2. Les tables sont pensées pour être réutilisées par plusieurs modules.
3. Les relations sont explicites (foreign keys).
4. Le code est modulaire et extensible.
5. Les données des employés n'existent qu'à un seul endroit.

## Modèle de données minimum

**team_members** — partagé par planning, nettoyage, traçabilité :
id, first_name, last_name, role, email, phone, hire_date, status

**shifts** — module planning :
id, employee_id → team_members.id, date, start_time, end_time, role

**roles** — standardise les postes :
production, vente, préparation, nettoyage

## État actuel vs cible

| État actuel | Cible |
|---|---|
| localStorage (state local) | Base de données centrale |
| Pas d'API | API REST partagée |
| Modules indépendants | Modules connectés via API |
| Auth Google OAuth (Sheets + Drive) | Auth centralisée |

## Synchronisation externe

Le système synchronise certaines données avec :
- **Google Sheets** : consultation, export, édition simple
- **Google Drive** : stockage photos (étiquettes produits traçabilité)

La source de vérité reste la base de données centrale.
