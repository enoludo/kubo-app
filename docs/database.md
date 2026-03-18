# Database Schema

## Shared Core Tables

team_members:
  - id (UUID, PK)
  - first_name
  - last_name
  - role
  - email
  - phone
  - hire_date
  - status

roles:
  - id (UUID, PK)
  - name (e.g., production, sales, preparation, cleaning)
  - description

## Scheduling Module

shifts:
  - id (UUID, PK)
  - employee_id → team_members.id
  - date
  - start_time
  - end_time
  - role
  - notes
  - created_at
  - updated_at

## Hygiene Module

hygiene_checks:
  - id (UUID, PK)
  - employee_id → team_members.id
  - date
  - type_check
  - result
  - notes

cleaning_tasks:
  - id (UUID, PK)
  - description
  - assigned_to → team_members.id
  - frequency
  - completed_at

## Products Module

products:
  - id (UUID, PK)
  - name
  - cost
  - unit
  - category

ingredients:
  - id (UUID, PK)
  - name
  - unit
  - cost

recipes:
  - id (UUID, PK)
  - product_id → products.id
  - ingredient_id → ingredients.id
  - quantity

## Orders Module

orders:
  - id (UUID, PK)
  - customer_name
  - date
  - status

order_items:
  - id (UUID, PK)
  - order_id → orders.id
  - product_id → products.id
  - quantity

## Suppliers Module

suppliers:
  - id (UUID, PK)
  - name
  - contact_info
  - products_supplied