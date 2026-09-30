# KPI & Sorting service for meta_ai_moderator
import os
import re
from datetime import datetime, timezone, timedelta

def to_cairo_date_str(val, tz_offset_hours=None):
    """Safely extracts YYYY-MM-DD in Cairo local time from any ISO string, date string, or datetime."""
    if not val:
        return ""
    if tz_offset_hours is None:
        try:
            tz_offset_hours = float(os.environ.get("TZ_OFFSET_HOURS", "3"))
        except Exception:
            tz_offset_hours = 3.0
    s = str(val).strip()
    m_pure = re.match(r"^(\d{4})-(\d{1,2})-(\d{1,2})$", s)
    if m_pure:
        return f"{m_pure.group(1)}-{m_pure.group(2).zfill(2)}-{m_pure.group(3).zfill(2)}"
    try:
        if s.endswith("Z") or re.search(r"[+-]\d{2}:?\d{2}$", s):
            dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
            cairo_tz = timezone(timedelta(hours=tz_offset_hours))
            return dt.astimezone(cairo_tz).strftime("%Y-%m-%d")
        elif "T" in s or " " in s:
            dt = datetime.fromisoformat(s)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            cairo_tz = timezone(timedelta(hours=tz_offset_hours))
            return dt.astimezone(cairo_tz).strftime("%Y-%m-%d")
    except Exception:
        pass
    m = re.search(r"(\d{4})-(\d{1,2})-(\d{1,2})", s)
    if m:
        return f"{m.group(1)}-{m.group(2).zfill(2)}-{m.group(3).zfill(2)}"
    return s[:10]

def resolve_post_number(t, default_index=1):
    """Resolve the clean sequential post number (1, 2, 3...) inside a client's plan."""
    if not isinstance(t, dict):
        return default_index
    if t.get("post_number") is not None:
        try:
            return int(t.get("post_number"))
        except Exception:
            pass
    title = str(t.get("title") or "")
    caption = str(t.get("caption") or "")
    m = re.search(r'(?:بوست|منشور|post|item|تاسك|مهمة|#)\s*(\d+)', title, re.I)
    if not m:
        m = re.search(r'(?:بوست|منشور|post|item|تاسك|مهمة|#)\s*(\d+)', caption, re.I)
    if not m:
        m = re.search(r'^(\d+)[\.\-\:\s]', title.strip())
    if m:
        return int(m.group(1))
    ord_map = {
        'الاول': 1, 'الاولى': 1, 'الأول': 1, 'الأولى': 1,
        'الثاني': 2, 'الثانية': 2, 'الثالث': 3, 'الثالثة': 3,
        'الرابع': 4, 'الرابعة': 4, 'الخامس': 5, 'الخامسة': 5,
        'السادس': 6, 'السادسة': 6, 'السابع': 7, 'السابعة': 7,
        'الثامن': 8, 'الثامنة': 8, 'التاسع': 9, 'التاسعة': 9,
        'العاشر': 10, 'العاشرة': 10,
        'الحادي عشر': 11, 'الحادية عشر': 11, 'الثاني عشر': 12, 'الثانية عشر': 12
    }
    for word, val in ord_map.items():
        if word in title:
            return val
    return default_index

def natural_task_sort_key(t):
    """Extract natural sequential ordering for a task:
    1. Explicit post_number or extracted from title
    2. Arabic textual ordinal: 'الاول', 'الثاني', 'الثالث'...
    3. TASK-xxxx number
    4. Publish Date / Time
    """
    if not isinstance(t, dict):
        return (9, 999999, "")
    task_id = str(t.get("task_id") or "")
    
    if t.get("post_number") is not None:
        try:
            return (0, int(t.get("post_number")), task_id)
        except Exception:
            pass

    resolved = resolve_post_number(t, default_index=None)
    if resolved is not None:
        return (1, resolved, task_id)

    m_tid = re.search(r'TASK-(\d+)', task_id)
    if m_tid:
        return (2, int(m_tid.group(1)), task_id)
        
    pub = (t.get("publish_date") or "") + " " + (t.get("publish_time") or "")
    if pub.strip():
        return (3, pub, task_id)
        
    return (4, 999999, task_id)

