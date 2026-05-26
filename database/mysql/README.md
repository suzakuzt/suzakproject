# MySQL Scripts

These scripts prepare the MySQL application database used by the Linux staging/production runtime. SQLite remains the default for local development and unit tests.

## Script Order

| Order | File | Purpose |
| --- | --- | --- |
| 1 | `001_init_activity_tables.sql` | Create 18 activity business tables |
| 2 | `002_seed_basic_mock_config.sql` | Seed activity config, draw results, products, coupon rewards, assets, rules, and Hermes coupon issue config |

`001_init_activity_tables.sql` includes the fields needed by the current activity flow, including daily state, draw snapshots, mobile claim fields, `claim_token`, coupon issue state, grand-prize qualification, grand-prize draw config, and tracking events.

## Recommended Execution

Dry run:

```powershell
python scripts/prepare_mysql.py --skip-create-database
```

Execute against an existing managed application database:

```powershell
python scripts/prepare_mysql.py --skip-create-database --execute
```

For a local MySQL database where database creation is allowed:

```powershell
python scripts/prepare_mysql.py --execute
```

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `GAOKAO_H5_MYSQL_HOST` | MySQL host |
| `GAOKAO_H5_MYSQL_PORT` | MySQL port, usually `3306` |
| `GAOKAO_H5_MYSQL_USER` | MySQL user |
| `GAOKAO_H5_MYSQL_PASSWORD` | MySQL password, configured outside Git |
| `GAOKAO_H5_MYSQL_DATABASE` | Target database name |
| `GAOKAO_H5_MYSQL_CLIENT` | MySQL client command, defaults to `mysql` |

## Runtime Notes

- Enable MySQL in FastAPI with `GAOKAO_H5_DB_ENGINE=mysql`.
- The runtime adapter is implemented in `backend/app/database.py`.
- SQL `?` placeholders are translated to `%s` for PyMySQL.
- `002_seed_basic_mock_config.sql` sets `NO_BACKSLASH_ESCAPES` for the session so JSON strings containing `\n` import correctly.
- Do not expose MySQL port `3306` to the public internet.

## Verification

```powershell
python -m unittest backend.tests.test_prepare_mysql -v
python scripts/prepare_mysql.py --skip-create-database
```
