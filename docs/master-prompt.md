PROJECT CONTEXT

This project is an internal business platform for a bakery / pastry shop.

The goal is to progressively build multiple connected modules that share the same data and infrastructure.

Active modules:
- planning (employee scheduling)
- cleaning (zone hygiene tracking)
- temperatures (equipment temperature logs)
- orders (boutique, web, brunch)
- products (catalog + recipes)
- traceability (supplier deliveries, conformity, photos)

All modules share the same design system and will eventually connect to a central backend.


CORE ARCHITECTURE PRINCIPLES

1. Modular architecture
Each business feature is implemented as an independent module under src/modules/.

2. Shared core data
Entities shared across modules (team_members, roles, products, suppliers)
must exist in one place only.

3. Central database (target)
All modules will connect to the same database.
Current state: local state (localStorage) — transitioning to API.

4. Unique identifiers
All entities use UUID identifiers.

5. Separation of concerns
- data models
- business logic
- API layer
- UI components

6. Future scalability
The system must remain maintainable as more modules are added.


DEVELOPMENT PRIORITIES

Priority: traceability module, then stabilize existing modules.

All design decisions must respect the modular architecture and shared data model.


INSTRUCTIONS FOR THE AI

Before implementing new features:
1. Verify the feature respects the architecture
2. Avoid tightly coupling modules
3. Reuse shared entities when possible
4. Keep code modular and maintainable

When making structural changes: explain the reasoning before implementing.


PROJECT OWNER CONTEXT

The project owner is a designer, not a full-time developer.

Solutions should prioritize:
- clarity
- maintainability
- simplicity

Avoid overly complex engineering solutions.
