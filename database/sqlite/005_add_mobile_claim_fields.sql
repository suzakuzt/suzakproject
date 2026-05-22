ALTER TABLE reward_claim_record ADD COLUMN receiver_mobile TEXT;
ALTER TABLE reward_claim_record ADD COLUMN receiver_mobile_masked TEXT;
ALTER TABLE reward_claim_record ADD COLUMN claim_token TEXT;
ALTER TABLE reward_claim_record ADD COLUMN coupon_issue_status TEXT NOT NULL DEFAULT 'pending' CHECK (coupon_issue_status IN ('pending', 'issued', 'failed', 'skipped'));
ALTER TABLE reward_claim_record ADD COLUMN coupon_issue_error TEXT;
ALTER TABLE reward_claim_record ADD COLUMN external_member_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_reward_claim_token
  ON reward_claim_record(activity_code, claim_token)
  WHERE claim_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reward_claim_mobile
  ON reward_claim_record(activity_code, receiver_mobile);

CREATE INDEX IF NOT EXISTS idx_reward_claim_coupon_issue
  ON reward_claim_record(activity_code, coupon_issue_status, created_at);
