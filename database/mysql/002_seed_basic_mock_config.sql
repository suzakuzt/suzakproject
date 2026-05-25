SET NAMES utf8mb4;
START TRANSACTION;

INSERT INTO activity_config (
  activity_code,
  activity_name,
  status,
  daily_default_chance,
  daily_share_bonus_limit,
  share_target,
  checkin_target,
  grand_prize_name,
  rules_text
)
VALUES (
  'gaokao_lucky_sign_2026',
  '一举高中 · 六月牛气加油签',
  'active',
  1,
  3,
  5,
  7,
  '985 和牛礼盒',
  '[
    {"rule_no":1,"content":"每人每日默认 1 次抽签机会；"},
    {"rule_no":2,"content":"分享好友参与并完成抽签，原用户增加 1 次助力进度；"},
    {"rule_no":3,"content":"每日通过分享最多获得 3 次额外机会；"},
    {"rule_no":4,"content":"每日完成抽签后，自动点亮 1 天进度，每天最多点亮 1 天；"},
    {"rule_no":5,"content":"累计点亮 7 天或邀请 5 位好友，可解锁 985 和牛礼盒抽奖资格；"},
    {"rule_no":6,"content":"奖品数量有限，具体以活动页面公示为准；"},
    {"rule_no":7,"content":"本活动为娱乐互动与祝福活动，不代表任何成绩预测。"}
  ]'
)
ON DUPLICATE KEY UPDATE
  activity_name = VALUES(activity_name),
  status = VALUES(status),
  daily_default_chance = VALUES(daily_default_chance),
  daily_share_bonus_limit = VALUES(daily_share_bonus_limit),
  share_target = VALUES(share_target),
  checkin_target = VALUES(checkin_target),
  grand_prize_name = VALUES(grand_prize_name),
  rules_text = VALUES(rules_text);

INSERT INTO activity_asset_config (
  activity_code, asset_key, asset_type, asset_url, fallback_url, title, status, sort_order, ext_json
)
VALUES
  ('gaokao_lucky_sign_2026', 'p4_beef_product_image', 'product_image', '/assets/p4/product_flat_iron_steak.png', NULL, '和牛商品图', 'enabled', 10, '{"source":"DEFAULT_P4_DETAIL.product.productImage"}'),
  ('gaokao_lucky_sign_2026', 'p7_wechat_group_qrcode', 'qrcode', '/assets/p7/qrcode_wechat_group.png', NULL, '活动规则页企微二维码', 'enabled', 20, '{"source":"DEFAULT_P7_RULES.wechat_group.qrcode_url"}'),
  ('gaokao_lucky_sign_2026', 'p8_wechat_qrcode', 'qrcode', '/assets/p8/qrcode_grand_prize_wechat.png', NULL, '大奖资格页企微二维码', 'enabled', 30, '{"qrcode_id":"grand_prize_wechat_default","source":"DEFAULT_P8_PRIZE.wechat_group.qrcode_url"}'),
  ('gaokao_lucky_sign_2026', 'coupon_10_image', 'reward_image', '/assets/p6/element_coupon_10yuan_card.png', '/assets/p5/element_coupon_10yuan_card.png', '10 元券图', 'enabled', 110, '{"reward_code":"coupon_10"}'),
  ('gaokao_lucky_sign_2026', 'coupon_20_image', 'reward_image', '/assets/p6/element_coupon_20yuan_card.png', '/assets/p5/element_coupon_20yuan_card.png', '20 元券图', 'enabled', 120, '{"reward_code":"coupon_20"}'),
  ('gaokao_lucky_sign_2026', 'coupon_30_image', 'reward_image', '/assets/p6/element_coupon_30yuan_card.png', '/assets/p5/element_coupon_30yuan_card.png', '30 元券图', 'enabled', 130, '{"reward_code":"coupon_30"}'),
  ('gaokao_lucky_sign_2026', 'discount_9_image', 'reward_image', '/assets/p6/element_coupon_9off_card.png', '/assets/p5/element_coupon_9off_card.png', '9 折券图', 'enabled', 140, '{"reward_code":"discount_9"}'),
  ('gaokao_lucky_sign_2026', 'discount_75_image', 'reward_image', '/assets/p6/element_coupon_75off_card.png', '/assets/p5/element_coupon_75off_card.png', '7.5 折券图', 'enabled', 150, '{"reward_code":"discount_75"}')
ON DUPLICATE KEY UPDATE
  asset_type = VALUES(asset_type),
  asset_url = VALUES(asset_url),
  fallback_url = VALUES(fallback_url),
  title = VALUES(title),
  status = VALUES(status),
  sort_order = VALUES(sort_order),
  ext_json = VALUES(ext_json);

