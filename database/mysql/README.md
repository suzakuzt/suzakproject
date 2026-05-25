# MySQL 脚本说明

这套脚本用于上线前准备 MySQL 库。它不会改变当前 SQLite 本地测试流程。

## 1. 脚本顺序

| 顺序 | 文件 | 说明 |
| --- | --- | --- |
| 1 | `001_init_activity_tables.sql` | 创建 16 张活动业务表 |
| 2 | `002_seed_basic_mock_config.sql` | 灌入基础活动配置、签文、产品、券、二维码 |

`001_init_activity_tables.sql` 已包含 SQLite 后续迁移中的关键字段：每日状态、签文快照、手机号领取、claim_token、发券状态、大奖资格快照等。

## 2. 推荐执行方式

先 dry-run：

```powershell
$env:GAOKAO_H5_MYSQL_HOST="127.0.0.1"
$env:GAOKAO_H5_MYSQL_PORT="3306"
$env:GAOKAO_H5_MYSQL_USER="root"
$env:GAOKAO_H5_MYSQL_PASSWORD="your-password"
$env:GAOKAO_H5_MYSQL_DATABASE="gaokao_h5"
python scripts/prepare_mysql.py
```

确认输出 SQL 和库名无误后执行：

```powershell
python scripts/prepare_mysql.py --execute
```

也可以手动进入 MySQL 后执行：

```sql
SOURCE database/mysql/001_init_activity_tables.sql;
SOURCE database/mysql/002_seed_basic_mock_config.sql;
```

## 3. 环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `GAOKAO_H5_MYSQL_HOST` | `127.0.0.1` | MySQL 地址 |
| `GAOKAO_H5_MYSQL_PORT` | `3306` | MySQL 端口 |
| `GAOKAO_H5_MYSQL_USER` | `root` | 用户名 |
| `GAOKAO_H5_MYSQL_PASSWORD` | 空 | 密码，建议用环境变量传 |
| `GAOKAO_H5_MYSQL_DATABASE` | `gaokao_h5` | 目标库名 |
| `GAOKAO_H5_MYSQL_CLIENT` | `mysql` | mysql 客户端命令 |

## 4. 当前约定

- 字符集使用 `utf8mb4`。
- 表数量为 16 张，与当前活动业务口径一致。
- seed 包含 4 个 P2/P4 牛肉产品和 5 个 P5 优惠券配置。
- 后端运行时当前仍使用 SQLite。上线切 MySQL 前，需要完成 MySQL 连接适配并跑接口冒烟。

## 5. 脚本测试

```powershell
python -m unittest backend.tests.test_prepare_mysql -v
python scripts/prepare_mysql.py
```
