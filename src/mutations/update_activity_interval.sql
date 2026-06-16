UPDATE app_home_maintenance__activities
SET interval_days = $2
WHERE id = $1
