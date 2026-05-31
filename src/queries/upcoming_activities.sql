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
  (MAX(l.done_at)::date + a.interval_days::integer)::text AS next_due_at
FROM activities a
JOIN items i
  ON i.id            = a.item_id
  AND i.household_id = a.household_id
LEFT JOIN logs l
  ON l.activity_id   = a.id
  AND l.household_id = a.household_id
WHERE a.household_id = current_setting('app.household_id', true)::uuid
GROUP BY a.id, a.name, a.icon, a.interval_days, i.id, i.name, i.emoji, i.location
HAVING
  MAX(l.done_at) IS NOT NULL
  AND (MAX(l.done_at)::date + a.interval_days::integer)
      BETWEEN CURRENT_DATE AND (CURRENT_DATE + 60)
ORDER BY next_due_at
LIMIT 100
