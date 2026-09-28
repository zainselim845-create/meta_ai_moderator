# Telegram notification & Bot service for meta_ai_moderator
import os
import json
import urllib.request as _urllib_req

def tasks_bot_token():
    """Get configured bot token for tasks notifications."""
    return os.environ.get("TELEGRAM_TASKS_BOT_TOKEN", "")

def tasks_api(method, payload, bot_token=None):
    """Call Telegram Bot API method with JSON payload."""
    tok = bot_token or tasks_bot_token()
    if not tok:
        return {}
    try:
        url = f"https://api.telegram.org/bot{tok}/{method}"
        data = json.dumps(payload).encode("utf-8")
        req = _urllib_req.Request(url, data=data, headers={"Content-Type": "application/json"})
        with _urllib_req.urlopen(req, timeout=12) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"[Telegram API {method} Exception] {e}")
        return {}

def tasks_send(chat_id, text, inline=None, bot_token=None):
    """Send message via Telegram bot with optional inline keyboard."""
    p = {"chat_id": str(chat_id), "text": text, "parse_mode": "HTML"}
    if inline is not None:
        p["reply_markup"] = {"inline_keyboard": inline}
    return tasks_api("sendMessage", p, bot_token=bot_token).get("ok", False)

def tasks_edit(chat_id, message_id, text, inline=None, bot_token=None):
    """Edit an existing Telegram message."""
    p = {"chat_id": str(chat_id), "message_id": message_id, "text": text, "parse_mode": "HTML"}
    if inline is not None:
        p["reply_markup"] = {"inline_keyboard": inline}
    return tasks_api("editMessageText", p, bot_token=bot_token).get("ok", False)

def tasks_answer(cb_id, text="", bot_token=None):
    """Answer Telegram callback query."""
    tasks_api("answerCallbackQuery", {"callback_query_id": cb_id, "text": text}, bot_token=bot_token)

def send_telegram_bot_notification(chat_id, message_text, bot_token=None):
    """Send notification message to user/employee on Telegram."""
    tok = bot_token or tasks_bot_token() or os.environ.get("TELEGRAM_TASKS_BOT_TOKEN", "")
    if not tok or not chat_id:
        return False
    return tasks_send(chat_id, message_text, bot_token=tok)

def att_notify_owner(text, hr_cfg=None):
    """Send attendance notification to company owner/admin."""
    try:
        cfg = hr_cfg or {}
        owner_chat = str(
            (cfg.get("owner_chat_id") if isinstance(cfg, dict) else "") or
            os.environ.get("TELEGRAM_OWNER_CHAT_ID", "") or
            os.environ.get("TELEGRAM_ADMIN_CHAT_ID", "") or
            ""
        ).strip()
        if owner_chat:
            tok = os.environ.get("ATTENDANCE_BOT_TOKEN") or os.environ.get("TELEGRAM_BOT_TOKEN", "")
            if tok:
                return send_telegram_bot_notification(owner_chat, text, bot_token=tok)
    except Exception as _e:
        print(f"[att notify owner error] {_e}")
    return False
