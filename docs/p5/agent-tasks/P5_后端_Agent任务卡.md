# P5 后端 Agent 任务卡

> 页面名称：P5 手机号领券弹窗 / 优惠券领取承接层  
> 当前口径：`POST /api/benefit/claim` 必须接收并保存手机号，生成 `claim_token` 给小程序承接。

## 任务目标

为 P5 提供手机号领券能力，确保活动后端可保存用户手机号、生成领取记录、返回小程序承接 token，并为后续商城指定客户发券预留字段。

## 接口改造

### POST /api/benefit/claim

用途：提交手机号并领取当前抽签结果绑定的优惠券。

请求体：

| 字段 | 必填 | 说明 |
|---|---|---|
| `session_token` | 是 | H5 会话 token |
| `draw_id` | 是 | 抽签记录 ID |
| `reward_code` | 是 | 奖励编码 |
| `mobile` | 是 | 用户输入手机号 |
| `claim_channel` | 否 | 默认 `h5` |

校验规则：

1. `session_token` 必须有效。
2. `draw_id` 必须属于当前用户。
3. `reward_code` 必须与本次抽签结果绑定，绑定来源为 `draw_record.result_summary_json.reward_code` / `rewardCode`。
4. `mobile` 必须符合手机号格式。
5. 同一用户、同一 draw、同一 reward 重复提交时幂等返回已有记录，不重复发券。
6. 如果重复提交手机号不同，建议返回已有领取记录，同时保留首次领取手机号；如业务要求允许覆盖，需单独确认。

P5 固定券规则：后端在 `POST /api/draw/execute` 创建 draw 时从 `coupon_10`、`coupon_20`、`coupon_30`、`discount_9`、`discount_75` 五张券中确定本次券；同一 `draw_id` 后续查询、打开 P5、claim 都必须使用这一张券。P5 券图优先级为 `reward_config.ext_json.p5_image_url`、`activity_asset_config.fallback_url`、`reward_config.reward_image_url`。

响应体必须包含：

| 字段 | 说明 |
|---|---|
| `claim_id` | 领取记录主键 |
| `claim_no` | 领取单号 |
| `claim_token` | 小程序承接 token |
| `claim_status` | `claimed/pending/failed` |
| `receiver_mobile_masked` | 脱敏手机号 |
| `coupon_issue_status` | 商城发券状态 |
| `reward` | 券信息 |
| `action` | 小程序承接动作 |

### GET /api/benefit/claim/result

用途：H5 根据 `claim_no` 查询领取结果。

### GET /api/benefit/claim/resolve

用途：后续给小程序用 `claim_token` 解析领取记录。

返回信息建议包括：

1. `claim_no`
2. `reward_code`
3. `receiver_mobile`
4. `receiver_mobile_masked`
5. `coupon_issue_status`
6. `external_coupon_id`
7. `external_member_id`

该接口需要根据小程序鉴权能力再确认是否开放给 H5 同域、服务端或小程序后端。

## 数据库改造

`reward_claim_record` 新增字段：

| 字段 | 类型建议 | 说明 |
|---|---|---|
| `receiver_mobile` | varchar(32) / TEXT | 手机号明文，活动后端使用 |
| `receiver_mobile_masked` | varchar(32) / TEXT | 脱敏手机号 |
| `claim_token` | varchar(128) / TEXT | 小程序承接 token，唯一 |
| `coupon_issue_status` | varchar(16) / TEXT | `pending/success/failed` |
| `external_coupon_id` | varchar(128) / TEXT | 商城券记录 ID |
| `external_member_id` | varchar(128) / TEXT | 商城会员 ID |
| `coupon_issue_error` | varchar(512) / TEXT | 发券失败原因 |

索引建议：

1. `UNIQUE(activity_code, claim_token)`
2. `INDEX(activity_code, receiver_mobile)`
3. `INDEX(activity_code, coupon_issue_status, created_at)`

## 小程序承接规则

后端返回 action 示例：

```json
{
  "button_text": "去领取",
  "type": "mini_program_coupon_package",
  "target": "/pages/coupon-package/index?claim_token=ct_xxx&claim_no=CL202605210001"
}
```

禁止返回：

```text
/pages/coupon-package/index?mobile=13812345678
```

## 发券状态

当前阶段可先落库：

| 状态 | 含义 |
|---|---|
| `pending` | 已保存手机号，等待商城发券或后续联调 |
| `success` | 商城发券成功 |
| `failed` | 商城发券失败 |

如果暂未接商城接口，`coupon_issue_status` 默认 `pending`，`claim_status` 可为 `success/claimed`，表示活动侧领取成功。

## 验收标准

1. 缺少手机号返回 400。
2. 手机号格式错误返回 400。
3. 正确手机号能写入 `reward_claim_record`。
4. 返回 `claim_token`。
5. action 中不包含手机号明文。
6. 重复提交不重复新增领取记录。
7. P6 只读取领取成功记录。
