# Database Schema

Source de vérité : Supabase. Colonnes inférées des services (`*Service.js`).
Nommage : snake_case en base, camelCase en frontend (conversion dans chaque service).

---

## Auth

### profiles
| Colonne | Type    | Notes                        |
|---------|---------|------------------------------|
| id      | UUID PK | = Supabase auth user id      |
| role    | text    | `'team'` \| `'manager'`      |
| name    | text    |                              |

---

## Planning Module

### employees
| Colonne       | Type    | Notes                     |
|---------------|---------|---------------------------|
| id            | UUID PK |                           |
| name          | text    |                           |
| role          | text    |                           |
| email         | text    |                           |
| phone         | text    |                           |
| color         | text    |                           |
| initials      | text    |                           |
| contract      | int     | heures/semaine, défaut 35 |
| start_balance | float   | compteur heures initial   |
| archived      | bool    |                           |

### shifts
| Colonne                 | Type    | Notes                        |
|-------------------------|---------|------------------------------|
| id                      | UUID PK |                              |
| employee_id             | UUID FK | → employees.id               |
| date                    | date    |                              |
| type                    | text    | `'work'` \| `'absence'` etc. |
| start_hour              | text    |                              |
| end_hour                | text    |                              |
| pause                   | int     | minutes                      |
| validated               | bool    |                              |
| school_absence          | bool    |                              |
| school_absence_duration | text    | nullable                     |
| created_at              | timestamp |                            |
| updated_at              | timestamp |                            |

---

## Cleaning Module

### cleaning_zones
| Colonne    | Type      | Notes |
|------------|-----------|-------|
| id         | UUID PK   |       |
| name       | text      |       |
| color      | text      |       |
| created_at | timestamp |       |

### cleaning_tasks
| Colonne      | Type      | Notes                              |
|--------------|-----------|------------------------------------|
| id           | UUID PK   |                                    |
| name         | text      |                                    |
| zone_id      | UUID FK   | → cleaning_zones.id                |
| frequency    | text      | `'daily'` \| `'weekly'` etc.       |
| day_of_week  | int       | nullable (0=lun … 6=dim)           |
| protocol     | text[]    | étapes                             |
| product      | text      | nullable, produit utilisé          |
| duration_min | int       | défaut 15                          |
| active       | bool      |                                    |
| created_at   | timestamp |                                    |

### cleaning_records
| Colonne        | Type      | Notes               |
|----------------|-----------|---------------------|
| id             | UUID PK   |                     |
| task_id        | UUID FK   | → cleaning_tasks.id |
| scheduled_date | date      |                     |
| completed_at   | timestamp | nullable            |
| author_id      | UUID FK   | nullable → employees.id |
| status         | text      | `'done'`            |
| note           | text      | nullable            |
| created_at     | timestamp |                     |

---

## Temperatures Module

### equipments
| Colonne     | Type      | Notes                                |
|-------------|-----------|--------------------------------------|
| id          | UUID PK   |                                      |
| slug        | text      | unique — id legacy (ex: `"eq-joel"`) |
| name        | text      |                                      |
| type        | text      | `'positif'` \| `'négatif'`           |
| min_temp    | float     |                                      |
| max_temp    | float     |                                      |
| color_index | int       |                                      |
| order       | int       | ordre d'affichage                    |
| active      | bool      |                                      |
| created_at  | timestamp |                                      |

### temperature_readings
| Colonne      | Type      | Notes                    |
|--------------|-----------|--------------------------|
| id           | UUID PK   |                          |
| equipment_id | UUID FK   | → equipments.id          |
| date         | date      |                          |
| slot         | text      | nullable (matin/soir…)   |
| time         | text      |                          |
| temperature  | float     |                          |
| comment      | text      | nullable                 |
| author_id    | UUID FK   | nullable → employees.id  |
| created_by   | text      | nullable (nom libre)     |
| created_at   | timestamp |                          |

---

## Products Module

