# P6 埋点 Agent 任务卡 v1.1

你是本项目的 **埋点 Agent**。

## 当前任务

为 P6 我的奖励页补齐页面曝光、进度、奖励、985 资格、商品推荐、按钮跳转和异常埋点。

---

## 必须覆盖事件

| 事件名 | 触发时机 | 关键参数 |
|---|---|---|
| reward_center_page_view | 进入 P6 | activity_id、session_id、source_page |
| reward_center_render_success | P6 渲染成功 | shared_count、share_target、lit_days、light_target、claimed_reward_count、gift_status |
| reward_center_load_fail | P6 加载失败 | error_code、error_msg |
| progress_module_exposure | 考运进度模块曝光 | shared_count、share_target、lit_days、light_target、gift_status |
| reward_card_exposure | 每张奖励卡曝光 | reward_id、reward_type、reward_status、index、is_gift |
| reward_use_click | 点击券类奖励「去领取」或 985 达标「去使用」 | reward_id、reward_type、reward_status、action_type、action_target |
| reward_not_qualified_click | 点击 985 未达标卡或未达标按钮 | shared_count、share_target、lit_days、light_target |
| reward_use_redirect_success | 奖励跳转成功 | reward_id、reward_type、action_type、action_target |
| reward_use_redirect_fail | 奖励跳转失败 | reward_id、reward_type、action_type、error_code、error_msg |
| product_recommend_exposure | 精选好物推荐曝光 | product_id、product_title |
| product_recommend_click | 点击「去看看」 | product_id、action_type、action_target |
| product_recommend_redirect_fail | 商品详情跳转失败 | product_id、error_code、error_msg |
| draw_again_click | 点击「再抽一次」 | target_page |
| activity_rules_click | 点击「活动规则」 | source_page、target_page |
| reward_center_back_click | 点击返回 | source_page、fallback_to_home |

---

## 参数要求

1. 分享进度必须上报 `shared_count` 和 `share_target`。
2. 点亮进度必须上报 `lit_days` 和 `light_target`。
3. 985 礼盒卡必须区分 `not_qualified` 和 `qualified`。
4. 奖励卡曝光只统计实际展示的卡：已领取券 + 985 礼盒卡。
5. 未领取券会展示为「未领取」，应产生奖励卡曝光，但不应产生可用券使用点击。
6. 券类奖励跳转 action_type 应为 `mini_program_coupon_package`。
7. 商品推荐跳转 action_type 应为 `mini_program_product_detail`。
8. 再抽一次 target_page 应为 P1 首页。
9. 活动规则 target_page 应为活动规则页。

---

## 验收场景

1. 首次进入 P6，触发页面曝光和渲染成功。
2. 分享 0/5、1/5、5/5，埋点参数正确。
3. 点亮 0 天、3 天、7 天，埋点参数正确。
4. 无已领取券时，只曝光 985 礼盒卡。
5. 已领取 2 张券 + 985，曝光 3 张卡。
6. 已领取 5 张券 + 985，曝光 6 张卡。
7. 985 未达标时，点击记录 `reward_not_qualified_click`。
8. 985 达标后，点击记录 `reward_use_click`。
9. 券类奖励跳券包页成功 / 失败都能记录。
10. 商品详情跳转点击和失败都能记录。
11. 再抽一次、活动规则、返回均有埋点。