INSERT INTO product_recommend_config (
  activity_code, product_code, product_id, product_name, product_desc, product_image_url,
  price_text, action_type, action_target, status, sort_order, ext_json
)
VALUES
  (
    'gaokao_lucky_sign_2026',
    'sku_001',
    'sku_001',
    '高考成功牛排',
    '板腱牛排肉质细嫩，适合考前牛气补给',
    '/assets/p4/product_flat_iron_steak.png',
    NULL,
    'mini_program_product_detail',
    '/pages/product/detail?id=sku_001',
    'enabled',
    10,
    '{"button_text":"去看看","p4_product_name":"和牛 · 锦绣前程板腱","p4_product_id":"default-beef-card"}'
  ),
  (
    'gaokao_lucky_sign_2026',
    'sku_002',
    'sku_002',
    '牛气满格眼肉牛排',
    '眼肉牛排油花丰润，适合好运加餐',
    '/assets/p4/product_ribeye_steak.png',
    NULL,
    'mini_program_product_detail',
    '/pages/product/detail?id=sku_002',
    'enabled',
    20,
    '{"button_text":"去看看","p4_product_name":"和牛 · 牛气满格眼肉","p4_product_id":"ribeye-beef-card"}'
  ),
  (
    'gaokao_lucky_sign_2026',
    'sku_003',
    'sku_003',
    '金榜题名西冷牛排',
    '西冷牛排肉香浓郁，适合稳定发挥',
    '/assets/p4/product_sirloin_steak.png',
    NULL,
    'mini_program_product_detail',
    '/pages/product/detail?id=sku_003',
    'enabled',
    30,
    '{"button_text":"去看看","p4_product_name":"和牛 · 金榜题名西冷","p4_product_id":"sirloin-beef-card"}'
  ),
  (
    'gaokao_lucky_sign_2026',
    'sku_004',
    'sku_004',
    '顺势高中菲力牛排',
    '菲力牛排口感细嫩，适合轻松备考',
    '/assets/p4/product_tenderloin_steak.png',
    NULL,
    'mini_program_product_detail',
    '/pages/product/detail?id=sku_004',
    'enabled',
    40,
    '{"button_text":"去看看","p4_product_name":"和牛 · 顺势高中菲力","p4_product_id":"tenderloin-beef-card"}'
  )
ON DUPLICATE KEY UPDATE
  product_id = VALUES(product_id),
  product_name = VALUES(product_name),
  product_desc = VALUES(product_desc),
  product_image_url = VALUES(product_image_url),
  price_text = VALUES(price_text),
  action_type = VALUES(action_type),
  action_target = VALUES(action_target),
  status = VALUES(status),
  sort_order = VALUES(sort_order),
  ext_json = VALUES(ext_json);

INSERT INTO reward_config (
  activity_code, reward_code, reward_type, reward_name, reward_title, reward_desc, reward_amount_text,
  reward_image_url, button_text, action_type, action_target, is_grand_prize, status, sort_order, ext_json
)
VALUES
  ('gaokao_lucky_sign_2026', 'coupon_10', 'coupon', '无门槛10元券', '10', '无门槛券', '10元', '/assets/p6/element_coupon_10yuan_card.png', '去使用', 'mini_program_coupon_package', '/pages/my-coupon/index', 0, 'enabled', 10, '{"unit_text":"元","threshold_text":"无门槛","coupon_label":"优惠券"}'),
  ('gaokao_lucky_sign_2026', 'coupon_20', 'coupon', '无门槛20元券', '20', '无门槛券', '20元', '/assets/p6/element_coupon_20yuan_card.png', '去使用', 'mini_program_coupon_package', '/pages/my-coupon/index', 0, 'enabled', 20, '{"unit_text":"元","threshold_text":"无门槛","p5_default":true}'),
  ('gaokao_lucky_sign_2026', 'coupon_30', 'coupon', '无门槛30元券', '30', '无门槛券', '30元', '/assets/p6/element_coupon_30yuan_card.png', '去使用', 'mini_program_coupon_package', '/pages/my-coupon/index', 0, 'enabled', 30, '{"unit_text":"元","threshold_text":"无门槛"}'),
  ('gaokao_lucky_sign_2026', 'discount_9', 'discount_coupon', '9折券', '9折', '全场可用', '9折', '/assets/p6/element_coupon_9off_card.png', '去使用', 'mini_program_coupon_package', '/pages/my-coupon/index', 0, 'enabled', 40, '{"unit_text":"","threshold_text":"全场可用"}'),
  ('gaokao_lucky_sign_2026', 'discount_75', 'discount_coupon', '7.5折券', '7.5折', '西冷牛排专属', '7.5折', '/assets/p6/element_coupon_75off_card.png', '去使用', 'mini_program_coupon_package', '/pages/my-coupon/index', 0, 'enabled', 50, '{"unit_text":"","threshold_text":"西冷牛排专属"}'),
  ('gaokao_lucky_sign_2026', 'gift_985', 'grand_prize', '985和牛礼盒', '985和牛礼盒', '抽奖资格', NULL, NULL, '未达标', 'gift_qualification_detail', '/activity/grand-prize', 1, 'enabled', 990, '{"locked_button_text":"未达标","unlocked_button_text":"去使用","reward_type_for_frontend":"gift_lottery_qualification"}'),
  ('gaokao_lucky_sign_2026', 'coupon_50', 'coupon', '50元券', '50元券', '企微领取', '50元', NULL, '去领取', 'mini_program_coupon_package', '/pages/my-coupon/index', 0, 'enabled', 60, '{"source":"DEFAULT_P8_PRIZE.benefits"}')
