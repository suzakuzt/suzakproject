# 后端说明

后端使用 FastAPI，当前运行时数据库为 SQLite。它负责会话、抽签、AI 解签、分享、领券、奖励中心、规则、大奖资格和埋点。

## 1. 启动

```powershell
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

默认数据库：

```text
backend/data/gaokao_h5_dev.sqlite3
```

可用环境变量覆盖：

```powershell
$env:GAOKAO_H5_DB_PATH="D:\data\gaokao_h5_dev.sqlite3"
```

接口文档：

```text
http://127.0.0.1:8000/docs
```

## 2. 接口

| 接口 | 作用 |
| --- | --- |
| `GET /api/health` | 健康检查 |
| `POST /api/h5/session/create` | 创建活动会话，绑定用户和分享来源 |
| `GET /api/activity/state` | 获取每日机会和大奖进度 |
| `POST /api/draw/execute` | 抽签、扣机会、随机签文和券、处理好友助力 |
| `GET /api/draw/result/detail` | 结果页补偿查询 |
| `GET /api/explain/detail` | AI 解签、商品和福利详情 |
| `POST /api/benefit/randomize` | 旧入口兼容，返回当前 draw 固定券 |
| `POST /api/benefit/claim` | 手机号领券，生成 `claim_token` 和 `claim_no` |
| `GET /api/benefit/claim/result` | H5 查询领取结果 |
| `GET /api/benefit/claim/resolve` | 小程序券包页用 `claim_token` 承接 |
| `POST /api/share/record` | 记录分享并按每日上限增加机会 |
| `POST /api/poster/save` | 保存 H5 生成的分享海报 PNG |
| `GET /api/poster/image/{poster_id}` | 读取已保存海报图片 |
| `GET /api/reward/center/detail` | 我的奖励页数据 |
| `GET /api/grand-prize/qualification/detail` | 985 礼盒资格页数据 |
| `GET /api/admin/grand-prize/draw-config` | Admin grand-prize draw switch and configured winner lottery numbers |
| `POST /api/admin/grand-prize/draw-config` | Admin save grand-prize draw switch and winner lottery numbers |
| `GET /api/activity/rules/detail` | 活动规则 |
| `POST /api/tracking/event` | 埋点入库 |

`POST /api/tracking/event` 同时承接前端运行监控事件，例如关键节点缺失、资源加载失败、console warning/error 和未捕获异常。

海报保存接口默认写入 `backend/data/posters/`；生产环境可用 `GAOKAO_H5_POSTER_DIR` 指定持久化目录，避免发版覆盖。

## 3. AI 配置

后端会读取环境变量或 `backend/.env`：

```text
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_TIMEOUT_SECONDS=45
DEEPSEEK_MAX_TOKENS=220
```

未配置或调用失败时，接口返回本地兜底签文。

## 4. MySQL 状态

`database/mysql/` 已有建表和 seed 脚本，`scripts/prepare_mysql.py` 可生成或执行建库 SQL。当前 FastAPI 运行时仍是 `sqlite3`，线上切 MySQL 前需要新增 MySQL 连接适配层。

## 5. 测试

```powershell
python -m unittest discover backend.tests -v
python scripts/prepare_mysql.py
```

## 6. Hermes coupon issuing

`POST /api/benefit/claim` issues the coupon through the backend-only Hermes client before returning success to H5.
Do not put portal credentials, `ut`, `X-Token`, or cookies in frontend code.

Production requires these environment variables for portal login. Coupon issuing parameters are stored per `reward_code` in `coupon_issue_config`; edit that table when Hermes ids, ref ids, titles, dates, or face values differ by coupon.

```text
PORTAL_BASE_URL=https://portal.kpcc-tech.com
PORTAL_USERNAME=<portal backend account>
PORTAL_PASSWORD=<portal backend password>
```

`HERMES_*` environment variables are only a legacy/default fallback for direct client usage. The activity claim flow reads the matching row from `coupon_issue_config` and passes that config to Hermes.

Do not commit `.env` files. The Hermes client only logs task id, masked mobile, `successNum`, and `failNum`; it must not log `PORTAL_PASSWORD`, `ut`, or `X-Token`.

## MySQL runtime override

FastAPI defaults to SQLite for local development. Set these environment variables to run against MySQL:

```text
GAOKAO_H5_DB_ENGINE=mysql
GAOKAO_H5_MYSQL_HOST=10.3.0.4
GAOKAO_H5_MYSQL_PORT=3306
GAOKAO_H5_MYSQL_DATABASE=app_333d63781c34389e
GAOKAO_H5_MYSQL_USER=appuser
GAOKAO_H5_MYSQL_PASSWORD=<set outside git>
```

For an existing application database, initialize schema and seed without trying to create the database:

```powershell
python scripts/prepare_mysql.py --skip-create-database --execute
```

The bootstrap SQL sets `NO_BACKSLASH_ESCAPES` for the session before loading seed data so JSON text containing `\n` survives import.
