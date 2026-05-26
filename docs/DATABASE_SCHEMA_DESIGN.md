# Database Schema And Runtime

The project keeps SQLite for local development and automated tests, and uses MySQL for Linux staging/production by setting `GAOKAO_H5_DB_ENGINE=mysql`.

## Runtime Selection

Runtime database selection lives in `backend/app/database.py`.

| Engine | How it is selected | Use case |
| --- | --- | --- |
| SQLite | Default, or `GAOKAO_H5_DB_ENGINE=sqlite` | Local development and unit tests |
| MySQL | `GAOKAO_H5_DB_ENGINE=mysql` | Linux staging/production release |

The service code uses `connection()`, `fetch_one()`, `fetch_all()`, `last_insert_id()`, and `is_mysql_connection()` from `backend/app/database.py` so the same business flow can run against either engine.

## MySQL Scripts

| Script | Purpose |
| --- | --- |
| `database/mysql/001_init_activity_tables.sql` | MySQL schema for activity, draw, sharing, coupon claim, grand-prize, poster metadata, and tracking tables |
| `database/mysql/002_seed_basic_mock_config.sql` | Seed activity config, reward config, Hermes coupon issue config, draw result config, assets, and rules |
| `scripts/prepare_mysql.py` | Generates or executes bootstrap SQL, validates database name, and can skip database creation for managed app databases |

Dry run:

```powershell
python scripts/prepare_mysql.py --skip-create-database
```

Execute:

```powershell
python scripts/prepare_mysql.py --skip-create-database --execute
```

## SQLite Scripts

| Script | Purpose |
| --- | --- |
| `database/sqlite/001_init_activity_tables.sql` | Local SQLite base schema |
| `database/sqlite/002_seed_basic_mock_config.sql` | Local seed data |
| `database/sqlite/003_optimize_activity_tables.sql` | Local compatibility migration |
| `database/sqlite/004_allow_duplicate_reward_claims_per_draw.sql` | Rebuild claim uniqueness for per-draw repeat claims |
| `database/sqlite/005_add_mobile_claim_fields.sql` | Legacy mobile claim compatibility migration |
| `database/sqlite/006_add_coupon_issue_config.sql` | Legacy coupon issue config migration |
| `database/sqlite/007_add_grand_prize_draw_config.sql` | Legacy grand-prize draw config migration |

## Table Groups

| Group | Tables |
| --- | --- |
| Activity config | `activity_config`, `activity_asset_config` |
| Content config | `draw_result_config`, `product_recommend_config`, `reward_config`, `coupon_issue_config` |
| User state | `activity_user`, `activity_session`, `user_daily_state` |
| Draw chance | `draw_record`, `draw_chance_log`, `checkin_record` |
| Sharing | `share_record`, `share_assist_record` |
| Reward and grand prize | `reward_claim_record`, `grand_prize_qualification`, `grand_prize_draw_config` |
| Tracking | `tracking_event` |

Poster PNG files are stored on disk, not as database blobs. The backend writes them under `GAOKAO_H5_POSTER_DIR` or `backend/data/posters/`.

## Key Constraints

| Table | Constraint |
| --- | --- |
| `activity_user` | Unique per `activity_code` + `user_key` |
| `activity_session` | Unique `session_token` |
| `user_daily_state` | Unique per `activity_code` + `user_id` + `biz_date` |
| `draw_record` | Unique `draw_no`; stores result and reward snapshots |
| `share_record` | Unique `share_token` |
| `share_assist_record` | One assist per share token and assistant |
| `reward_claim_record` | One claim per user/draw/reward; unique `claim_token` |
| `grand_prize_qualification` | One qualification record per activity/user |

## Main Data Flow

```text
createSession
  -> activity_user
  -> activity_session
  -> user_daily_state

drawExecute
  -> draw_record
  -> draw_chance_log
  -> checkin_record
  -> grand_prize_qualification

shareRecord
  -> share_record
  -> user_daily_state
  -> draw_chance_log

friend drawExecute with share_token
  -> share_assist_record
  -> grand_prize_qualification

claimBenefit
  -> coupon_issue_config
  -> Hermes manualImport
  -> reward_claim_record

recordTrackingEvent
  -> tracking_event
```

## MySQL Compatibility Notes

- `?` placeholders are translated to `%s` in the MySQL adapter.
- MySQL uses `DictCursor`, so repository/service code continues to read rows by column name.
- Insert ids go through `last_insert_id()`.
- SQLite `ON CONFLICT` and MySQL `ON DUPLICATE KEY UPDATE` are handled by engine-specific helper SQL where needed.
- Tracking `client_time` is normalized to `YYYY-MM-DD HH:MM:SS` before insert so MySQL `DATETIME` accepts frontend ISO timestamps.

## Verification

```powershell
python -m unittest backend.tests.test_database -v
python -m unittest backend.tests.test_prepare_mysql -v
python scripts/prepare_mysql.py --skip-create-database
```
