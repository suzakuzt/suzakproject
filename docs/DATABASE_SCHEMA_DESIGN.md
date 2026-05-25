# 数据库结构和切换说明

当前开发库为 SQLite，默认路径是 `backend/data/gaokao_h5_dev.sqlite3`。MySQL 脚本已准备在 `database/mysql/`，表名和业务字段与 SQLite 口径一致。

## 1. 当前 SQLite 脚本

| 脚本 | 作用 |
| --- | --- |
| `database/sqlite/001_init_activity_tables.sql` | 初始活动表、用户表、抽签表、分享表、领奖表、埋点表 |
| `database/sqlite/002_seed_basic_mock_config.sql` | 本地活动配置、签文、牛肉产品、优惠券、二维码 |
| `database/sqlite/003_optimize_activity_tables.sql` | 每日状态、签文快照、邀请状态、资格快照等优化字段 |
| `database/sqlite/004_allow_duplicate_reward_claims_per_draw.sql` | 重建领奖表唯一约束，允许不同 draw 重复领同券 |
| `database/sqlite/005_add_mobile_claim_fields.sql` | 手机号、claim_token、发券状态字段兼容迁移 |

测试初始化当前主要执行 `001`、`002`、`003`、`004`。`005` 是兼容旧库补丁，字段已合入重建后的领奖表口径。

## 2. MySQL 脚本

| 脚本 | 作用 |
| --- | --- |
| `database/mysql/001_init_activity_tables.sql` | MySQL 版 16 张活动表，包含 SQLite 后续优化字段 |
| `database/mysql/002_seed_basic_mock_config.sql` | MySQL 版基础活动配置和素材配置 |
| `scripts/prepare_mysql.py` | 生成/执行建库 SQL，固定脚本顺序，校验库名 |

dry-run：

```powershell
$env:GAOKAO_H5_MYSQL_HOST="127.0.0.1"
$env:GAOKAO_H5_MYSQL_PORT="3306"
$env:GAOKAO_H5_MYSQL_USER="root"
$env:GAOKAO_H5_MYSQL_PASSWORD="your-password"
$env:GAOKAO_H5_MYSQL_DATABASE="gaokao_h5"
python scripts/prepare_mysql.py
```

执行：

```powershell
python scripts/prepare_mysql.py --execute
```

## 3. 表分组

| 分组 | 表 |
| --- | --- |
| 活动配置 | `activity_config`、`activity_asset_config` |
| 内容配置 | `draw_result_config`、`product_recommend_config`、`reward_config` |
| 用户状态 | `activity_user`、`activity_session`、`user_daily_state` |
| 抽签机会 | `draw_record`、`draw_chance_log`、`checkin_record` |
| 分享助力 | `share_record`、`share_assist_record` |
| 领奖大奖 | `reward_claim_record`、`grand_prize_qualification` |
| 埋点 | `tracking_event` |

海报弹窗生成的 PNG 不写入业务数据库表。后端通过 `POST /api/poster/save` 校验 PNG data URL 后写入文件系统，默认目录为 `backend/data/posters/`，可用 `GAOKAO_H5_POSTER_DIR` 切换。保存成功、失败等状态通过 `tracking_event` 记录，MySQL 切换时不需要新增海报表。

## 4. 关键约束

| 表 | 关键约束 |
| --- | --- |
| `activity_user` | `UNIQUE(activity_code, user_key)` |
| `activity_session` | `session_token` 唯一，保留 `source_share_token` |
| `user_daily_state` | `UNIQUE(activity_code, user_id, biz_date)` |
| `draw_record` | `draw_no` 唯一，保存签文和券快照 |
| `share_record` | `share_token` 唯一，记录是否已加机会 |
| `share_assist_record` | 同一 token + 好友只能助力一次 |
| `reward_claim_record` | 同一用户、同一 draw、同一券只能领一次；`claim_token` 唯一 |
| `grand_prize_qualification` | 同一用户同一活动一条资格记录 |

## 5. 数据流

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
  -> reward_claim_record

posterSave
  -> poster png file
  -> tracking_event
```

## 6. SQLite 到 MySQL 切换口径

当前已具备：

- MySQL 建表和 seed 脚本。
- `scripts/prepare_mysql.py` dry-run/execute。
- 后端测试覆盖 MySQL 表数量和脚本顺序。

上线切换还需要：

- 在 `backend/app/database.py` 增加 MySQL 连接适配，或新增 repository adapter。
- 将 SQL 占位符、日期函数、JSON 字段读写统一抽象，避免 SQLite/MySQL 语法差异散落在业务代码里。
- 上线前在空 MySQL 库执行 `python scripts/prepare_mysql.py --execute`，再跑接口冒烟。

## 7. 检查命令

```powershell
python -m unittest backend.tests.test_database -v
python -m unittest backend.tests.test_prepare_mysql -v
python scripts/prepare_mysql.py
```
