# P2 埋点 Agent 任务卡

# 项目背景

项目：高考考运摇签 + 牛肉福利领取 H5 活动  
页面：P2 今日考运签结果页 / 解签入口页

## 你的角色

你是本项目的埋点 Agent，只负责 P2 页面曝光、点击、解签、海报生成和异常事件埋点。

## 埋点事件清单

| 事件名 | 触发时机 | 关键参数 |
|---|---|---|
| result_page_view | 进入 P2 结果页 | activity_id、session_id、draw_id、sign_type、sign_level |
| result_page_render_success | 页面渲染完成 | session_id、draw_id |
| ask_xiaopu_click | 点击「问小璞」 | session_id、draw_id、sign_type、sign_level |
| explain_load_success | 解签内容返回成功 | session_id、draw_id |
| explain_load_fail | 解签内容返回失败 | session_id、draw_id、error_code、error_msg |
| share_poster_click | 点击「点击分享海报」 | session_id、draw_id |
| share_poster_generate_success | 海报生成成功 | session_id、draw_id、poster_id |
| share_poster_generate_fail | 海报生成失败 | session_id、draw_id、error_code、error_msg |
| result_page_load_error | P2 结果页加载失败 | session_id、draw_id、error_code、error_msg |

## 必须覆盖

1. P2 结果页首次曝光；
2. 页面渲染成功；
3. 点击问小璞；
4. 解签成功 / 失败；
5. 点击分享海报；
6. 海报生成成功 / 失败；
7. 结果页加载失败。

## 验收标准

1. 每个关键节点均有唯一事件名；
2. session_id 与 draw_id 能贯穿关键行为；
3. 成功和失败事件区分明确；
4. 便于后续分析问小璞点击率、解签成功率、海报点击率、海报生成成功率。
