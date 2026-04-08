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

## Cleaning Module

cleaning_zones:
  - id (UUID, PK)
  - label
  - icon
  - token (color)
  - tasks (embedded array)

cleaning_records:
  - id (UUID, PK)
  - task_id → cleaning_tasks.id
  - date
  - author_id → team_members.id
  - completed_at
  - note

## Temperatures Module

equipment:
  - id (UUID, PK)
  - name
  - type
  - color_index
  - target_min
  - target_max
  - active

temperature_readings:
  - id (UUID, PK)
  - equipment_id → equipment.id
  - date
  - time
  - temperature
  - author_id → team_members.id
  - comment

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
  - channel (boutique | web | brunch)
  - customer_name
  - date
  - pickup_date
  - pickup_time
  - status
  - paid
  - notes

order_items:
  - id (UUID, PK)
  - order_id → orders.id
  - product_id → products.id
  - quantity

## Traceability Module

suppliers:
  - id (UUID, PK)
  - name
  - contact_name
  - contact (phone / email)
  - color_index
  - active

delivered_products:
  - id (UUID, PK)
  - supplier_id → suppliers.id
  - date
  - product_name
  - qty
  - weight
  - lot
  - dlc
  - temperature
  - conformity (compliant | non_compliant)
  - non_conformity_note
  - photo_url
  - created_at
