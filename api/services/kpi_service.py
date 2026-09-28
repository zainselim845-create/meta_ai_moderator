# KPI & Sorting service for meta_ai_moderator
import re
from datetime import datetime, timezone, timedelta

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

def calculate_task_kpis(t, action_name=None, tz_offset_hours=2):
    """Recalculate turnaround hours, on-time flag, and deadlines for a task dictionary."""
    if not isinstance(t, dict):
        return {}
    if isinstance(action_name, (int, float)):
        tz_offset_hours = action_name
        action_name = None

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
    deadline = t.get("delivery_deadline")
    
    mod_at = t.get("modification_requested_at") or t.get("returned_to_employee_at")
    effective_start = assigned_at
    effective_deadline = deadline

    if mod_at:
        try:
            dt_mod = datetime.fromisoformat(str(mod_at).replace("Z", "+00:00"))
            dt_sub = datetime.fromisoformat(str(submitted_at).replace("Z", "+00:00")) if submitted_at else None
            if not dt_sub or dt_sub >= dt_mod:
                effective_start = mod_at
                kpis["is_modification"] = True
                kpis["modification_requested_at"] = mod_at
                mod_dl = t.get("modification_deadline")
                if mod_dl:
                    effective_deadline = mod_dl
                else:
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
            dl_str = str(effective_deadline)[:10]
            try:
                dt_submit = datetime.fromisoformat(str(submitted_at).replace("Z", "+00:00"))
                sub_cairo = (dt_submit + timedelta(hours=tz_offset_hours)).strftime("%Y-%m-%d")
                kpis["is_on_time"] = bool(sub_cairo <= dl_str)
                kpis["deadline"] = dl_str
            except Exception:
                pass
                
    completed_at = t.get("completed_at")
    if completed_at and submitted_at:
        try:
            dt_sub = datetime.fromisoformat(str(submitted_at).replace("Z", "+00:00"))
            dt_comp = datetime.fromisoformat(str(completed_at).replace("Z", "+00:00"))
            review_turnaround_secs = max(0, (dt_comp - dt_sub).total_seconds())
            kpis["review_turnaround_hours"] = round(review_turnaround_secs / 3600, 2)
            kpis["am_turnaround_hours"] = round(review_turnaround_secs / 3600, 2)
            kpis["am_reviewed_at"] = completed_at
            kpis["am_on_time"] = bool(review_turnaround_secs <= 86400) # AM within 24h
        except Exception:
            pass

    t["kpis"] = kpis
    return kpis

_calc_task_kpi_on_action = calculate_task_kpis
