SELECT
  id,
  name,
  emoji,
  location,
  notes,
  created_at
FROM app_home_maintenance__items
-- `name` is encrypted at rest, so ORDER BY name sorts ciphertext. created_at is
-- plaintext by the _at suffix rule and gives a stable, meaningful order. Callers
-- that want alphabetical order must sort after the hub decrypts.
ORDER BY created_at
LIMIT 200
