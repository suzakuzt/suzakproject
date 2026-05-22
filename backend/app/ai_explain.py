import json
import os
import re
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any


PROMPT_VERSION = "p4_deepseek_blessing_v1"
DEFAULT_BASE_URL = "https://api.deepseek.com"
DEFAULT_MODEL = "deepseek-v4-flash"
DEFAULT_TIMEOUT_SECONDS = 45
DEFAULT_MAX_TOKENS = 260
MAX_EXPLAIN_LINE_CHARS = 14
MAX_THINKING_LINE_CHARS = 18

FALLBACK_THINKING_PROCESS = [
    "正在读取签面灵感",
    "匹配牛气补给能量",
    "整理专属好运签文",
]
FALLBACK_EXPLAIN_LINES = [
    "牛气补给已到位",
    "落笔稳稳拿分",
    "好运一路向上",
]

SYSTEM_PROMPT = """你是高考 H5 活动里的“小璞”，要为用户生成一段有趣、轻快、吉利的 AI 解签文案。

品牌与商品语境：
- 活动主题是一举高中、高考好运。
- 商品叫“牛气补给”，核心联想是和牛、能量补给、考前加油、稳稳发挥。

内容要求：
- 请只输出 JSON，不要 Markdown，不要额外解释。
- JSON 字段必须是 thinkingProcess、explainLines、themeText。
- thinkingProcess 是 3 条可展示在页面上的“思考摘要”，每条不超过 18 个中文字符。
- thinkingProcess 只写面向用户的简短生成进度，例如“读取签面灵感”“匹配牛气补给能量”，不要输出内部推理链或详细推理过程。
- explainLines 是 3 条最终签文，每条不超过 14 个中文字符。
- explainLines 不要带序号、项目符号或引号。
- explainLines 要像祝福签文，积极、有趣、有一点“牛气补给”的梗，但不要承诺真实分数或录取结果。
- themeText 固定为“高考好运 x 牛气补给”。
"""


def generate_ai_explain(result: dict[str, Any], product: dict[str, Any] | None) -> dict[str, Any]:
    _load_local_env()
    config = _read_ai_config()
    if not config["api_key"]:
        return _fallback_payload(config, reason="missing_api_key", result=result)

    request_body = _build_deepseek_request_body(result, product, config)
    request = urllib.request.Request(
        f'{config["base_url"].rstrip("/")}/chat/completions',
        data=json.dumps(request_body, ensure_ascii=False).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f'Bearer {config["api_key"]}',
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=config["timeout_seconds"]) as response:
            response_payload = json.loads(response.read().decode("utf-8"))
        message = response_payload["choices"][0]["message"]
        content = message.get("content") or message.get("reasoning_content") or ""
        ai_payload = _parse_ai_content(content)
        return {
            **ai_payload,
            "ai": {
                "provider": "deepseek",
                "model": config["model"],
                "thinkingEnabled": True,
                "promptVersion": PROMPT_VERSION,
            },
        }
    except (KeyError, IndexError, TypeError, ValueError, urllib.error.URLError, TimeoutError):
        return _fallback_payload(config, reason="deepseek_error", result=result)


def _read_ai_config() -> dict[str, Any]:
    return {
        "api_key": os.environ.get("DEEPSEEK_API_KEY", "").strip(),
        "base_url": os.environ.get("DEEPSEEK_BASE_URL", DEFAULT_BASE_URL).strip() or DEFAULT_BASE_URL,
        "model": os.environ.get("DEEPSEEK_MODEL", DEFAULT_MODEL).strip() or DEFAULT_MODEL,
        "reasoning_effort": os.environ.get("DEEPSEEK_REASONING_EFFORT", "high").strip() or "high",
        "timeout_seconds": _read_int_env("DEEPSEEK_TIMEOUT_SECONDS", DEFAULT_TIMEOUT_SECONDS),
        "max_tokens": _read_int_env("DEEPSEEK_MAX_TOKENS", DEFAULT_MAX_TOKENS),
    }


def _build_deepseek_request_body(result: dict[str, Any], product: dict[str, Any] | None, config: dict[str, Any]) -> dict[str, Any]:
    product_name = _pick(product, "product_name", "productName", default="牛气补给")
    product_title = _pick(product, "title", "product_title", default=product_name)
    result_summary = {
        "signType": result.get("result_title") or result.get("signType") or "",
        "signLevel": result.get("result_level") or result.get("signLevel") or "",
        "mainText": result.get("main_text") or result.get("mainText") or "",
        "goodFor": result.get("good_text") or result.get("goodFor") or "",
        "avoid": result.get("avoid_text") or result.get("avoid") or "",
        "productName": product_name,
        "productTitle": product_title,
    }
    return {
        "model": config["model"],
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"请结合这次抽签结果和商品信息生成解签：{json.dumps(result_summary, ensure_ascii=False)}",
            },
        ],
        "thinking": {"type": "enabled"},
        "reasoning_effort": config["reasoning_effort"],
        "response_format": {"type": "json_object"},
        "max_tokens": config["max_tokens"],
        "temperature": 0.85,
        "stream": False,
    }


