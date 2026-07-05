SELECT
  a.id          AS activity_id,
  a.name        AS activity_name,
  a.icon,
  a.interval_days,
  i.id          AS item_id,
  i.name        AS item_name,
  i.emoji       AS item_emoji,
  i.location,
  MAX(l.done_at) AS last_done_at,
  CASE
    WHEN MAX(l.done_at) IS NULL THEN NULL
    ELSE date(MAX(l.done_at), '+' || a.interval_days || ' days')
  END AS next_due_at
FROM app_home_maintenance__activities a
JOIN app_home_maintenance__items i
  ON i.id = a.item_id
LEFT JOIN app_home_maintenance__logs l
  ON l.activity_id = a.id
GROUP BY a.id, a.name, a.icon, a.interval_days, i.id, i.name, i.emoji, i.location
HAVING
  MAX(l.done_at) IS NULL
  OR date(MAX(l.done_at), '+' || a.interval_days || ' days') < CURRENT_DATE
ORDER BY next_due_at, a.name
LIMIT 100
