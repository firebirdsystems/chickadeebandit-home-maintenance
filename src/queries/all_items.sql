SELECT
  id,
  name,
  emoji,
  location,
  notes,
  created_at
FROM items
WHERE household_id = current_setting('app.household_id', true)::uuid
ORDER BY name
LIMIT 200