### products
Taille, ingrédients, étapes de recette stockés en **JSONB** directement dans `products`
(les tables `product_sizes`, `product_ingredients`, `recipe_steps` existent mais ne sont pas utilisées).

| Colonne                   | Type      | Notes                                   |
|---------------------------|-----------|-----------------------------------------|
| id                        | UUID PK   |                                         |
| name                      | text      |                                         |
| category                  | text      |                                         |
| description               | text      | nullable                                |
| photo_url                 | text      | nullable                                |
| active                    | bool      |                                         |
| pregnancy_safe            | text      | `'yes'` \| `'no'` \| `'check'`         |
| internal_notes            | text      |                                         |
| webflow_product_id        | text      | nullable, unique                        |
| sizes                     | JSONB     | `[{ label, price }]`                    |
| allergens                 | JSONB     | `string[]`                              |
| ingredients               | JSONB     | `[{ name, qty, unit }]`                 |
| recipe_steps              | JSONB     | `[{ step, duration_min }]`              |
| pregnancy_note            | text      | nullable                                |
| total_production_time_min | int       | nullable                                |
| rest_time_min             | int       | nullable                                |
| advance_prep_days         | int       | défaut 0                                |
| storage_conditions        | text      |                                         |
| shelf_life_hours          | int       | nullable                                |
| sanitary_notes            | text      |                                         |
| created_at                | timestamp |                                         |
| updated_at                | timestamp |                                         |

### product_sizes / product_ingredients / recipe_steps
Tables existantes, non utilisées (données en JSONB dans `products`).

---

## Orders Module

### orders
| Colonne          | Type      | Notes                                    |
|------------------|-----------|------------------------------------------|
| id               | UUID PK   |                                          |
| channel          | text      | `'boutique'` \| `'web'` \| `'brunch'`   |
| brunch_source    | text      | nullable                                 |
| customer_name    | text      |                                          |
| customer_phone   | text      | nullable                                 |
| customer_email   | text      | nullable                                 |
| pickup_date      | date      |                                          |
| pickup_time      | text      | nullable                                 |
| payment_status   | text      | `'unpaid'` \| `'partial'` \| `'paid'`   |
| paid_amount      | float     | nullable                                 |
| total_price      | float     | nullable                                 |
| note             | text      | nullable                                 |
| webflow_order_id | text      | nullable, unique                         |
| created_at       | timestamp |                                          |
| updated_at       | timestamp |                                          |

### order_items
| Colonne    | Type    | Notes                       |
|------------|---------|-----------------------------|
| id         | UUID PK |                             |
| order_id   | UUID FK | → orders.id                 |
| product_id | UUID FK | nullable → products.id      |
| label      | text    |                             |
| size       | text    | nullable                    |
| qty        | int     |                             |
| unit_price | float   | nullable                    |

---

## Traceability Module

### suppliers
| Colonne      | Type      | Notes                               |
|--------------|-----------|-------------------------------------|
| id           | UUID PK   |                                     |
| slug         | text      | unique — id legacy (ex: `"sup-001"`) |
| name         | text      |                                     |
| contact_name | text      | nullable                            |
| phone        | text      | nullable                            |
| color_index  | int       |                                     |
| active       | bool      |                                     |
| created_at   | timestamp |                                     |

### delivered_products
| Colonne              | Type      | Notes                                        |
|----------------------|-----------|----------------------------------------------|
| id                   | UUID PK   |                                              |
| slug                 | text      | unique — id legacy                           |
| supplier_id          | UUID FK   | → suppliers.id                               |
| date                 | date      |                                              |
| product_name         | text      |                                              |
| weight_text          | text      | nullable (ex: `"2.5 kg"`)                   |
| lot                  | text      | nullable                                     |
| dlc                  | date      | nullable                                     |
| temperature          | float     | nullable                                     |
| conformity           | text      | `'compliant'` \| `'non_compliant'`           |
| non_conformity_note  | text      | nullable                                     |
| photo_url            | text      | nullable — URL Google Drive                  |
| created_at           | timestamp |                                              |
