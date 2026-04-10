-- ══════════════════════════════════════════════════════════════════════════════
-- Kubo Pâtisserie — Schéma Supabase
-- Migration progressive depuis localStorage / Google Sheets
-- ══════════════════════════════════════════════════════════════════════════════

-- Fonction utilitaire : mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ══════════════════════════════════════════════════════════════════════════════
-- PLANNING
-- ══════════════════════════════════════════════════════════════════════════════

-- Employés — source de vérité partagée par tous les modules
CREATE TABLE employees (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identité
  name            TEXT        NOT NULL,           -- ex: "Lucie Martin" (champ unique dans le frontend)
  initials        TEXT,                           -- ex: "LM" (affiché dans les cartes planning)
  role            TEXT,                           -- ex: "production", "vente"
  email           TEXT,
  phone           TEXT,

  -- Planning
  contract        INTEGER     NOT NULL DEFAULT 35, -- heures hebdomadaires contractuelles
  start_balance   NUMERIC(6,2) NOT NULL DEFAULT 0, -- solde initial en heures (peut être négatif)
  color           TEXT,                            -- identifiant couleur CSS du token (ex: "violet")

  -- Statut
  archived        BOOLEAN     NOT NULL DEFAULT FALSE,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;


-- Shifts — un par employé par jour (plusieurs possibles : shift principal + absence école)
CREATE TABLE shifts (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id               UUID        NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  date                      DATE        NOT NULL,  -- format YYYY-MM-DD
  type                      TEXT        NOT NULL DEFAULT 'work',
                                                   -- work | rest | school | sick | absent | leave
  start_hour                NUMERIC(4,2),          -- ex: 8.5 = 8h30 (décimal, cohérent avec le frontend)
  end_hour                  NUMERIC(4,2),          -- ex: 17.0
  pause                     INTEGER     DEFAULT 0, -- minutes de pause (déduit des heures effectives)

  -- Flags planning
  validated                 BOOLEAN     NOT NULL DEFAULT FALSE,
  school_absence            BOOLEAN     NOT NULL DEFAULT FALSE,
  school_absence_duration   NUMERIC(4,2),          -- en heures (ex: 2.0)

  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shifts_employee_date ON shifts(employee_id, date);
CREATE INDEX idx_shifts_date          ON shifts(date);

CREATE TRIGGER trg_shifts_updated_at
  BEFORE UPDATE ON shifts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;


-- ══════════════════════════════════════════════════════════════════════════════
-- COMMANDES
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Canal
  channel           TEXT        NOT NULL,          -- boutique | web | brunch
  brunch_source     TEXT,                          -- boutique | web (si channel = brunch)

  -- Client
  customer_name     TEXT        NOT NULL,
  customer_phone    TEXT,
  customer_email    TEXT,

  -- Retrait
  pickup_date       DATE        NOT NULL,
  pickup_time       TEXT,                          -- ex: "14:30" (format libre dans le frontend)

  -- Paiement
  payment_status    TEXT        NOT NULL DEFAULT 'unpaid', -- paid | unpaid | partial
  paid_amount       NUMERIC(8,2),
  total_price       NUMERIC(8,2),

  -- Divers
  note              TEXT,
  webflow_order_id  TEXT        UNIQUE,            -- déduplication commandes Webflow

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_pickup_date   ON orders(pickup_date);
CREATE INDEX idx_orders_channel       ON orders(channel);
CREATE INDEX idx_orders_webflow_id    ON orders(webflow_order_id);

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;


CREATE TABLE order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID,                                -- NULL si produit supprimé ou hors catalogue
  label       TEXT        NOT NULL,               -- nom affiché (snapshot au moment de la commande)
  size        TEXT,                               -- ex: "6 personnes"
  qty         INTEGER     NOT NULL DEFAULT 1,
  unit_price  NUMERIC(8,2),

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);

CREATE TRIGGER trg_order_items_updated_at
  BEFORE UPDATE ON order_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;


-- ══════════════════════════════════════════════════════════════════════════════
-- PRODUITS
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE products (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name                TEXT        NOT NULL,
  category            TEXT,
  description         TEXT,
  photo_url           TEXT,                        -- URL Google Drive ou externe
  active              BOOLEAN     NOT NULL DEFAULT TRUE,

  -- Santé / allergènes
  pregnancy_safe      BOOLEAN     NOT NULL DEFAULT FALSE,

  -- Interne
  internal_notes      TEXT,
  responsible_id      UUID        REFERENCES employees(id) ON DELETE SET NULL,

  -- Webflow sync
  webflow_product_id  TEXT        UNIQUE,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category);

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE products ENABLE ROW LEVEL SECURITY;


-- Déclinaisons (tailles / formats)
CREATE TABLE product_sizes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  label            TEXT        NOT NULL,           -- ex: "6 personnes", "8 personnes"
  price            NUMERIC(8,2),
  cost_per_unit    NUMERIC(8,2),
  weight_g         INTEGER,
  production_time_min INTEGER,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_sizes_product ON product_sizes(product_id);

CREATE TRIGGER trg_product_sizes_updated_at
  BEFORE UPDATE ON product_sizes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE product_sizes ENABLE ROW LEVEL SECURITY;


-- Ingrédients d'un produit
CREATE TABLE product_ingredients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  name        TEXT        NOT NULL,
  quantity    TEXT,                                -- valeur libre (ex: "200", "2 càs")
  unit        TEXT,                               -- ex: "g", "mL", "unités"

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_ingredients_product ON product_ingredients(product_id);

ALTER TABLE product_ingredients ENABLE ROW LEVEL SECURITY;


-- Étapes de recette
CREATE TABLE recipe_steps (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  step_order      INTEGER     NOT NULL,
  description     TEXT        NOT NULL,
  temperature_c   INTEGER,
  duration_min    INTEGER,
  equipment       TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recipe_steps_product ON recipe_steps(product_id, step_order);

ALTER TABLE recipe_steps ENABLE ROW LEVEL SECURITY;


-- ══════════════════════════════════════════════════════════════════════════════
-- TEMPÉRATURES
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE equipments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name        TEXT        NOT NULL,
  type        TEXT,                               -- ex: "fridge", "freezer", "oven"
  min_temp    NUMERIC(5,1),
  max_temp    NUMERIC(5,1),
  color       TEXT,                              -- identifiant token couleur

  active      BOOLEAN     NOT NULL DEFAULT TRUE,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_equipments_updated_at
  BEFORE UPDATE ON equipments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE equipments ENABLE ROW LEVEL SECURITY;


CREATE TABLE temperature_readings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id  UUID        NOT NULL REFERENCES equipments(id) ON DELETE CASCADE,

  date          DATE        NOT NULL,
  time          TEXT        NOT NULL,             -- ex: "08:30"
  temperature   NUMERIC(5,1) NOT NULL,
  author_id     UUID        REFERENCES employees(id) ON DELETE SET NULL,
  comment       TEXT,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_temp_readings_equipment_date ON temperature_readings(equipment_id, date);

CREATE TRIGGER trg_temp_readings_updated_at
  BEFORE UPDATE ON temperature_readings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE temperature_readings ENABLE ROW LEVEL SECURITY;


-- ══════════════════════════════════════════════════════════════════════════════
-- NETTOYAGE
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE cleaning_zones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name        TEXT        NOT NULL,
  color       TEXT,                              -- token couleur (ex: "blue", "green")

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE cleaning_zones ENABLE ROW LEVEL SECURITY;


CREATE TABLE cleaning_tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id      UUID        NOT NULL REFERENCES cleaning_zones(id) ON DELETE CASCADE,

  name         TEXT        NOT NULL,
  frequency    TEXT        NOT NULL,              -- daily | weekly | monthly
  day_of_week  INTEGER,                           -- 0=dim … 6=sam (si weekly)
  protocol     TEXT,
  product      TEXT,
  duration_min INTEGER,
  active       BOOLEAN     NOT NULL DEFAULT TRUE,

  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cleaning_tasks_zone ON cleaning_tasks(zone_id);

CREATE TRIGGER trg_cleaning_tasks_updated_at
  BEFORE UPDATE ON cleaning_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE cleaning_tasks ENABLE ROW LEVEL SECURITY;


CREATE TABLE cleaning_records (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id        UUID        NOT NULL REFERENCES cleaning_tasks(id) ON DELETE CASCADE,

  scheduled_date DATE        NOT NULL,
  completed_at   TIMESTAMPTZ,
  author_id      UUID        REFERENCES employees(id) ON DELETE SET NULL,
  status         TEXT        NOT NULL DEFAULT 'pending', -- pending | done | skipped
  note           TEXT,

  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cleaning_records_task_date ON cleaning_records(task_id, scheduled_date);
CREATE INDEX idx_cleaning_records_date      ON cleaning_records(scheduled_date);

CREATE TRIGGER trg_cleaning_records_updated_at
  BEFORE UPDATE ON cleaning_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE cleaning_records ENABLE ROW LEVEL SECURITY;


-- ══════════════════════════════════════════════════════════════════════════════
-- TRAÇABILITÉ
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE suppliers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name          TEXT        NOT NULL,
  contact_name  TEXT,
  phone         TEXT,
  color         TEXT,                            -- token couleur

  active        BOOLEAN     NOT NULL DEFAULT TRUE,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;


CREATE TABLE delivered_products (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id          UUID        NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,

  date                 DATE        NOT NULL,
  author_id            UUID        REFERENCES employees(id) ON DELETE SET NULL,

  product_name         TEXT        NOT NULL,
  weight               NUMERIC(8,3),              -- en kg
  quantity             INTEGER,
  dlc                  DATE,
  lot                  TEXT,
  temperature          NUMERIC(5,1),

  conformity           TEXT        NOT NULL DEFAULT 'compliant',
                                                  -- compliant | non_compliant
  non_conformity_note  TEXT,

  photo_url            TEXT,                      -- URL Google Drive

  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_delivered_products_supplier_date ON delivered_products(supplier_id, date);
CREATE INDEX idx_delivered_products_date          ON delivered_products(date);

CREATE TRIGGER trg_delivered_products_updated_at
  BEFORE UPDATE ON delivered_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE delivered_products ENABLE ROW LEVEL SECURITY;
