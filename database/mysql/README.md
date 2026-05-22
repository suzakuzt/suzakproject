# MySQL 脚本说明

这套脚本用于后续从当前 SQLite 开发库迁移到 MySQL 时建表和灌入最小活动配置。

执行顺序：

```sql
SOURCE database/mysql/001_init_activity_tables.sql;
SOURCE database/mysql/002_seed_basic_mock_config.sql;
```

当前约定：

- 字符集使用 `utf8mb4`。
- 结构与 SQLite 当前 16 张表保持同一业务口径。
- `002_seed_basic_mock_config.sql` 已包含 P5 五张普通优惠券 `coupon_10`、`coupon_20`、`coupon_30`、`discount_9`、`discount_75` 以及对应 P5 券图资源配置；线上替换图片时优先改 `activity_asset_config.fallback_url` 或 `reward_config.ext_json.p5_image_url`。
- 迁移真实服务前，还需要把后端数据库连接层从 SQLite 适配到 MySQL 驱动。
