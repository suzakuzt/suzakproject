# P8 H5 前端 Agent 任务卡

## 任务名称

实现 P8 大奖资格确认页 / 985 和牛礼盒抽奖资格详情页 / 开奖状态页。

## 页面定位

P8 用于展示用户已解锁 985 和牛礼盒抽奖资格后的确认信息，包括达标文案、抽奖编号、开奖状态和企微二维码承接。正式路由为 `/activity/grand-prize`，入口来自 P6 达标后的 985 礼盒「去使用」。

## 必须实现

1. 按 P8 主设计稿还原深红背景、顶部大标题、资格确认卡、开奖状态卡、企微二维码模块；
2. 左上角返回按钮可点击，返回上一页，无历史栈时回 P6 我的奖励页；
3. 展示大奖资格状态、达标文案、奖品名称和抽奖编号；
4. 抽奖编号必须来自接口，前端不可本地生成；
5. 顶部主文案支持后端配置，避免邀请 5 人达标时仍写成「连续打卡7天」；
6. 展示三个权益说明：50元券企微领取、礼盒资格已解锁、开奖提醒企微通知；
7. 展示开奖状态卡，支持待开奖、开奖中、已中奖、未中奖等状态；
8. 展示企微二维码模块，二维码资源支持配置或接口返回；
9. 未达标用户误入时，不展示抽奖编号，提示返回 P6 查看进度；
10. 页面支持纵向滚动和不同机型安全区；
11. 接入 P8 相关埋点事件；
12. 当前页不出现抽签按钮、奖励列表、商品推荐、再抽一次按钮。

## 页面数据建议

页面进入时请求：`GET /api/grand-prize/qualification/detail`

需要字段：

- activity_id
- session_id
- qualified
- qualify_type
- qualify_desc
- hero.title
- hero.subtitle
- prize_title
- lottery_no
- benefits
- lottery_status.status
- lottery_status.status_text
- lottery_status.draw_time_desc
- lottery_status.publicity_desc
- wechat_group.qrcode_url
- wechat_group.benefits
- back_action

## 状态要求

1. loading：展示骨架或 loading，不出现空白页；
2. qualified + pending：展示待开奖状态；
3. qualified + drawing：展示开奖中状态；
4. qualified + won：展示中奖状态和中奖说明；
5. qualified + not_won：展示未中奖状态和感谢参与说明；
6. not qualified：展示未达标提示并引导返回 P6；
7. error：展示加载失败提示，支持重试或返回 P6；
8. qrcode fail：展示二维码加载失败占位。

## 埋点要求

必须触发：

- grand_prize_page_view
- grand_prize_render_success
- grand_prize_render_fail
- grand_prize_not_qualified_view
- grand_prize_back_click
- grand_prize_status_exposure
- grand_prize_qrcode_exposure
- grand_prize_qrcode_load_fail

如果支持二维码点击预览，额外触发：

- grand_prize_qrcode_click

## 自测要求

1. 从 P6 达标后的 985 礼盒「去使用」进入 P8；
2. 直接访问 P8 时正常处理无历史栈返回；
3. 抽奖编号展示接口返回值；
4. 待开奖 / 开奖中 / 已中奖 / 未中奖状态都可渲染；
5. 未达标用户不展示虚假抽奖编号；
6. 二维码加载失败时有兜底提示；
7. 小屏手机页面可滚动，不裁切二维码和编号；
8. 页面不出现 P6 的奖励列表、商品推荐和再抽一次按钮。
