# P8 埋点 Agent 任务卡

## 任务名称

实现 P8 大奖资格确认页的页面曝光、资格展示、开奖状态、企微二维码、返回和异常埋点。

## 页面定位

P8 是用户达标后的关键转化页，需要确认用户是否看到抽奖资格、是否看到开奖状态、是否看到企微二维码承接。

## 必须覆盖事件

| 事件名 | 触发时机 | 关键参数 |
|---|---|---|
| grand_prize_page_view | 进入 P8 页面 | activity_id、session_id、source_page、qualify_type |
| grand_prize_render_success | P8 渲染成功 | activity_id、session_id、lottery_no、lottery_status、has_qrcode |
| grand_prize_render_fail | 接口失败或渲染失败 | activity_id、session_id、error_code、error_msg |
| grand_prize_not_qualified_view | 未达标用户误入 P8 | activity_id、session_id、shared_count、lit_days |
| grand_prize_back_click | 点击返回按钮 | activity_id、session_id、source_page、fallback_used |
| grand_prize_status_exposure | 开奖状态卡曝光 | activity_id、session_id、lottery_no、lottery_status |
| grand_prize_qrcode_exposure | 企微二维码曝光 | activity_id、session_id、qrcode_id、lottery_no |
| grand_prize_qrcode_click | 点击二维码预览时触发 | activity_id、session_id、qrcode_id、lottery_no |
| grand_prize_qrcode_load_fail | 二维码加载失败 | activity_id、session_id、qrcode_id、error_code、error_msg |
| grand_prize_result_refresh | 用户重新进入或刷新开奖结果 | activity_id、session_id、lottery_no、lottery_status |

## 参数要求

1. activity_id：活动 ID；
2. session_id：当前用户会话 ID；
3. source_page：来源页面，重点区分 p6_reward_center；
4. qualify_type：checkin_7_days / invite_5_friends / mixed；
5. lottery_no：抽奖编号，未生成时传空并带 error_code；
6. lottery_status：pending / drawing / won / not_won / expired；
7. qrcode_id：企微二维码配置 ID；
8. fallback_used：返回无历史栈时是否使用兜底跳转。

## 验收要求

1. 页面进入后触发 grand_prize_page_view；
2. 数据加载成功后触发 grand_prize_render_success；
3. 数据加载失败触发 grand_prize_render_fail；
4. 未达标误入触发 grand_prize_not_qualified_view；
5. 开奖状态卡进入可视区域触发 grand_prize_status_exposure；
6. 企微二维码进入可视区域触发 grand_prize_qrcode_exposure；
7. 二维码加载失败触发 grand_prize_qrcode_load_fail；
8. 点击返回触发 grand_prize_back_click；
9. 事件不能重复刷屏，同一曝光事件同一页面生命周期内只触发一次。
