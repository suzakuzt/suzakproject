# H5 活动文档总入口

> 更新时间：2026-05-21  
> 当前阶段：本地 SQLite、FastAPI、Vue H5 主链路已跑通；P5 已完成「手机号领券弹窗」前后端改造，领券接口会保存手机号、脱敏手机号、`claim_no`、`claim_token` 和发券状态。

## 当前范围

| 模块 | 当前状态 | 说明 |
| --- | --- | --- |
| SQLite 数据库 | 已补齐 | 本地库 `backend/data/gaokao_h5_dev.sqlite3` 可跑通主流程；P5 手机号和 `claim_token` 字段已有迁移脚本 |
| MySQL 脚本 | 已补齐 | `database/mysql/` 与 SQLite 保持同一业务结构；P5 新字段已同步到建表脚本 |
| FastAPI 后端 | 已接入 | 已覆盖会话、抽签、解签、手机号领券、奖励中心、规则、985 资格、埋点 |
| Vue H5 前端 | 已接入 | 正式访问路由使用 `/activity/...`；P5 已从成功提示浮层改为手机号输入弹窗 |
| 小程序承接 | 待联调 | 券包页和商品详情页需要小程序 WebView 环境验证；领券跳转只传 `claim_token` / `claim_no`，不传手机号明文 |

## 本地启动

后端：

```powershell
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

前端：

```powershell
npm run dev -- --host 127.0.0.1 --port 5173
```

本地入口：

```txt
http://127.0.0.1:5173/activity/home
```

接口文档：

```txt
http://127.0.0.1:8000/docs
```

## 测试命令

```powershell
python -m unittest discover backend.tests -v
npm test
npm run build
```

## 必读文档

| 顺序 | 文档 | 用途 |
| --- | --- | --- |
| 1 | `docs/README.md` | 当前状态、启动方式、文档入口 |
| 2 | `docs/INTERFACE_COVERAGE_CHECK.md` | 前后端接口、埋点、当前覆盖状态 |
| 3 | `docs/DATABASE_SCHEMA_DESIGN.md` | 数据库结构、P5 手机号领券字段、SQLite/MySQL 同步口径 |
| 4 | `docs/P1_FRONTEND_INTERFACE_CHECK.md` | 页面路由、按钮跳转、前端请求总检查 |
| 5 | `docs/p5/P5_手机号领券弹窗确认版_Agent交付卡_v1.1.md` | P5 最新业务确认版 |
| 6 | `backend/README.md` | 后端接口、测试和运行方式 |
| 7 | `database/mysql/README.md` | MySQL 迁移脚本说明 |

## 页面命名

| 业务页面 | 代码页面 | 本地预览 URL | 当前定位 |
| --- | --- | --- | --- |
| 活动首页 | `home` | `/activity/home` | P1 入口页 |
| 抽签结果 | `p2` | `/activity/result` | 今日考运签结果 |
| AI 解签 | `p4` | `/activity/explain` | 解签结果和福利入口 |
| 手机号领券弹窗 | P4 内弹窗 | 无独立页面 | P5，输入手机号后提交领券 |
| 我的奖励 | `p6` | `/activity/rewards` | 展示已领取和未领取奖励状态 |
| 活动规则 | `rules` | `/activity/rules` | P7 规则页 |
| 985 资格 | `p8` | `/activity/grand-prize` | P8 大奖资格确认页 |

兼容说明：`?page=p1/p2/p4/p6/p7/p8` 只用于早期截图预览兼容；正式测试和对外访问统一使用 `/activity/...` 路由。

## P5 最新领券口径

1. P4 点击「领取专属福利」只打开 P5 手机号领券弹窗，不直接调用领券接口。
2. P5 展示手机号输入框、优惠券卡和「去领取」按钮。
3. 用户必须输入合法手机号后，前端才调用 `POST /api/benefit/claim`。
4. 后端保存手机号、脱敏手机号、领取单号 `claim_no`、领取凭证 `claim_token` 和发券状态。
5. 小程序承接使用 `claim_token` / `claim_no` 识别领取记录，不在 URL、埋点和普通日志中传手机号明文。
6. 手机号保存 / 绑定成功后，H5 不停留在“领取成功”弹窗内，直接按接口返回的 action 跳小程序券包 / 领券中心；用户在小程序登录后到领券中心查看可领取券。
7. P6 只有在领券接口成功后，才把该券视为已领取；未领取奖励仍展示为「未领取」。
8. P5 券在 `POST /api/draw/execute` 生成 `draw_record` 时即固定写入当前 `draw_id`，P5 轮换池包含 5 张券：`coupon_10`、`coupon_20`、`coupon_30`、`discount_9`、`discount_75`。同一 `draw_id` 反复打开 P5 不会换券，只有重新抽签生成新 `draw_id` 才会分配下一张券，避免用户通过反复打开弹窗刷更高券。
9. P5 券图走配置：后端优先返回 `reward_config.ext_json.p5_image_url`，其次返回 `activity_asset_config.fallback_url`，最后才用 `reward_config.reward_image_url`。前端只展示接口返回的 `reward.imageUrl` / `reward.image_url`，替换图片不需要改前端代码。

## 当前 P5 改造结果

| 位置 | 当前代码状态 | 说明 |
| --- | --- | --- |
| P4 按钮 | 点击后打开 P5 手机号弹窗 | 不直接调用领券接口 |
| `POST /api/benefit/randomize` | 兼容旧入口，返回当前 draw 固定券 | 不重新绑定、不排除、不重掷，防止刷券 |
| P5 浮层 | 手机号输入 + 去领取 | 提交成功后自动承接小程序券包，不停留成功态 |
| P5 券图 | 读取接口返回的 `reward.imageUrl` | 图片可通过 `activity_asset_config.fallback_url` 或 `reward_config.ext_json.p5_image_url` 替换 |
| `POST /api/benefit/claim` | `mobile` 必传并校验 | 返回 `claim_no` / `claim_token` |
| `reward_claim_record` | 已保存手机号、脱敏手机号、`claim_token`、发券状态 | SQLite/MySQL 脚本均已补齐 |
| 埋点 | 已新增手机号弹窗曝光、输入、提交、校验失败事件 | 不上传手机号明文 |

## 剩余事项

1. 小程序券包页使用 `claim_token` 解析领取记录的接口需要与商城/小程序确认。
2. 分享海报 `POST /api/poster/generate` 仍是二期能力，主流程稳定后再补。
3. 当前 seed 是最小配置，流程走通后再补全全量签文、优惠券、商品和图片配置。
