PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS coupon_issue_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  activity_code TEXT NOT NULL,
  reward_code TEXT NOT NULL,
  issue_channel TEXT NOT NULL DEFAULT 'hermes' CHECK (issue_channel IN ('hermes')),
  hermes_title TEXT NOT NULL,
  hermes_id INTEGER NOT NULL,
  ref_id INTEGER NOT NULL,
  ref_type INTEGER NOT NULL DEFAULT 1,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  face_value TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'enabled' CHECK (status IN ('enabled', 'disabled')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  ext_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (activity_code, reward_code, issue_channel),
  FOREIGN KEY (activity_code) REFERENCES activity_config(activity_code),
  FOREIGN KEY (activity_code, reward_code) REFERENCES reward_config(activity_code, reward_code)
);

CREATE INDEX IF NOT EXISTS idx_coupon_issue_status
  ON coupon_issue_config(activity_code, status, sort_order);

INSERT INTO coupon_issue_config (
  activity_code,
  reward_code,
  issue_channel,
  hermes_title,
  hermes_id,
  ref_id,
  ref_type,
  start_time,
  end_time,
  face_value,
  status,
  sort_order,
  ext_json
)
VALUES
  ('gaokao_lucky_sign_2026', 'coupon_10', 'hermes', '一举高中·无门槛10元优惠券', 2605150000000112, 2605150000000126, 1, '2026-05-15 11:00:00', '2026-06-30 23:59:59', '10', 'enabled', 10, '{"source":"portal.hermes.manualImport"}'),
  ('gaokao_lucky_sign_2026', 'coupon_20', 'hermes', '一举高中·无门槛20元优惠券', 2605150000000112, 2605150000000126, 1, '2026-05-15 11:00:00', '2026-06-30 23:59:59', '20', 'disabled', 20, '{"source":"portal.hermes.manualImport"}'),
  ('gaokao_lucky_sign_2026', 'coupon_30', 'hermes', '一举高中·无门槛30元优惠券', 2605150000000112, 2605150000000126, 1, '2026-05-15 11:00:00', '2026-06-30 23:59:59', '30', 'disabled', 30, '{"source":"portal.hermes.manualImport"}'),
  ('gaokao_lucky_sign_2026', 'discount_9', 'hermes', '一举高中·9折优惠券', 2605150000000112, 2605150000000126, 1, '2026-05-15 11:00:00', '2026-06-30 23:59:59', '9', 'disabled', 40, '{"source":"portal.hermes.manualImport"}'),
  ('gaokao_lucky_sign_2026', 'discount_75', 'hermes', '一举高中·7.5折优惠券', 2605150000000112, 2605150000000126, 1, '2026-05-15 11:00:00', '2026-06-30 23:59:59', '7.5', 'disabled', 50, '{"source":"portal.hermes.manualImport"}')
ON CONFLICT(activity_code, reward_code, issue_channel) DO UPDATE SET
  hermes_title = excluded.hermes_title,
  hermes_id = excluded.hermes_id,
  ref_id = excluded.ref_id,
  ref_type = excluded.ref_type,
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  face_value = excluded.face_value,
  status = excluded.status,
  sort_order = excluded.sort_order,
  ext_json = excluded.ext_json,
  updated_at = CURRENT_TIMESTAMP;

COMMIT;