ON DUPLICATE KEY UPDATE
  reward_type = VALUES(reward_type),
  reward_name = VALUES(reward_name),
  reward_title = VALUES(reward_title),
  reward_desc = VALUES(reward_desc),
  reward_amount_text = VALUES(reward_amount_text),
  reward_image_url = VALUES(reward_image_url),
  button_text = VALUES(button_text),
  action_type = VALUES(action_type),
  action_target = VALUES(action_target),
  is_grand_prize = VALUES(is_grand_prize),
  status = VALUES(status),
  sort_order = VALUES(sort_order),
  ext_json = VALUES(ext_json);

INSERT INTO coupon_issue_config (
  activity_code, reward_code, issue_channel, hermes_title, hermes_id, ref_id, ref_type,
  start_time, end_time, face_value, status, sort_order, ext_json
)
VALUES
  ('gaokao_lucky_sign_2026', 'coupon_10', 'hermes', '一举高中·无门槛10元优惠券', 2605150000000112, 2605150000000126, 1, '2026-05-15 11:00:00', '2026-06-30 23:59:59', '10', 'enabled', 10, '{"source":"portal.hermes.manualImport"}'),
  ('gaokao_lucky_sign_2026', 'coupon_20', 'hermes', '一举高中·无门槛20元优惠券', 2605150000000112, 2605150000000126, 1, '2026-05-15 11:00:00', '2026-06-30 23:59:59', '20', 'disabled', 20, '{"source":"portal.hermes.manualImport"}'),
  ('gaokao_lucky_sign_2026', 'coupon_30', 'hermes', '一举高中·无门槛30元优惠券', 2605150000000112, 2605150000000126, 1, '2026-05-15 11:00:00', '2026-06-30 23:59:59', '30', 'disabled', 30, '{"source":"portal.hermes.manualImport"}'),
  ('gaokao_lucky_sign_2026', 'discount_9', 'hermes', '一举高中·9折优惠券', 2605150000000112, 2605150000000126, 1, '2026-05-15 11:00:00', '2026-06-30 23:59:59', '9', 'disabled', 40, '{"source":"portal.hermes.manualImport"}'),
  ('gaokao_lucky_sign_2026', 'discount_75', 'hermes', '一举高中·7.5折优惠券', 2605150000000112, 2605150000000126, 1, '2026-05-15 11:00:00', '2026-06-30 23:59:59', '7.5', 'disabled', 50, '{"source":"portal.hermes.manualImport"}')
ON DUPLICATE KEY UPDATE
  hermes_title = VALUES(hermes_title),
  hermes_id = VALUES(hermes_id),
  ref_id = VALUES(ref_id),
  ref_type = VALUES(ref_type),
  start_time = VALUES(start_time),
  end_time = VALUES(end_time),
  face_value = VALUES(face_value),
  status = VALUES(status),
  sort_order = VALUES(sort_order),
  ext_json = VALUES(ext_json);

