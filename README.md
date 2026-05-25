# 高考好运签 H5

Vue 3 + Vite 前端，FastAPI 后端，本地默认使用 SQLite。项目已按活动上线链路整理为 P1 首页、P2/P4 统一结果页、P5 领券、P6 我的奖励、P7 规则、P8 大奖资格。

## 快速启动

```powershell
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

访问：

```text
http://127.0.0.1:5173/activity/home
http://127.0.0.1:8000/docs
```

## 验证命令

```powershell
npm test
npm run build
python -m unittest discover backend.tests -v
python scripts/prepare_mysql.py
```

## 核心文档

| 文档 | 内容 |
| --- | --- |
| `docs/README.md` | P1-P8 系统流程、前后端关系、上线核对 |
| `docs/INTERFACE_COVERAGE_CHECK.md` | 当前 API 清单、页面调用、落表关系 |
| `docs/DATABASE_SCHEMA_DESIGN.md` | SQLite 表结构、MySQL 脚本、切换口径 |
| `docs/RUNTIME_MONITORING.md` | 前端运行日志、关键节点监控、报错告警口径 |
| `docs/P1_FRONTEND_INTERFACE_CHECK.md` | P1 首页专项说明 |
| `docs/P2_P4_COMBINED_RESULT_PAGE.md` | P2/P4 统一结果页专项说明 |
| `backend/README.md` | 后端启动、接口、测试说明 |
| `database/mysql/README.md` | MySQL 建库和 seed 脚本说明 |

## 当前数据库状态

- 本地开发和自动化测试仍走 SQLite：`backend/data/gaokao_h5_dev.sqlite3` 或 `GAOKAO_H5_DB_PATH`。
- MySQL 建库脚本已准备在 `database/mysql/`，可通过 `scripts/prepare_mysql.py` dry-run 或执行。
- 线上切 MySQL 前，需要把后端运行时连接层从 `sqlite3` 适配到 MySQL 驱动；当前 MySQL 脚本负责建表和基础配置，不会影响本地 SQLite 测试。
