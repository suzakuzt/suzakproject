PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

ALTER TABLE grand_prize_qualification
  ADD COLUMN lottery_suffix TEXT;

UPDATE grand_prize_qualification
SET lottery_suffix = substr(lottery_no, -6)
WHERE COALESCE(lottery_no, '') <> ''
  AND COALESCE(lottery_suffix, '') = '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_grand_prize_lottery_suffix
  ON grand_prize_qualification(lottery_suffix)
  WHERE lottery_suffix IS NOT NULL AND lottery_suffix <> '';

COMMIT;
