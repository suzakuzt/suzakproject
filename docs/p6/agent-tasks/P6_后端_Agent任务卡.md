# P6 后端 Agent 任务卡 v1.1

你是本项目的 **后端开发 Agent**。

## 当前任务

只实现 P6 我的奖励页所需的聚合接口与状态判断能力。

---

## 业务规则

1. 用户完成有效分享后，后端记录分享人数。
2. 用户完成一次摇签后，后端记录为一次打卡 / 点亮；每天最多点亮 1 天。
3. P6 不负责写入分享或打卡，只读取后端已记录结果。
4. 985 礼盒资格达标条件：分享人数 >= 5，或累计点亮天数 >= 7，满足任一条件即可达标。
5. P6 需要返回 `display_rewards` 展示列表：已领取券显示「去领取」，未领取券显示「未领取」。
6. 普通奖励固定展示 5 个配置位，不因重复领取同券码而新增卡片；同类券已领取时可在 action 中使用最新一条领取记录的 `claim_token` / `claim_no`。
7. P6 奖励区最多 6 张卡：5 张普通奖励 + 固定最后一张 985 礼盒资格卡。
8. 985 礼盒卡必须始终返回，未达标返回「未达标」，达标返回「去使用」。
9. 券类奖励「去领取」跳小程序券包页。
10. 精选好物「去看看」跳具体商品详情页。
11. 再抽一次跳 P1 活动首页。
12. 活动规则跳活动规则独立页。

---

## 需要提供的接口

### 1. GET /api/reward/center/detail

进入 P6 时调用，返回奖励中心聚合数据。

必须返回：

1. `activity_id`
2. `session_id`
3. `progress.shared_count`
4. `progress.share_target`
5. `progress.lit_days`
6. `progress.light_target`
7. `progress.completed_days`
8. `progress.gift_qualified`
9. `progress.gift_status`
10. `claimed_rewards`
11. `display_rewards`
12. `gift_reward`
13. `product_recommend`
14. `draw_again_action`
15. `rules_action`

示例：

```json
{
  "activity_id": "gaokao_lucky_sign_2026",
  "session_id": "string",
  "progress": {
    "shared_count": 0,
    "share_target": 5,
    "lit_days": 3,
    "light_target": 7,
    "completed_days": [1, 2, 3],
    "gift_qualified": false,
    "gift_status": "not_qualified",
    "progress_desc": "分享5个好友，或累计点亮7天，赢取985和牛礼盒抽奖资格！"
  },
  "claimed_rewards": [],
  "display_rewards": [
    {
      "reward_id": "coupon_10",
      "reward_type": "coupon",
      "title": "10",
      "unit_text": "元",
      "desc": "无门槛券",
      "status": "unclaimed",
      "button_text": "未领取"
    },
    {
      "reward_id": "gift_985",
      "reward_type": "gift_lottery_qualification",
      "title": "985和牛礼盒",
      "desc": "抽奖资格",
      "status": "not_qualified",
      "button_text": "未达标"
    }
  ],
  "gift_reward": {
    "reward_id": "gift_985",
    "reward_type": "gift_lottery_qualification",
    "title": "985和牛礼盒",
    "desc": "抽奖资格",
    "status": "not_qualified",
    "button_text": "未达标",
    "action": {
      "type": "gift_qualification_detail",
      "target": ""
    }
  },
  "product_recommend": {
    "product_id": "sku_001",
    "title": "高考成功牛排",
    "subtitle": "精选谷饲西冷 鲜嫩多汁",
    "button_text": "去看看",
    "image_url": "string",
    "action": {
      "type": "mini_program_product_detail",
      "target": "/pages/product/detail?id=sku_001"
    }
  },
  "draw_again_action": {
    "button_text": "再抽一次",
    "action": {
      "type": "p1_home",
      "target": "/"
    }
  },
  "rules_action": {
    "button_text": "活动规则",
    "action": {
      "type": "activity_rules",
      "target": "/activity/rules"
    }
  }
}
```

### 2. 分享记录能力

用户完成有效分享后，记录分享人数，并保证 P6 能读取最新 `shared_count`。

### 3. 摇签打卡能力

用户完成摇签后，按用户和自然日去重记录打卡 / 点亮；每天最多点亮 1 天，并保证 P6 能读取最新 `lit_days` 和 `completed_days`。

### 4. 奖励使用点击能力

券类奖励点击「去领取」时，返回或确认小程序券包页跳转参数。

### 5. 商品推荐点击能力

精选好物点击「去看看」时，返回具体商品详情页跳转参数。

---

## 状态判断

| 状态 | 判断方式 | 返回 |
|---|---|---|
| 分享未达标 | shared_count < share_target | 继续判断点亮 |
| 分享达标 | shared_count >= share_target | gift_qualified = true |
| 点亮未达标 | lit_days < light_target | 继续判断分享 |
| 点亮达标 | lit_days >= light_target | gift_qualified = true |
| 985 未达标 | shared_count < 5 且 lit_days < 7 | gift_reward.status = not_qualified，button_text = 未达标 |
| 985 达标 | shared_count >= 5 或 lit_days >= 7 | gift_reward.status = qualified，button_text = 去使用 |
| 未领取券 | 用户未领取 | 不放入 `claimed_rewards`，放入 `display_rewards` 且 status = unclaimed、button_text = 未领取 |
| 已领取券 | 用户已领取 | 放入 `claimed_rewards`，同时在 `display_rewards` 中 status = unused、button_text = 去领取 |

---

## 交付结果

完成后请说明：

1. 新增 / 修改的接口；
2. 分享记录逻辑；
3. 摇签打卡记录逻辑；
4. 985 达标判断逻辑；
5. claimed_rewards 与 display_rewards 生成逻辑；
6. 券包页、商品详情页、P1 首页、活动规则页 action 返回规则；
7. mock 数据示例；
8. 联调注意事项。