def _parse_ai_content(content: str) -> dict[str, Any]:
    raw = _strip_json_fence(content)
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        parsed = _parse_labeled_ai_content(raw)
    thinking = _normalize_lines(parsed.get("thinkingProcess"), FALLBACK_THINKING_PROCESS, MAX_THINKING_LINE_CHARS)
    explain = _normalize_lines(parsed.get("explainLines"), FALLBACK_EXPLAIN_LINES, MAX_EXPLAIN_LINE_CHARS)
    return {
        "thinkingProcess": thinking,
        "explainLines": explain,
        "themeText": "高考好运 x 牛气补给",
    }


def _parse_labeled_ai_content(content: str) -> dict[str, Any]:
    sections: dict[str, list[str]] = {}
    current_key = ""
    key_map = {
        "process": "thinkingProcess",
        "thinkingprocess": "thinkingProcess",
        "thinking": "thinkingProcess",
        "思考过程": "thinkingProcess",
        "思考摘要": "thinkingProcess",
        "explainlines": "explainLines",
        "签文": "explainLines",
        "解签": "explainLines",
        "themetext": "themeText",
        "主题": "themeText",
    }

    for raw_line in content.replace("\r\n", "\n").splitlines():
        line = raw_line.strip()
        if not line:
            continue
        label = ""
        value = line
        for separator in ("：", ":"):
            if separator in line:
                left, right = line.split(separator, 1)
                normalized_left = re.sub(r"\d+$", "", left.strip().lower().replace(" ", ""))
                if normalized_left in key_map:
                    label = key_map[normalized_left]
                    value = right.strip()
                    break
                if "思考" in normalized_left or "process" in normalized_left or "thinking" in normalized_left:
                    label = "thinkingProcess"
                    value = right.strip()
                    break
                if "签文" in normalized_left or "解签" in normalized_left or "explain" in normalized_left:
                    label = "explainLines"
                    value = right.strip()
                    break
                if "主题" in normalized_left or "theme" in normalized_left:
                    label = "themeText"
                    value = right.strip()
                    break
        if label:
            current_key = label
            sections.setdefault(current_key, [])
            if value:
                sections[current_key].append(value)
            continue
        if current_key:
            sections.setdefault(current_key, []).append(line)

    return {
        "thinkingProcess": sections.get("thinkingProcess", []),
        "explainLines": sections.get("explainLines", []),
        "themeText": (sections.get("themeText") or ["高考好运 x 牛气补给"])[0],
    }


def _fallback_payload(config: dict[str, Any], reason: str, result: dict[str, Any] | None = None) -> dict[str, Any]:
    return {
        "thinkingProcess": FALLBACK_THINKING_PROCESS,
        "explainLines": _fallback_explain_lines(result),
        "themeText": "高考好运 x 牛气补给",
        "ai": {
            "provider": "fallback",
            "model": config.get("model", DEFAULT_MODEL),
            "thinkingEnabled": False,
            "promptVersion": PROMPT_VERSION,
            "reason": reason,
        },
    }


def _fallback_explain_lines(result: dict[str, Any] | None) -> list[str]:
    content = result.get("explain_content") if result else ""
    if not content:
        return FALLBACK_EXPLAIN_LINES
    normalized = str(content).replace("\\r\\n", "\n").replace("\\n", "\n")
    lines = [line.strip() for line in normalized.splitlines() if line.strip()]
    return lines[:3] if lines else FALLBACK_EXPLAIN_LINES


def _normalize_lines(lines: Any, fallback: list[str], max_chars: int) -> list[str]:
    if isinstance(lines, str):
        normalized_text = lines.replace("\\r\\n", "\n").replace("\\n", "\n")
        lines = [item.strip() for item in re.split(r"[\n;；]+", normalized_text) if item.strip()]
    if not isinstance(lines, list):
        return fallback

    normalized: list[str] = []
    for line in lines:
        text = _clean_display_line(str(line))
        if text:
            normalized.append(text[:max_chars])
        if len(normalized) == 3:
            break

    while len(normalized) < 3:
        normalized.append(fallback[len(normalized)])
    return normalized


def _clean_display_line(line: str) -> str:
    text = " ".join(line.strip().split())
    return re.sub(r"^(?:\d+[.、]\s*|[-•]\s*)", "", text)


def _strip_json_fence(content: str) -> str:
    text = content.strip()
    if text.startswith("```"):
        text = text.strip("`").strip()
        if text.startswith("json"):
            text = text[4:].strip()
    return text


def _pick(source: dict[str, Any] | None, *keys: str, default: str = "") -> str:
    if not source:
        return default
    for key in keys:
        value = source.get(key)
        if value:
            return str(value)
    return default


def _read_int_env(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, default))
    except (TypeError, ValueError):
        return default


def _load_local_env() -> None:
    backend_dir = Path(__file__).resolve().parents[1]
    for env_path in (backend_dir / ".env", backend_dir / ".env.local"):
        if not env_path.exists():
            continue
        for line in env_path.read_text(encoding="utf-8").splitlines():
            stripped = line.strip()
            if not stripped or stripped.startswith("#") or "=" not in stripped:
                continue
            key, value = stripped.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))
