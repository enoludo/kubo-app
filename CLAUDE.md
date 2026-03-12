# Kubo Pâtisserie — Planning App

## Projet
Application de gestion de planning d'équipe pour une pâtisserie artisanale.
Stack : React + Vite, pas de backend, état local (useState).

## Design
- Palette : brun chaud #18100A, or #C9A84C, crème #F7F2EC
- Fonts : Cormorant Garamond (titres) + DM Sans (corps)
- Inspiration : Skello.io, ComboHR — interface professionnelle, élégante, artisanale
- PRIORITÉ AU DESIGN : chaque composant doit être visuellement soigné

## Architecture
- /src/components/ — composants React
- /src/data/ — équipe et shifts en JSON
- /src/hooks/ — logique métier

## Règles
- Drag & drop natif HTML5
- Snapping aux demi-heures
- Calcul automatique heures travaillées vs contrat 35h
- Impression CSS via window.print()
- Ne jamais utiliser localStorage
