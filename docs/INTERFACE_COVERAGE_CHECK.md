# Interface Coverage Check

The frontend uses `src/api/activityApi.js` to call `/api`. Local Vite development proxies `/api` to `http://127.0.0.1:8000`; Linux release traffic goes through Nginx `/api/` to the local FastAPI process.

## Page Coverage

| Page | Frontend action | Endpoint | Main tables |
| --- | --- | --- | --- |
| P1 home | Create or restore session | `POST /api/h5/session/create` | `activity_user`, `activity_session`, `user_daily_state` |
| P1 home | Read activity state | `GET /api/activity/state` | `user_daily_state`, `grand_prize_qualification` |
| P1 home | Execute draw | `POST /api/draw/execute` | `draw_record`, `draw_chance_log`, `checkin_record` |
| P1 home | Record share | `POST /api/share/record` | `share_record`, `draw_chance_log`, `user_daily_state` |
| P2/P4 result | Result detail | `GET /api/draw/result/detail` | `draw_record`, `draw_result_config`, `reward_config` |
| P2/P4 result | AI explanation | `GET /api/explain/detail` | `draw_record`, `product_recommend_config`, `reward_claim_record` |
| P5 coupon claim | Claim by mobile | `POST /api/benefit/claim` | `reward_claim_record`, `coupon_issue_config` |
| P5/mini program | Resolve claim token | `GET /api/benefit/claim/resolve` | `reward_claim_record`, `reward_config` |
| P6 reward center | Reward center detail | `GET /api/reward/center/detail` | `reward_claim_record`, `grand_prize_qualification`, `reward_config` |
| P7 rules | Rules detail | `GET /api/activity/rules/detail` | `activity_config`, `activity_asset_config` |
| P8 grand prize | Qualification detail | `GET /api/grand-prize/qualification/detail` | `grand_prize_qualification`, `checkin_record`, `share_assist_record` |
| Global | Tracking/runtime monitoring | `POST /api/tracking/event` | `tracking_event` |

Friend assist is completed during `POST /api/draw/execute` when the session was created with a `share_token`; it updates `share_assist_record` and the original user's grand-prize qualification.

## Endpoint Contract Summary

| Endpoint | Inputs | Return highlights |
| --- | --- | --- |
| `GET /api/health` | none | Database engine, table count, activity and seed summary |
| `POST /api/h5/session/create` | `activity_code`, `user_key`, optional identity/source fields | `session_token`, user/session state, progress |
| `GET /api/activity/state` | `session_token` | Daily state and progress |
| `POST /api/draw/execute` | `session_token`, `source` | `draw_id`, `draw_no`, result, daily state, check-in, progress |
| `POST /api/benefit/claim` | `session_token`, `draw_id`, `reward_code`, `mobile`, `claim_channel` | `claim_token`, `claim_no`, reward, action |
| `GET /api/benefit/claim/resolve` | `claim_token` | Claim record and coupon action for mini-program handoff |
| `POST /api/tracking/event` | `session_token` or `activity_code`, `page_code`, `event_name`, `event_payload`, `client_time` | `success`, `event_id` |

## Runtime Coverage

| Area | Current handling |
| --- | --- |
| MySQL runtime | Implemented in `backend/app/database.py`; enable with `GAOKAO_H5_DB_ENGINE=mysql` |
| SQLite local development | Still supported by default for local tests and development |
| Coupon issuing | Backend Hermes client issues coupons; H5 never stores portal credentials |
| Mini-program handoff | H5 calls `wx.miniProgram.navigateTo` to `/pages/my-coupon/index` with `claim_token` and `claim_no` |
| Runtime monitoring | Reuses `POST /api/tracking/event` |

## Regression Commands

```powershell
npm test
python -m unittest discover backend.tests -v
```
