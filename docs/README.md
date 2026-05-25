# 系统总览和上线核对

本文保留当前项目上线需要看的主链路。详细接口见 `docs/INTERFACE_COVERAGE_CHECK.md`，数据库见 `docs/DATABASE_SCHEMA_DESIGN.md`。

## 1. 架构

```text
用户浏览器 / 小程序 WebView
  -> Vue H5: http://127.0.0.1:5173
  -> Vite /api 代理
  -> FastAPI: http://127.0.0.1:8000
  -> SQLite 本地库
```

当前后端运行时使用 SQLite。MySQL 建表和 seed 脚本已准备，切线上 MySQL 前还需要接入 MySQL 驱动和连接适配层。

## 2. 页面和业务流

| 页面 | 路由 | 主要行为 | 主要接口 |
| --- | --- | --- | --- |
| P1 首页 | `/activity/home` | 创建会话、展示机会、抽签、分享加次数、进入奖励/规则 | `POST /api/h5/session/create`、`POST /api/draw/execute`、`POST /api/share/record` |
| P2/P4 统一结果页 | `/activity/result` | 展示签文、真实牛肉图、AI 解签卷轴、分享保存、领取福利 | `GET /api/draw/result/detail`、`GET /api/explain/detail`、`POST /api/benefit/claim` |
| P5 领券弹窗 | 全局弹窗 | 手机号校验、领取本次 draw 固定券、跳券包 | `POST /api/benefit/claim`、`GET /api/benefit/claim/resolve` |
| P6 我的奖励 | `/activity/rewards` | 展示券、分享/点亮进度、再抽一次、进入大奖页 | `GET /api/reward/center/detail` |
| P7 活动规则 | `/activity/rules` | 展示规则、企微二维码、返回来源页 | `GET /api/activity/rules/detail` |
| P8 大奖资格 | `/activity/grand-prize` | 展示礼盒资格、抽奖编号、开奖状态、企微二维码 | `GET /api/grand-prize/qualification/detail` |

`/activity/explain` 目前兼容到 P2/P4 统一结果页，不再作为独立 P4 页面维护。

## 3. 主流程

```text
进入 P1
  -> createSession 创建/恢复用户和每日状态
  -> drawExecute 扣机会、生成 draw_record、固定签文和券
  -> 进入 P2/P4 统一结果页
  -> 用户可展开 AI 解签、保存分享图、领取专属福利
  -> claimBenefit 写 reward_claim_record
  -> P6 查看奖励中心
  -> 满足分享/点亮条件后进入 P8 查看大奖资格
```

分享助力流程：

```text
用户点击分享获取次数
  -> shareRecord 生成 share_token 并按每日上限加机会
好友带 share_token 进入
  -> createSession 记录来源
  -> 好友完成 drawExecute 后写 share_assist_record
  -> 刷新原用户 grand_prize_qualification
```

## 4. 关键数据表

| 模块 | 表 |
| --- | --- |
| 活动配置 | `activity_config`、`activity_asset_config` |
| 签文/商品/奖励配置 | `draw_result_config`、`product_recommend_config`、`reward_config` |
| 用户和会话 | `activity_user`、`activity_session`、`user_daily_state` |
| 抽签和机会 | `draw_record`、`draw_chance_log`、`checkin_record` |
| 分享和助力 | `share_record`、`share_assist_record` |
| 领券和大奖 | `reward_claim_record`、`grand_prize_qualification` |
| 埋点 | `tracking_event` |

## 5. 运行日志监控

右上角接口调试浮层已移除，页面不再显示“接口 POST 200”。运行期问题统一通过 `src/utils/runtimeMonitor.js` 监听并上报到 `POST /api/tracking/event`。

重点事件：

| 事件 | 说明 |
| --- | --- |
| `runtime_page_node_missing` | P1、P2/P4、P6、P7、P8 关键节点缺失 |
| `runtime_resource_load_error` | 图片、脚本、样式等资源加载失败 |
| `runtime_console_warning` | 前端 warning |
| `runtime_console_error` | 前端 error |
| `runtime_unhandled_error` | 未捕获 JS 异常 |
| `runtime_unhandled_rejection` | 未捕获 Promise 异常 |

详细口径见 `docs/RUNTIME_MONITORING.md`。

## 6. 上线核对

| 项 | 当前状态 | 上线前动作 |
| --- | --- | --- |
| 前端构建 | `npm run build` 可产出 `dist/` | 配置线上 CDN/静态服务和 `/api` 代理 |
| 后端接口 | FastAPI 接口已覆盖主流程 | 配置生产 CORS、日志、错误监控 |
| SQLite | 本地开发和测试可用 | 上线不建议继续使用单机 SQLite |
| MySQL 脚本 | `database/mysql/001`、`002` 已准备 | 先 dry-run，再执行；随后接 MySQL 运行时驱动 |
| AI 解签 | 未配置时有本地兜底文案 | 线上配置 AI Key、超时、降级策略 |
| 发券 | 当前写领取记录和跳转动作 | 对接真实券包/商城核销接口 |
| 海报保存 | 前端生成 PNG 后调用 `POST /api/poster/save` 落盘，返回 `poster_url`；移动端保留长按保存 | 生产配置 `GAOKAO_H5_POSTER_DIR` 到持久化目录 |

## 7. 必跑检查

```powershell
npm test
npm run build
python -m unittest discover backend.tests -v
python scripts/prepare_mysql.py
```
