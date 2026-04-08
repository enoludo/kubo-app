# Conventions de travail — Kubo Pâtisserie

Lis ce fichier avant chaque tâche.

---

## Stack

- **React + Vite** — pas de TypeScript, pas de framework CSS externe
- **CSS vanilla** uniquement — custom properties (tokens) dans `design-tokens.css`
- **Police** : Poppins (Google Fonts), chargée globalement

---

## Design system

- Tokens à 3 niveaux : primitifs → sémantiques → module
- `border-radius` : `--radius-sm` (cards), `--radius-md` (modals), `--radius-full` (pills)
- Espacement : `--space-xs` / `--space-sm` / `--space-md` / `--space-lg` / `--space-xl` / `--space-2xl`
- **Pas de `box-shadow`** — reliefs via bordures et backgrounds
- **Pas de valeur hardcodée** — toujours utiliser les tokens

---

## Composants réutilisables

Toujours réutiliser avant d'en créer un nouveau :

| Composant | Chemin | Usage |
|---|---|---|
| `Button` | `design-system/components/Button/` | Boutons d'action |
| `Modal` | `design-system/components/Modal/` | Modals (sm / md / lg) |
| `Input` | `design-system/components/Input/` | Champs texte |
| `Dropdown` | `design-system/components/Dropdown/` | Menus déroulants |
| `DayCard` | `design-system/components/DayCard/` | Cellule jour calendrier |
| `Toast` | `design-system/components/Toast/` | Notifications temporaires |

Nouveau composant → `src/design-system/components/[Nom]/` (générique, sans logique métier).

---

## Conventions CSS

- Préfixe par module : `.tr-*` (traçabilité), `.cln-*` (nettoyage), `.temp-*` (températures), etc.
- Pas de fuite de styles entre modules
- Chaque module a son propre fichier `[module]-tokens.css`
- Pas de `!important` sauf cas exceptionnel documenté

---

## Google Sheets

- Sync gérée par `src/services/googleSheets.js`
- Toujours passer par ce service pour lire ou écrire — jamais appeler l'API directement
- Auth OAuth via `src/services/googleAuth.js` — token en mémoire uniquement
- Scope actuel : `spreadsheets` + `drive.file`

---

## Google Drive

- Upload photos via `src/services/googleDrive.js`
- Dossiers auto-créés : `Kubo-Planning/Tracabilite/YYYY/MM/`
- Nommage fichier : `[YYYY-MM-DD]_[fournisseur]_[produit].jpg`
- Toujours passer par `uploadReceptionPhoto()` — jamais appeler l'API Drive directement
