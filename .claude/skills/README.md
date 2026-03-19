# Conventions de travail — Kubo Pâtisserie

Lis ce fichier avant chaque tâche.

---

## Stack

- **React + Vite** — pas de TypeScript, pas de framework CSS externe
- **CSS vanilla** uniquement — variables globales dans `index.css`
- **Police** : Poppins (Google Fonts), chargée globalement

---

## Design

- `border-radius` : **8px** pour les cards, **16px** pour les modals
- **Palette pastels** définie dans `index.css` via variables CSS (`--accent`, `--bg`, `--bg-2`, etc.)
- **Pas de `box-shadow`** — les reliefs se font par bordures et backgrounds
- Bordures discrètes au hover uniquement (`border-color` transition)
- Typo responsive via `clamp()` quand pertinent

---

## Composants réutilisables

Toujours réutiliser avant d'en créer un nouveau :

| Composant | Usage |
|---|---|
| `ShiftModal` | Création / édition d'un shift |
| `EmployeeCard` | Carte employé dans la sidebar |
| `DayCard` | Colonne jour dans la vue calendrier |
| `Toast` | Notifications temporaires (3s) |

Si un nouveau composant est nécessaire, le placer dans `src/components/`
et le garder découplé (props explicites, pas de state global).

---

## Google Sheets

- Sync bidirectionnelle gérée par `src/services/googleSheets.js`
- Toujours passer par ce service pour **lire ou écrire** des données Sheets
- Ne jamais appeler l'API Sheets directement depuis un composant
- Auth OAuth via `src/services/googleAuth.js` — token en mémoire uniquement

---

## Conventions CSS

- Espacement horizontal : variable `--pad-h`
- Espacement entre éléments : variable `--gap`
- Ne pas hardcoder des valeurs d'espacement — utiliser les variables
- Nommage BEM-like : `.block`, `.block-element`, `.block--modifier`
- Pas de `!important`
