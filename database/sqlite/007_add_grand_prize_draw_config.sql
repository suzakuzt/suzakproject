PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS grand_prize_draw_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  activity_code TEXT NOT NULL UNIQUE,
  draw_enabled INTEGER NOT NULL DEFAULT 0 CHECK (draw_enabled IN (0, 1)),
  winning_lottery_nos TEXT NOT NULL DEFAULT '[]',
  configured_by TEXT,
  remark TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (activity_code) REFERENCES activity_config(activity_code)
);

COMMIT;
