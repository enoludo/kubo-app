# Kubo Pâtisserie — Internal Platform

## Skills disponibles dans .claude/skills/

Consulte le skill approprié avant chaque tâche :
- Design UI/UX → `.claude/skills/ux-designer.md`
- Design System → `.claude/skills/design-system.md`
  À lire OBLIGATOIREMENT avant toute modification
  de styles, tokens, composants ou création de UI
- Composants React → `.claude/skills/frontend-engineer.md`
- Intégration Google Sheets → `.claude/skills/integration-engineer.md`
- Architecture → `.claude/skills/software-architect.md`
- Base de données → `.claude/skills/database-architect.md`
- Backend/API → `.claude/skills/backend-engineer.md`
- DevOps → `.claude/skills/devops.md`
- Pertinence métier → `.claude/skills/bakery-operations.md`

Lis le ou les skills pertinents avant chaque nouvelle tâche.
Lis aussi `.claude/skills/README.md` pour les conventions générales du projet.

---

## Project Overview

This project is an internal business platform for a bakery.

The current focus is the scheduling module, but it is NOT a standalone app.

The system will progressively include:
- scheduling
- hygiene tracking
- orders management
- products & recipes
- cost calculation
- suppliers

All modules must share the same data and architecture.

---

## Source of Truth

All architecture and rules are defined in:

- /docs/vision.md
- /docs/master-prompt.md
- /docs/database.md
- /docs/features.md

### Documentation obligatoire à lire

Avant toute tâche sur un module spécifique, lire le fichier de contexte correspondant :

- **Module Commandes** → `/docs/orders-context.md`
  (canaux, règles métier, schéma de données, intégration Webflow, formulaires)

You must always follow these documents.

If any instruction conflicts with them:
→ follow /docs

---

## Architecture Principles

- Modular system (not standalone apps)
- Shared database (single source of truth)
- Reusable entities (team_members, roles, etc.)
- No data duplication
- Clear separation:
  - data models
  - business logic
  - API
  - UI

---

## Current Tech Context

The current implementation uses:
- React + Vite
- local state (temporary)

However:
⚠️ This is transitional

The architecture must evolve toward:
- shared backend / API
- centralized data
- scalable structure

Do NOT lock the system into frontend-only logic.

---

## UI / Design

- Clean, professional, artisan aesthetic
- Inspired by tools like Skello / ComboHR
- Prioritize clarity and speed of use
- Optimize for non-technical users (bakery staff)

Design is important, but must not break architecture.

---

## Development Rules

- Keep components modular and reusable
- Avoid tight coupling
- Always think about future modules
- Prefer simple and maintainable solutions
- Validate architecture before implementing

---

## Demo Data

Données de démonstration — modifier uniquement ici :
- Shifts : `src/data/demoShifts.js` (tableau + UUIDs fixes des employés)
- Équipe : `src/data/team.json`

Ne pas mettre de données dans les hooks ou composants.

---

## Usage tactile

L'app est utilisée principalement sur tablette.
Aucune fonctionnalité ne doit dépendre du hover.
Toutes les interactions doivent fonctionner au tap.

---

## Current Priority

Focus on improving the scheduling module,
while ensuring it fits into the global system.

If unsure, ask before implementing.
