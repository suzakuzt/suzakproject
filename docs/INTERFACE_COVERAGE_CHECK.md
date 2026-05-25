# 前后端接口清单

前端统一从 `src/api/activityApi.js` 请求 `/api`。本地 Vite 将 `/api` 代理到 `http://127.0.0.1:8000`。

## 1. 页面接口覆盖

| 页面 | 前端动作 | 接口 | 主要落表/读表 |
| --- | --- | --- | --- |
| P1 首页 | 初始化会话 | `POST /api/h5/session/create` | `activity_user`、`activity_session`、`user_daily_state` |
| P1 首页 | 恢复状态 | `GET /api/activity/state` | `user_daily_state`、`grand_prize_qualification` |
| P1 首页 | 抽签 | `POST /api/draw/execute` | `draw_record`、`draw_chance_log`、`checkin_record` |
| P1 首页 | 分享加次数 | `POST /api/share/record` | `share_record`、`draw_chance_log`、`user_daily_state` |
| P2/P4 结果页 | 结果补偿查询 | `GET /api/draw/result/detail` | `draw_record`、`draw_result_config`、`reward_config` |
| P2/P4 结果页 | AI 解签卷轴 | `GET /api/explain/detail` | `draw_record`、`product_recommend_config`、`reward_claim_record` |
| P2/P4 结果页 | 海报弹窗保存 | `POST /api/poster/save` | 图片文件落 `backend/data/posters` 或 `GAOKAO_H5_POSTER_DIR` |
| P5 领券 | 提交手机号领券 | `POST /api/benefit/claim` | `reward_claim_record` |
| P5/小程序承接 | 解析领取凭证 | `GET /api/benefit/claim/resolve` | `reward_claim_record`、`reward_config` |
| P6 我的奖励 | 奖励中心 | `GET /api/reward/center/detail` | `reward_claim_record`、`grand_prize_qualification`、`reward_config` |
| P7 规则 | 规则和企微码 | `GET /api/activity/rules/detail` | `activity_config`、`activity_asset_config` |
| P8 大奖资格 | 资格详情 | `GET /api/grand-prize/qualification/detail` | `grand_prize_qualification`、`checkin_record`、`share_assist_record` |
| 全局 | 埋点 | `POST /api/tracking/event` | `tracking_event` |
| 全局 | 运行监控 | `POST /api/tracking/event` | `tracking_event` |

好友助力不是单独接口完成。好友带 `share_token` 创建会话后，完成 `POST /api/draw/execute` 时，后端自动写 `share_assist_record` 并刷新原用户大奖资格。

## 2. 接口契约

| 接口 | 入参 | 返回重点 | 说明 |
| --- | --- | --- | --- |
| `GET /api/health` | 无 | 数据库路径、表数量、seed 摘要 | 健康检查 |
| `POST /api/h5/session/create` | `activity_code`、`user_key`、`openid`、`unionid`、`external_user_id`、`source_page`、`source_channel`、`share_token` | `session_token`、`user`、`session`、`daily_state`、`progress` | 创建/恢复活动会话 |
| `GET /api/activity/state` | `session_token` | `daily_state`、`progress` | 状态补偿查询 |
| `POST /api/draw/execute` | `session_token`、`source` | `draw_id`、`draw_no`、`result`、`daily_state`、`checkin`、`progress` | 扣机会、固定签文和券 |
| `GET /api/draw/result/detail` | `session_token`、`draw_id` 或 `result_code` | `draw_id`、`result`、`explainLines`、`product`、`benefit`、`ai` | 当前复用 AI 详情服务 |
| `GET /api/explain/detail` | `session_token`、`draw_id` 或 `result_code` | AI 文案、商品、福利、当前券 | P2/P4 AI 卷轴数据源 |
| `POST /api/benefit/randomize` | `session_token`、`draw_id`、`exclude_reward_code` | 当前 draw 固定券 | 旧入口兼容，不重新随机 |
| `POST /api/benefit/claim` | `session_token`、`draw_id`、`reward_code`、`mobile`、`claim_channel` | `claim_token`、`claim_no`、`action` | 校验手机号并领取本次绑定券 |
| `GET /api/benefit/claim/result` | `session_token`、`claim_no` | 领取结果 | H5 结果查询 |
| `GET /api/benefit/claim/resolve` | `claim_token` | 领取记录和券信息 | 小程序券包承接 |
| `POST /api/share/record` | `session_token`、`share_channel` | `share_token`、`share_url`、`daily_state` | 每日最多加 3 次机会 |
| `POST /api/poster/save` | `session_token`、`page_code`、`poster_type`、`draw_id`、`sign_text`、`image_data_url` | `saved`、`poster_id`、`poster_url`、`byte_size` | 保存海报弹窗生成的 PNG，后端只落文件和返回 URL |
| `GET /api/poster/image/{poster_id}` | `poster_id` | PNG 图片 | 读取已保存海报，前端可用于弹窗预览和长按保存 |
| `GET /api/reward/center/detail` | `session_token` | `claimed_rewards`、`display_rewards`、`gift_reward`、`product_recommend`、`progress` | P6 我的奖励 |
| `GET /api/grand-prize/qualification/detail` | `session_token` | `qualified`、`qualify_status`、`shared_count`、`lit_days`、`qualification`、`hero`、`benefits`、`wechat_group` | P8 大奖资格 |
| `GET /api/activity/rules/detail` | `activity_code` | `page_title`、`subtitle`、`rules`、`wechat_group` | P7 活动规则 |
| `POST /api/tracking/event` | `session_token` 或 `activity_code`、`page_code`、`event_name`、`event_payload`、`client_time` | `success`、`event_id` | 行为埋点 |

运行监控也复用 `POST /api/tracking/event`，事件包括 `runtime_page_node_missing`、`runtime_resource_load_error`、`runtime_console_warning`、`runtime_console_error`、`runtime_unhandled_error`、`runtime_unhandled_rejection`。

## 3. 暂不新增的接口

| 需求 | 当前处理 | 后续接口建议 |
| --- | --- | --- |
| 真实发券 | H5 写 `reward_claim_record` 并返回跳转动作 | 小程序/商城侧用 `claim_token` 调券包接口 |
| 手机端一键保存相册 | H5 生成图后展示预览，用户长按保存；桌面浏览器尝试下载 | 小程序/企微 WebView 接 `wx.saveImageToPhotosAlbum` 或宿主 App bridge |
| MySQL 运行时 | 当前 FastAPI 仍使用 `sqlite3` | 新增 MySQL repository/connection adapter |

## 4. 前端接口入口

| 方法 | 文件 |
| --- | --- |
| `activityApi` | `src/api/activityApi.js` |
| 页面状态和业务动作 | `src/composables/useP1Activity.js` |
| 页面渲染 | `src/App.vue` |

## 5. 回归检查

```powershell
npm test
python -m unittest discover backend.tests -v
```