def calculate_task_kpis(t, action_name=None, tz_offset_hours=None):
    """Recalculate turnaround hours, on-time flag, and deadlines for a task dictionary."""
    if not isinstance(t, dict):
        return {}
    if isinstance(action_name, (int, float)):
        tz_offset_hours = action_name
        action_name = None

    if tz_offset_hours is None:
        try:
            tz_offset_hours = float(os.environ.get("TZ_OFFSET_HOURS", "3"))
        except Exception:
            tz_offset_hours = 3.0

    if action_name:
        act = str(action_name).lower()
        if "submit" in act:
            if not t.get("submitted_at"):
                t["submitted_at"] = datetime.now(timezone.utc).isoformat()
        elif "review" in act or "approve" in act or "complete" in act:
            if not t.get("completed_at"):
                t["completed_at"] = datetime.now(timezone.utc).isoformat()

    kpis = t.get("kpis") or {}
    assigned_at = t.get("assigned_at")
    submitted_at = t.get("submitted_at")
    deadline = t.get("delivery_deadline") or t.get("publish_date")
    
    mod_at = t.get("modification_requested_at") or t.get("returned_to_employee_at") or t.get("last_modification_requested_at")
    mod_dl = t.get("modification_deadline")
    effective_start = assigned_at
    effective_deadline = deadline

    if mod_dl:
        effective_deadline = mod_dl
        effective_start = mod_at or assigned_at
        kpis["is_modification"] = True
        kpis["modification_deadline"] = mod_dl
    elif mod_at:
        try:
            dt_mod = datetime.fromisoformat(str(mod_at).replace("Z", "+00:00"))
            dt_sub = datetime.fromisoformat(str(submitted_at).replace("Z", "+00:00")) if submitted_at else None
            if not dt_sub or dt_sub >= dt_mod:
                effective_start = mod_at
                kpis["is_modification"] = True
                kpis["modification_requested_at"] = mod_at
                mod_cairo_d = (dt_mod + timedelta(hours=tz_offset_hours)).date()
                orig_dl_d = None
                if deadline:
                    try:
                        orig_dl_d = datetime.strptime(str(deadline)[:10], "%Y-%m-%d").date()
                    except Exception:
                        pass
                if not orig_dl_d or orig_dl_d < mod_cairo_d:
                    effective_deadline = (dt_mod + timedelta(hours=tz_offset_hours, days=1)).strftime("%Y-%m-%d")
                else:
                    effective_deadline = str(deadline)[:10]
        except Exception:
            pass

    if effective_start:
        kpis["assigned_at"] = effective_start
    if submitted_at:
        kpis["submitted_at"] = submitted_at
        try:
            dt_start = datetime.fromisoformat(str(effective_start).replace("Z", "+00:00")) if effective_start else None
            dt_submit = datetime.fromisoformat(str(submitted_at).replace("Z", "+00:00"))
            if dt_start:
                turnaround_secs = max(0, (dt_submit - dt_start).total_seconds())
                kpis["turnaround_hours"] = round(turnaround_secs / 3600, 2)
                kpis["turnaround_minutes"] = round(turnaround_secs / 60, 1)
        except Exception:
            pass
            
        if effective_deadline:
            dl_clean = to_cairo_date_str(effective_deadline, tz_offset_hours)
            sub_cairo = to_cairo_date_str(submitted_at, tz_offset_hours)
            if dl_clean and sub_cairo:
                # STRICT RULE: A delay is ONLY counted when the task is submitted AFTER its deadline day.
                # If submitted on the same calendar day or earlier (sub_cairo <= dl_clean), it is STRICTLY on-time!
                is_on_time = bool(sub_cairo <= dl_clean)
                kpis["is_on_time"] = is_on_time
                kpis["is_delayed"] = not is_on_time
                kpis["deadline"] = dl_clean
                kpis["submitted_date"] = sub_cairo
                if is_on_time:
                    kpis["delay_days"] = 0
                
    if t.get("type") == "revision" or t.get("is_subtask"):
        kpis["is_subtask"] = True
        kpis["is_revision"] = True
        kpis["revision_number"] = t.get("revision_number", 1)

    completed_at = t.get("completed_at")
    if completed_at and submitted_at:
        try:
            dt_sub = datetime.fromisoformat(str(submitted_at).replace("Z", "+00:00"))
            dt_comp = datetime.fromisoformat(str(completed_at).replace("Z", "+00:00"))
            review_turnaround_secs = max(0, (dt_comp - dt_sub).total_seconds())
            kpis["review_turnaround_hours"] = round(review_turnaround_secs / 3600, 2)
            kpis["am_turnaround_hours"] = round(review_turnaround_secs / 3600, 2)
            kpis["am_review_hours"] = round(review_turnaround_secs / 3600, 2)
            kpis["am_review_minutes"] = round(review_turnaround_secs / 60, 1)
            kpis["am_reviewed_at"] = completed_at
            kpis["am_on_time"] = bool(review_turnaround_secs <= 86400) # AM within 24h
        except Exception:
            pass

    timer_secs = (t.get("timer_state") or {}).get("elapsed_seconds", 0)
    if timer_secs:
        kpis["timer_minutes"] = round(timer_secs / 60, 1)

    t["kpis"] = kpis
    return kpis

