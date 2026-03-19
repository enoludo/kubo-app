PROJECT CONTEXT

This project is an internal business platform for a bakery / pastry shop.

The goal is to progressively build multiple connected applications that share the same data and infrastructure.

The first module currently being developed is the employee scheduling system.

Future modules will include:
- hygiene tracking
- product management
- recipe management
- product cost calculation
- order management
- supplier management

The scheduling module must be built as the first module of a modular system, not as an isolated application.


CORE ARCHITECTURE PRINCIPLES

The system must follow these architectural principles:

1. Modular architecture
Each business feature must be implemented as a module.

Example modules:
- scheduling
- hygiene
- products
- recipes
- orders

2. Shared core data
Some data entities must be shared across modules.

Example shared entities:
- team_members
- roles
- products
- ingredients
- suppliers

These must exist in one place only.

3. Central database
All modules must connect to the same database.

The database must support future modules.

4. Unique identifiers
All entities must use UUID identifiers.

5. Separation of concerns
The codebase must separate:

- data models
- business logic
- API layer
- UI components

6. Future scalability
The system should remain maintainable as more modules are added.


DEVELOPMENT PRIORITIES

The current priority is to continue developing the scheduling module.

However all design decisions must respect the modular architecture and shared data model.


INSTRUCTIONS FOR THE AI

Before implementing new features:

1. verify that the feature respects the architecture
2. avoid tightly coupling modules
3. reuse shared entities when possible
4. keep the code modular and maintainable

When making structural changes:
explain the reasoning before implementing.


PROJECT OWNER CONTEXT

The project owner is a designer, not a full-time developer.

Solutions should prioritize:
- clarity
- maintainability
- simplicity

Avoid overly complex engineering solutions.