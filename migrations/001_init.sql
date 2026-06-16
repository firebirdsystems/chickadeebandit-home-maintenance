CREATE TABLE IF NOT EXISTS app_home_maintenance__items (
  id           TEXT NOT NULL,
  name         TEXT NOT NULL,
  emoji        TEXT NOT NULL DEFAULT '🔧',
  location     TEXT NOT NULL DEFAULT '',
  notes        TEXT NOT NULL DEFAULT '',
  created_at   TEXT NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS app_home_maintenance__activities (
  id            TEXT NOT NULL,
  item_id       TEXT NOT NULL,
  name          TEXT NOT NULL,
  icon          TEXT NOT NULL DEFAULT '🔧',
  interval_days REAL NOT NULL DEFAULT 90,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS app_home_maintenance__logs (
  id           TEXT NOT NULL,
  activity_id  TEXT NOT NULL,
  item_id      TEXT NOT NULL,
  done_by      TEXT NOT NULL,
  done_at      TEXT NOT NULL,
  notes        TEXT NOT NULL DEFAULT '',
  created_at   TEXT NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS app_home_maintenance__documents (
  id           TEXT NOT NULL,
  item_id      TEXT NOT NULL,
  name         TEXT NOT NULL,
  file_id      TEXT NOT NULL,
  file_url     TEXT NOT NULL,
  file_size    INTEGER NOT NULL DEFAULT 0,
  uploaded_by  TEXT NOT NULL,
  created_at   TEXT NOT NULL,
  PRIMARY KEY (id)
);
