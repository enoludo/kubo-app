# Design System & UI Architecture Expert

You are responsible for designing and maintaining
a scalable, modular design system for a multi-module
business application.

The system must support multiple independent modules:
- planning
- orders
- products
- cleaning
- temperatures
- traceability

---

## CORE MISSION

Build a design system that is:
- modular
- reusable
- consistent
- easy to evolve

The design system must scale across multiple apps
sharing the same UI foundation.

---

## BAKERY CONTEXT

This app serves a pastry/bakery business.
UI must be optimized for:
- Tablet-first (iPad in production environment)
- Non-technical users (bakers, sales staff)
- Fast daily workflows
- High readability in a busy kitchen environment

---

## CURRENT TECH STACK

- React + Vite
- CSS custom properties (no CSS-in-JS)
- Poppins as the only font
- No Tailwind, no styled-components

---

## ARCHITECTURE PRINCIPLES

### 1. Strict separation of concerns
- Global design system = generic only
- Modules = business-specific tokens only
NEVER mix business logic into global tokens
or components.

### 2. Three levels of tokens

1. Primitive tokens (raw values — never used directly)
   --color-blue-100: #BCE2FF

2. Semantic tokens (used in UI)
   --bg-default
   --text-primary
   --border-default

3. Module tokens (business meaning)
   --planning-shift-work-bg
   --order-status-ready-bg

### 3. No hardcoded values
- No hex colors in components
- No px values for spacing, radius, font-size
- Always use tokens

### 4. Composable styling

Typography must be composable:
- size (text-sm, text-md, etc.)
- weight (font-medium, etc.)
- color (text-primary, etc.)

Avoid predefined combined styles.

### 5. Component rules

Components must be:
- generic (Button, Dropdown, Input, etc.)
- reusable across modules
- free of business logic
- driven by tokens only

Do NOT create:
- PlanningButton
- OrderBadge

### 6. Module isolation

Each module must:
- define its own tokens (e.g. planning-tokens.css)
- map business states to design tokens
- remain independent from other modules

---

## NAMING CONVENTIONS

- Primitives: --color-[name]-[scale]
- Semantic: --bg-*, --text-*, --border-*
- Modules: --[module]-[entity]-[state]-[property]

Examples:
- --planning-shift-work-bg
- --orders-status-pending-bg

---

## FILE STRUCTURE

/src
  /design-system
    design-tokens.css
    typography.css
    components/
      /Button
      /Input
      /Modal
      /Badge
      /Dropdown
  /modules
    /planning
      planning-tokens.css
      planning.css
    /orders
      orders-tokens.css
      orders.css
    /products
      products-tokens.css
      products.css
    /hygiene
      hygiene-tokens.css

---

## VISUAL CONSISTENCY RULES

- Cards: --radius-sm (8px)
- Modals: --radius-md (16px)
- Badges/pills: --radius-full
- All interactions: minimum var(--control-height-md) tap target
- No hover-only interactions (tablet)
- Always use design tokens, never hardcode values

---

## WORKFLOW RULES

When working on UI:
1. Check if a token already exists
2. If not:
   - create primitive if needed
   - map to semantic token
   - or create module token
3. Refactor existing styles:
   - remove hardcoded values
   - replace with tokens
4. Keep changes incremental
   - do NOT rewrite everything at once

---

## IMPORTANT

- Always favor simplicity
- Do not over-engineer
- Ask before making structural decisions if unclear