_calc_task_kpi_on_action = calculate_task_kpis


def task_has_employee_effort(t):
    """Check if task has employee involvement that warrants KPI preservation."""
    if not isinstance(t, dict):
        return False
    # Check if there is an employee assigned or linked
    has_emp = bool(
        t.get("assigned_employee_id")
        or t.get("assignee_name")
        or t.get("secondary_employee_id")
        or t.get("secondary_assignee_name")
        or t.get("content_creator_id")
        or t.get("creator_id")
    )
    if not has_emp:
        return False

    status = str(t.get("status") or "").strip().lower()
    # Unworked states
    if status in ("draft", "unassigned", "cancelled"):
        # If it has actual deliverables or submissions or timer, it still has effort
        has_deliverables = bool(
            t.get("submitted_at")
            or t.get("completed_at")
            or t.get("deliverable_url")
            or t.get("drive_link")
            or (isinstance(t.get("media_urls"), list) and len(t.get("media_urls")) > 0)
        )
        if not has_deliverables:
            try:
                if float(t.get("elapsed_seconds") or (t.get("timer_state") or {}).get("elapsed_seconds") or 0) > 0:
                    return True
            except Exception:
                pass
            return False

    # Standard worked / assigned statuses
    worked_statuses = {
        "assigned", "in progress", "awaiting am review", "submitted / in review",
        "submitted", "completed", "approved / scheduled", "done", "review required",
        "pending revision", "revision requested", "modification requested",
        "pending am approval"
    }
    if status in worked_statuses:
        return True

    if t.get("submitted_at") or t.get("completed_at") or t.get("started_at"):
        return True

    if t.get("deliverable_url") or t.get("drive_link"):
        return True

    media = t.get("media_urls")
    if isinstance(media, list) and len(media) > 0:
        return True

    try:
        if float(t.get("elapsed_seconds") or (t.get("timer_state") or {}).get("elapsed_seconds") or 0) > 0:
            return True
    except Exception:
        pass

    return False


def prepare_deleted_task_for_kpi(t, tz_offset_hours=2):
    """Cleanly snapshot and flag a deleted task so it remains countable in KPIs."""
    if not isinstance(t, dict):
        return None
    task_copy = dict(t)
    now_iso = datetime.now(timezone.utc).isoformat()
    task_copy["is_deleted"] = True
    if not task_copy.get("deleted_at"):
        task_copy["deleted_at"] = now_iso
    
    # Ensure KPIs are calculated
    calculate_task_kpis(task_copy, tz_offset_hours=tz_offset_hours)
    
    # Append to activity_log if present
    act_log = list(task_copy.get("activity_log") or task_copy.get("stage_history") or [])
    act_log.append({
        "timestamp": now_iso,
        "action": "task_deleted_preserved_for_kpi",
        "note": "تم أرشفة المهمة واحتسابها في تقرير أداء الـ KPI لضمان حقوق ومجهود الموظف",
        "actor": "system"
    })
    task_copy["activity_log"] = act_log
    return task_copy
