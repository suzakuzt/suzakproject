PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS user_daily_state (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  activity_code TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  biz_date TEXT NOT NULL,
  base_draw_chance INTEGER NOT NULL DEFAULT 1 CHECK (base_draw_chance >= 0),
  extra_draw_chance INTEGER NOT NULL DEFAULT 0 CHECK (extra_draw_chance >= 0),
  used_draw_count INTEGER NOT NULL DEFAULT 0 CHECK (used_draw_count >= 0),
  remaining_draw_count INTEGER NOT NULL DEFAULT 1 CHECK (remaining_draw_count >= 0),
  share_reward_count_today INTEGER NOT NULL DEFAULT 0 CHECK (share_reward_count_today >= 0),
  checked_in_today INTEGER NOT NULL DEFAULT 0 CHECK (checked_in_today IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'locked')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (activity_code, user_id, biz_date),
  FOREIGN KEY (activity_code) REFERENCES activity_config(activity_code),
  FOREIGN KEY (user_id) REFERENCES activity_user(id)
);

CREATE INDEX IF NOT EXISTS idx_user_daily_state_date
  ON user_daily_state(activity_code, biz_date, status);

ALTER TABLE draw_record
  ADD COLUMN result_level_snapshot TEXT;

ALTER TABLE draw_record
  ADD COLUMN result_title_snapshot TEXT;

ALTER TABLE draw_record
  ADD COLUMN main_text_snapshot TEXT;

ALTER TABLE draw_record
  ADD COLUMN good_text_snapshot TEXT;

ALTER TABLE draw_record
  ADD COLUMN avoid_text_snapshot TEXT;

ALTER TABLE draw_record
  ADD COLUMN explain_title_snapshot TEXT;

ALTER TABLE draw_record
  ADD COLUMN explain_content_snapshot TEXT;

ALTER TABLE draw_record
  ADD COLUMN result_summary_json TEXT;

ALTER TABLE activity_session
  ADD COLUMN invite_status TEXT NOT NULL DEFAULT 'none'
  CHECK (invite_status IN ('none', 'pending', 'completed', 'invalid'));

ALTER TABLE activity_session
  ADD COLUMN assist_completed_at TEXT;

ALTER TABLE reward_claim_record
  ADD COLUMN use_status TEXT NOT NULL DEFAULT 'unused'
  CHECK (use_status IN ('unused', 'used', 'expired', 'locked'));

ALTER TABLE reward_claim_record
  ADD COLUMN used_at TEXT;

ALTER TABLE reward_claim_record
  ADD COLUMN expire_at TEXT;

ALTER TABLE reward_claim_record
  ADD COLUMN external_coupon_id TEXT;

ALTER TABLE grand_prize_qualification
  ADD COLUMN qualification_source_type TEXT;

ALTER TABLE grand_prize_qualification
  ADD COLUMN qualification_source_id TEXT;

ALTER TABLE grand_prize_qualification
  ADD COLUMN qualification_snapshot_json TEXT;

CREATE INDEX IF NOT EXISTS idx_activity_session_invite
  ON activity_session(activity_code, invite_status, source_share_token);

CREATE INDEX IF NOT EXISTS idx_reward_claim_use_status
  ON reward_claim_record(activity_code, user_id, use_status, expire_at);

CREATE INDEX IF NOT EXISTS idx_grand_prize_source
  ON grand_prize_qualification(activity_code, qualification_source_type, qualification_source_id);

COMMIT;
