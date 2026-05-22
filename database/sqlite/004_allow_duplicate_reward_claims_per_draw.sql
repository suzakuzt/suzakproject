PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS reward_claim_record_new;

CREATE TABLE reward_claim_record_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  activity_code TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  session_id INTEGER,
  draw_id INTEGER,
  reward_code TEXT NOT NULL,
  claim_no TEXT NOT NULL UNIQUE,
  claim_status TEXT NOT NULL DEFAULT 'success' CHECK (claim_status IN ('success', 'pending', 'failed', 'cancelled')),
  claim_channel TEXT,
  reward_snapshot_json TEXT,
  action_type TEXT,
  action_target TEXT,
  idempotency_key TEXT,
  receiver_mobile TEXT,
  receiver_mobile_masked TEXT,
  claim_token TEXT,
  coupon_issue_status TEXT NOT NULL DEFAULT 'pending' CHECK (coupon_issue_status IN ('pending', 'issued', 'failed', 'skipped')),
  coupon_issue_error TEXT,
  external_member_id TEXT,
  biz_date TEXT NOT NULL,
  claimed_at TEXT,
  use_status TEXT NOT NULL DEFAULT 'unused' CHECK (use_status IN ('unused', 'used', 'expired', 'locked')),
  used_at TEXT,
  expire_at TEXT,
  external_coupon_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (activity_code, user_id, draw_id, reward_code),
  UNIQUE (activity_code, user_id, idempotency_key),
  UNIQUE (activity_code, claim_token),
  FOREIGN KEY (activity_code) REFERENCES activity_config(activity_code),
  FOREIGN KEY (user_id) REFERENCES activity_user(id),
  FOREIGN KEY (session_id) REFERENCES activity_session(id),
  FOREIGN KEY (draw_id) REFERENCES draw_record(id),
  FOREIGN KEY (activity_code, reward_code) REFERENCES reward_config(activity_code, reward_code)
);

INSERT INTO reward_claim_record_new (
  id,
  activity_code,
  user_id,
  session_id,
  draw_id,
  reward_code,
  claim_no,
  claim_status,
  claim_channel,
  reward_snapshot_json,
  action_type,
  action_target,
  idempotency_key,
  receiver_mobile,
  receiver_mobile_masked,
  claim_token,
  coupon_issue_status,
  coupon_issue_error,
  external_member_id,
  biz_date,
  claimed_at,
  use_status,
  used_at,
  expire_at,
  external_coupon_id,
  created_at,
  updated_at
)
SELECT
  id,
  activity_code,
  user_id,
  session_id,
  draw_id,
  reward_code,
  claim_no,
  claim_status,
  claim_channel,
  reward_snapshot_json,
  action_type,
  action_target,
  idempotency_key,
  NULL,
  NULL,
  NULL,
  'pending',
  NULL,
  NULL,
  biz_date,
  claimed_at,
  COALESCE(use_status, 'unused'),
  used_at,
  expire_at,
  external_coupon_id,
  created_at,
  updated_at
FROM reward_claim_record;

DROP TABLE reward_claim_record;
ALTER TABLE reward_claim_record_new RENAME TO reward_claim_record;

CREATE INDEX IF NOT EXISTS idx_reward_claim_user
  ON reward_claim_record(activity_code, user_id, claim_status, created_at);

CREATE INDEX IF NOT EXISTS idx_reward_claim_use_status
  ON reward_claim_record(activity_code, user_id, use_status, expire_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reward_claim_token
  ON reward_claim_record(activity_code, claim_token)
  WHERE claim_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reward_claim_mobile
  ON reward_claim_record(activity_code, receiver_mobile);

CREATE INDEX IF NOT EXISTS idx_reward_claim_coupon_issue
  ON reward_claim_record(activity_code, coupon_issue_status, created_at);

PRAGMA foreign_keys = ON;
