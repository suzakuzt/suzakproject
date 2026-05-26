# Backend Runtime

The backend is a FastAPI service for H5 session management, draw execution, AI explanation, sharing, coupon claiming, reward center data, rules, grand-prize qualification, admin draw configuration, posters, and tracking events.

## Start Locally

```powershell
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

API docs:

```text
http://127.0.0.1:8000/docs
```

## Database Runtime

The backend supports both SQLite and MySQL through `backend/app/database.py`.

- Local development default: SQLite at `backend/data/gaokao_h5_dev.sqlite3`
- Staging/production: set `GAOKAO_H5_DB_ENGINE=mysql`

MySQL runtime variables:

```text
GAOKAO_H5_DB_ENGINE=mysql
GAOKAO_H5_MYSQL_HOST=<configured outside Git>
GAOKAO_H5_MYSQL_PORT=3306
GAOKAO_H5_MYSQL_DATABASE=<configured outside Git>
GAOKAO_H5_MYSQL_USER=<configured outside Git>
GAOKAO_H5_MYSQL_PASSWORD=<configured outside Git>
GAOKAO_H5_MYSQL_CONNECT_TIMEOUT=10
```

For an existing application database, initialize schema and seed without creating the database:

```powershell
python scripts/prepare_mysql.py --skip-create-database --execute
```

The bootstrap SQL sets `NO_BACKSLASH_ESCAPES` for the session before loading seed data so JSON text containing `\n` survives import.

## Environment

The backend reads process environment variables and `backend/.env` / `backend/.env.local` through `backend/app/local_env.py`.

Do not commit `.env` files, database passwords, portal credentials, tokens, runtime logs, or certificate private keys.

Admin endpoints require:

```text
GAOKAO_H5_ADMIN_TOKEN=<configured outside Git>
```

Send it as either `X-Admin-Token` or `Authorization: Bearer <token>`.

## Hermes Coupon Issuing

`POST /api/benefit/claim` issues coupons through the backend-only Hermes client before returning success to H5.

Production requires:

```text
PORTAL_BASE_URL=https://portal.kpcc-tech.com
PORTAL_USERNAME=<portal backend account>
PORTAL_PASSWORD=<portal backend password>
```

The Hermes client encrypts portal credentials at runtime after fetching the portal public key. Store the original portal username/password in server environment variables; do not pre-encrypt them manually.

Coupon issuing parameters are stored per `reward_code` in `coupon_issue_config`. Update that table when Hermes ids, ref ids, titles, dates, or face values differ by coupon.

## Core Endpoints

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Runtime and database health check |
| `POST /api/h5/session/create` | Create or restore H5 activity session |
| `GET /api/activity/state` | Read daily chance and progress state |
| `POST /api/draw/execute` | Execute draw, consume chance, create result |
| `GET /api/draw/result/detail` | Result page detail |
| `GET /api/explain/detail` | AI explanation, product, and benefit detail |
| `POST /api/benefit/claim` | Claim coupon by mobile and issue through Hermes |
| `GET /api/benefit/claim/result` | H5 claim result query |
| `GET /api/benefit/claim/resolve` | Mini-program coupon page claim-token handoff |
| `GET /api/reward/center/detail` | Reward center data |
| `POST /api/tracking/event` | Behavior and runtime monitoring event sink |
| `GET /api/admin/grand-prize/draw-config` | Admin grand-prize draw config |
| `POST /api/admin/grand-prize/draw-config` | Save admin grand-prize draw config |

## Verification

```powershell
python -m unittest discover backend.tests -v
python scripts/prepare_mysql.py --skip-create-database
```
