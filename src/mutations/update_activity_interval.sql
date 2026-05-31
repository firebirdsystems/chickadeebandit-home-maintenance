UPDATE activities
SET interval_days = $2
WHERE id           = $1
  AND household_id = current_setting('app.household_id', true)::uuid