INSERT INTO draw_result_config (
  activity_code, result_code, result_level, result_title, main_text, good_text, avoid_text,
  explain_title, explain_content, tags_json, product_code, reward_code, status, sort_order, ext_json
)
VALUES
  (
    'gaokao_lucky_sign_2026',
    'sign_001',
    '上上签',
    '未名鲤跃MIT池',
    '未名鲤跃MIT池',
    '肉质细嫩鲜香四溢',
    '和牛好礼好运加持',
    'AI解签结果',
    '北大锦鲤游进麻省理工实验室，理综题自动生成标准答案！',
    '["高考好运","牛气补给","北大","MIT"]',
    'sku_001',
    'coupon_20',
    'enabled',
    10,
    '{"sign_type":"未名鲤跃MIT池","main_text_columns":["未名鲤跃MIT池"],"explain_text":"北大锦鲤游进麻省理工实验室，理综题自动生成标准答案！","theme_text":"高考好运 × 牛气补给","benefit_id":"default-benefit","claim_button_text":"领取专属福利"}'
  ),
  (
    'gaokao_lucky_sign_2026',
    'sign_002',
    '上上签',
    '清华星链罩牛津',
    '清华星链罩牛津',
    '肉质细嫩鲜香四溢',
    '和牛好礼好运加持',
    'AI解签结果',
    '清华小卫星群护住牛津钟楼，考场作文秒变莎翁手稿~',
    '["高考好运","牛气补给","清华","牛津"]',
    'sku_002',
    'coupon_20',
    'enabled',
    20,
    '{"sign_type":"清华星链罩牛津","main_text_columns":["清华星链罩牛津"],"explain_text":"清华小卫星群护住牛津钟楼，考场作文秒变莎翁手稿~","theme_text":"高考好运 × 牛气补给","benefit_id":"default-benefit","claim_button_text":"领取专属福利"}'
  ),
  (
    'gaokao_lucky_sign_2026',
    'sign_003',
    '上上签',
    '复旦光阶通哈佛',
    '复旦光阶通哈佛',
    '肉质细嫩鲜香四溢',
    '和牛好礼好运加持',
    'AI解签结果',
    '光华楼的台阶直通哈佛图书馆，踩过的题全变送分项！',
    '["高考好运","牛气补给","复旦","哈佛"]',
    'sku_003',
    'coupon_20',
    'enabled',
    30,
    '{"sign_type":"复旦光阶通哈佛","main_text_columns":["复旦光阶通哈佛"],"explain_text":"光华楼的台阶直通哈佛图书馆，踩过的题全变送分项！","theme_text":"高考好运 × 牛气补给","benefit_id":"default-benefit","claim_button_text":"领取专属福利"}'
  ),
  (
    'gaokao_lucky_sign_2026',
    'sign_004',
    '上上签',
    '浙大鹰叼剑桥分',
    '浙大鹰叼剑桥分',
    '肉质细嫩鲜香四溢',
    '和牛好礼好运加持',
    'AI解签结果',
    '求是神鹰飞越康河，叼回剑桥满分卷，错题统统喂鱼啦！',
    '["高考好运","牛气补给","浙大","剑桥"]',
    'sku_004',
    'coupon_20',
    'enabled',
    40,
    '{"sign_type":"浙大鹰叼剑桥分","main_text_columns":["浙大鹰叼剑桥分"],"explain_text":"求是神鹰飞越康河，叼回剑桥满分卷，错题统统喂鱼啦！","theme_text":"高考好运 × 牛气补给","benefit_id":"default-benefit","claim_button_text":"领取专属福利"}'
  ),
  (
    'gaokao_lucky_sign_2026',
    'sign_005',
    '上上签',
    '上交船载斯坦福',
    '上交船载斯坦福',
    '肉质细嫩鲜香四溢',
    '和牛好礼好运加持',
    'AI解签结果',
    '上海交大龙舟摇进斯坦福校园，志愿表自动填满金offer！',
    '["高考好运","牛气补给","上交","斯坦福"]',
    'sku_001',
    'coupon_20',
    'enabled',
    50,
    '{"sign_type":"上交船载斯坦福","main_text_columns":["上交船载斯坦福"],"explain_text":"上海交大龙舟摇进斯坦福校园，志愿表自动填满金offer！","theme_text":"高考好运 × 牛气补给","benefit_id":"default-benefit","claim_button_text":"领取专属福利"}'
  )
ON DUPLICATE KEY UPDATE
  result_level = VALUES(result_level),
  result_title = VALUES(result_title),
  main_text = VALUES(main_text),
  good_text = VALUES(good_text),
  avoid_text = VALUES(avoid_text),
  explain_title = VALUES(explain_title),
  explain_content = VALUES(explain_content),
  tags_json = VALUES(tags_json),
  product_code = VALUES(product_code),
  reward_code = VALUES(reward_code),
  status = VALUES(status),
  sort_order = VALUES(sort_order),
  ext_json = VALUES(ext_json);

COMMIT;
