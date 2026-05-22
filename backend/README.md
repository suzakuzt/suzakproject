# H5 活动 Python 后端

当前后端使用 FastAPI + SQLite，目标是支撑高考 H5 活动首轮完整流程。

## 启动

```powershell
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

默认数据库：

```txt
backend/data/gaokao_h5_dev.sqlite3
```

临时切换数据库：

```powershell
$env:GAOKAO_H5_DB_PATH="D:\path\to\gaokao_h5_dev.sqlite3"
```

## 已接入接口

| 接口 | 用途 |
| --- | --- |
| `GET /api/health` | 健康检查、数据库和 seed 配置摘要 |
| `POST /api/h5/session/create` | 创建 H5 会话，记录分享来源 |
| `GET /api/activity/state` | 获取用户每日机会、分享和点亮进度 |
| `POST /api/draw/execute` | 执行抽签，扣减机会，并自动记录当天点亮 |
| `GET /api/draw/result/detail` | 获取抽签结果详情 |
| `GET /api/explain/detail` | 获取 P4 AI 解签详情、商品和福利状态 |
| `POST /api/benefit/claim` | 领取优惠券福利；P5 最新口径要求携带并保存手机号，生成 `claim_token` |
| `GET /api/benefit/claim/result` | 查询领取结果 |
| `GET /api/benefit/claim/resolve` | 小程序通过 `claim_token` 解析领取记录 |
| `POST /api/share/record` | 记录分享行为，并按每日上限发放额外抽签机会 |
| `GET /api/reward/center/detail` | 获取 P6 我的奖励、进度、985 状态、精选好物 |
| `GET /api/grand-prize/qualification/detail` | 获取 P8 抽奖编号、开奖状态、企微二维码 |
| `GET /api/activity/rules/detail` | 获取 P7 活动规则 |
| `POST /api/tracking/event` | 接收前端埋点 |

分享助力说明：好友通过 `share_token` 创建会话后，完成 `draw/execute` 时，后端会自动给原用户增加 1 个助力人数。

## 测试

```powershell
python -m unittest discover backend.tests -v
```

测试覆盖数据库连接、seed 配置、健康检查，以及主流程接口：

1. 创建会话和活动状态。
2. 抽签扣机会并自动点亮 1 天。
3. 分享每日最多增加 3 次额外机会。
4. P4 领取按 `draw_id` 幂等：同一次抽签不能重复发券，不同抽签可以再次领取同券码。
5. P6 展示 `display_rewards`：已领取券显示「去领取」，重复券按多张卡展示，未领取券显示「未领取」，985 礼盒永远最后展示。
6. 好友助力满 5 人后解锁 985 礼盒资格。
7. 规则、解签、埋点接口可用。

## P5 手机号领券

P5 已更新为手机号领券弹窗。当前后端已强制校验 `mobile`，`reward_claim_record` 已保存 `receiver_mobile`、`receiver_mobile_masked`、`claim_token`、`coupon_issue_status` 等字段；`POST /api/benefit/claim` 会返回带 `claim_token` / `claim_no` 的小程序券包承接地址，且不会在 action 中暴露手机号明文。

P5 券在 `POST /api/draw/execute` 生成 `draw_record` 时即固定写入当前 `draw_id` 的 `result_summary_json.reward_code` / `rewardCode`。当前券池包含 5 张券：`coupon_10`、`coupon_20`、`coupon_30`、`discount_9`、`discount_75`；同一 `draw_id` 反复打开 P5 不会换券，只有重新抽签生成新 `draw_id` 才会重新分配。`POST /api/benefit/randomize` 仅作为旧入口兼容，返回当前 draw 固定券，不重新绑定、不排除、不重掷；`POST /api/benefit/claim` 会校验传入 `reward_code` 必须等于 draw 固定券。P5 券图由配置返回，优先级为 `reward_config.ext_json.p5_image_url`、`activity_asset_config.fallback_url`、`reward_config.reward_image_url`；替换券图时改配置即可，不需要改前端。

## P4 AI 解签 DeepSeek 配置

后端会优先读取系统环境变量，也会读取 `backend/.env` 和 `backend/.env.local`。可从 `backend/.env.example` 复制一份：

```powershell
Copy-Item backend/.env.example backend/.env
```

然后填写：

```txt
DEEPSEEK_API_KEY=你的 DeepSeek API Key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_REASONING_EFFORT=high
DEEPSEEK_TIMEOUT_SECONDS=45
DEEPSEEK_MAX_TOKENS=220
```

P4 `/api/explain/detail` 会通过后端代理调用 DeepSeek `/chat/completions`，前端不接触 API Key。接口返回 `explainLines`、`thinkingProcess`、`themeText` 和 `ai.promptVersion` 等字段；未配置 Key 或接口异常时，会保留本地兜底签文，页面仍可正常展示。
