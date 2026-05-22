# P8 后端 Agent 任务卡

## 任务名称

提供 P8 大奖资格确认页所需的资格详情、抽奖编号、开奖状态和企微二维码数据。

## 页面定位

P8 不负责前端开奖，只展示后端返回的大奖资格和开奖状态。后端必须保证 P8 与 P6 的达标逻辑一致。

## 必须实现 / 确认

1. 根据用户 activity_id / session_id / openid 查询是否达标；
2. 达标规则与 P6 保持一致：分享 5 个好友或累计点亮 7 天，满足任一即可；
3. 用户达标后返回唯一抽奖编号 lottery_no；
4. 抽奖编号由后端生成并持久化，不能每次进入页面变化；
5. 返回 qualify_type、qualify_desc、hero.title、hero.subtitle，支持不同达标方式文案；
6. 返回开奖状态 lottery_status，包括 status、status_text、draw_time_desc、publicity_desc；
7. 返回企微二维码 qrcode_url、qrcode_id 和扫码权益说明；
8. 未达标用户访问 P8 时返回 qualified=false 和回退 action；
9. 支持开奖后更新状态为 won / not_won，并返回对应结果说明；
10. 返回埋点所需 activity_id、session_id、lottery_no、qualify_type、lottery_status 等参数。

## 接口建议

### GET /api/grand-prize/qualification/detail

进入 P8 时调用，用于返回资格详情。

建议返回字段：

```json
{
  "activity_id": "gaokao_lucky_sign_2026",
  "session_id": "string",
  "qualification": {
    "qualified": true,
    "qualify_type": "checkin_7_days",
    "qualify_desc": "恭喜你已完成7天打卡",
    "prize_title": "985和牛礼盒抽奖资格",
    "lottery_no": "KY202406-0038"
  },
  "hero": {
    "title": "连续打卡7天\n大奖资格已解锁",
    "subtitle": "牛气大奖资格已确认"
  },
  "lottery_status": {
    "status": "pending",
    "status_text": "待开奖",
    "draw_time_desc": "活动结束后3个工作日内统一开奖",
    "publicity_desc": "开奖后将在此更新"
  },
  "wechat_group": {
    "qrcode_id": "wecom_gaokao_2026",
    "qrcode_url": "string",
    "title": "扫码添加企微领取",
    "benefits": ["领取50元券", "接收礼盒开奖通知", "查看中奖结果"]
  }
}
```

### GET /api/grand-prize/result

可选。开奖后进入 P8 或刷新结果时使用。

## 关键规则

1. 不允许前端生成 lottery_no；
2. 不允许 P6 显示达标但 P8 返回未达标，除非用户状态过期或异常，并需要明确错误码；
3. 通过邀请 5 人达标时，hero.title 不要返回「连续打卡7天」；
4. 二维码需要可运营替换，避免前端重新发版；
5. 开奖状态需要可更新，不能只支持待开奖。

## 异常返回建议

1. 未达标：返回 qualified=false、reason_code、reason_text、fallback_action；
2. 编号生成失败：返回明确错误码，前端展示「抽奖编号生成中，请稍后刷新」；
3. 二维码未配置：返回 qrcode_url 为空，并返回兜底说明；
4. 状态未知：返回 pending 兜底状态，并记录后端日志。
