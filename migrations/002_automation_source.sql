-- Automation support for the `add_item` action.
--
-- `source_event_id` records which app event produced the row. The dispatcher's
-- dedupe guard matches on it (SELECT 1 FROM ... WHERE source_event_id = ?
-- LIMIT 1), so a retried or replayed delivery finds the existing row and skips
-- instead of adding the same piece of equipment twice.
--
-- Nullable on purpose: items added by hand have no source event, and the guard
-- only ever looks for a specific non-null id.
ALTER TABLE app_home_maintenance__items ADD COLUMN source_event_id TEXT;

CREATE INDEX IF NOT EXISTS app_home_maintenance__idx_items_source_event_id
  ON app_home_maintenance__items(source_event_id);
