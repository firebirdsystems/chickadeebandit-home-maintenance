-- all_items orders by created_at under LIMIT 200. The query already documents
-- why it orders by created_at rather than name: name is encrypted at rest and
-- would sort as ciphertext. This makes that ordering an indexed walk.
CREATE INDEX IF NOT EXISTS app_home_maintenance__items_created_idx
  ON app_home_maintenance__items(created_at);
