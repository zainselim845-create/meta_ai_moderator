# Task domain service for meta_ai_moderator
import re
from datetime import datetime, timezone, timedelta

def get_cairo_time_str(dt=None):
    if dt is None:
        dt = datetime.now(timezone.utc)
    cairo_dt = dt.astimezone(timezone(timedelta(hours=3)))
    return cairo_dt.strftime("%Y-+m-%d %I:%M p%").replace("AM", "\u0661\u0630\u0627\u0637\u0627\u064b").replace("PM", "\u0645\u0637\u0627\u0644\u064c")

def synthesize_subtask_task(parent_t, st):
    """Convert an embedded subtask dict into a standalone task object linked to parent."""
    if not isinstance(parent_t, dict) or not isinstance(st, dict):
        return None
    subtask_id = str(st.get("subtask_id") or st.get("task_id") or "").strip()
    if not subtask_id:
        return None
    parent_id = str(parent_t.get("task_id") or "").strip()
    rev_num = st.get("revision_number") or 1
    rev_reason = str(st.get("notes") or st.get("review_note") or parent_t.get("review_note") or parent_t.get("modification_request") or "طلب تعديل من مدير الحساب").strip()
    
    subtask_obj = {
        "task_id": subtask_id,
        "subtask_id": subtask_id,
        "parent_task_id": parent_id,
        "is_subtask": True,
        "type": "revision",
        "revision_number": rev_num,
        "revision_reason": rev_reason,
        "title": f"تعديل #{rev_num}: {parent_t.get('title') or 'مهمة'}",
        "parent_title": parent_t.get("title") or "المهمة الأٵلية",
        "caption": parent_t.get("caption") or "",
        "description": parent_t.get("description") or "",
        "visual_idea": parent_t.get("visual_idea") or "",
        "design_brief": parent_t.get("design_brief") or "",
        "client_id": parent_t.get("client_id") or "",
        "client_name": parent_t.get("client_name") or "",
        "plan_name": parent_t.get("plan_name") or "",
        "file_name": parent_t.get("file_name") or "",
        "post_number_in_plan": parent_t.get("post_number_in_plan"),
        "post_number": parent_t.get("post_number"),
        "assigned_employee_id": st.get("assigned_employee_id") or parent_t.get("assigned_employee_id") or "",
        "assignee_name": st.get("assignee_name") or parent_t.get("assignee_name") or "",
        "secondary_employee_id": parent_t.get("secondary_employee_id"),
        "secondary_assignee_name": parent_t.get("secondary_assignee_name"),
        "am_id": parent_t.get("am_id") or "",
        "am_name": parent_t.get("am_name") or "",
        "status": st.get("status") or "In Progress",
        "delivery_deadline": st.get("delivery_deadline") or parent_t.get("modification_deadline") or parent_t.get("delivery_deadline") or "",
        "modification_deadline": st.get("delivery_deadline") or parent_t.get("modification_deadline") or "",
        "created_at": st.get("created_at") or st.get("assigned_at") or parent_t.get("created_at"),
        "assigned_at": st.get("assigned_at") or parent_t.get("assigned_at"),
        "modification_requested_at": st.get("modification_requested_at") or parent_t.get("modification_requested_at"),
        "submitted_at": st.get("submitted_at"),
        "completed_at": st.get("completed_at"),
        "materials_url": parent_t.get("materials_url") or "",
        "materials_link": parent_t.get("materials_link") or "",
        "plan_drive_link": parent_t.get("plan_drive_link") or "",
        "drive_link": st.get("drive_link") or parent_t.get("drive_link") or "",
        "deliverables": st.get("deliverables") or parent_t.get("deliverables") or [],
        "reference_links": parent_t.get("reference_links") or [],
        "reference_link": parent_t.get("reference_link") or "",
        "media_urls": parent_t.get("media_urls") or [],
        "reference_images": parent_t.get("reference_images") or [],
        "content_data": parent_t.get("content_data"),
        "graphic_data": parent_t.get("graphic_data"),
        "video_data": parent_t.get("video_data"),
        "notes": rev_reason,
        "review_note": rev_reason,
        "kpis": st.get("kpis") or {}
    }
    return subtask_obj

def expand_tasks_with_revision_subtasks(tasks):
    """Include revision subtasks as standalone tasks in the returned task list."""
    expanded = []
    seen_ids = set()
    for t in tasks:
        if not isinstance(t, dict):
            continue
        tid = str(t.get("task_id") or "")
        if tid and tid not in seen_ids:
            seen_ids.add(tid)
            expanded.append(t)
        
        # Expand any subtasks
        subtasks = t.get("subtasks") or []
        for st in subtasks:
            if not isinstance(st, dict):
                continue
            if st.get("type") == "revision" or st.get("is_subtask"):
                stid = str(st.get("subtask_id") or st.get("task_id") or "")
                if stid and stid not in seen_ids:
                    st_obj = synthesize_subtask_task(t, st)
                    if st_obj:
                        seen_ids.add(stid)
                        expanded.append(st_obj)
    return expanded

def create_revision_subtask_record(parent_task, reason, deadline, reviewer_id, reviewer_name):
    """Construct a new revision subtask record dictionary for a parent task."""
    subtasks = parent_task.get("subtasks") or []
    rev_count = sum(1 for st in subtasks if isinstance(st, dict) and (st.get("type") == "revision" or st.get("is_subtask")))
    rev_num = rev_count + 1
    parent_id = str(parent_task.get("task_id") or "")
    subtask_id = f"{parent_id}-REV{rev_num}"
    
    now_iso = datetime.now(timezone.utc).isoformat()
    return {
        "subtask_id": subtask_id,
        "task_id": subtask_id,
        "parent_task_id": parent_id,
        "type": "revision",
        "is_subtask": True,
        "revision_number": rev_num,
        "title": f"تعديل #{rev_num}: {parent_task.get('title') or 'مهمة'}",
        "notes": reason,
        "review_note": reason,
        "assigned_employee_id": parent_task.get("assigned_employee_id") or "",
        "assignee_name": parent_task.get("assignee_name") or "",
        "am_id": reviewer_id or parent_task.get("am_id") or "",
        "am_name": reviewer_name or parent_task.get("am_name") or "",
        "status": "In Progress",
        "delivery_deadline": deadline or parent_task.get("modification_deadline") or parent_task.get("delivery_deadline") or "",
        "created_at": now_iso,
        "assigned_at": now_iso,
        "modification_requested_at": now_iso
    }