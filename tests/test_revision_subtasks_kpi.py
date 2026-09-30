import pytest
from datetime import datetime, timezone, timedelta
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import api.index as idx
from api.services.kpi_service import calculate_task_kpis, task_has_employee_effort

def test_direct_task_submission_without_drive_link(monkeypatch):
    """Test Requirement 1: Employee can submit task directly with one click without needing drive link or files."""
    saved_tasks = []
    monkeypatch.setattr(idx, "sync_from_supabase", lambda *a, **k: None)
    monkeypatch.setattr(idx, "save_one_task", lambda t, cid: saved_tasks.append((t, cid)))
    monkeypatch.setattr(idx, "_notify_client_am", lambda *a, **k: None)
    monkeypatch.setattr(idx, "send_telegram_bot_notification", lambda *a, **k: None)

    task = {
        "task_id": "TASK-SUBMIT-001",
        "client_id": "cli_test_101",
        "title": "بوست انستجرام تجريبي",
        "status": "In Progress",
        "assigned_employee_id": "EMP-9901-1111",
        "assignee_name": "أحمد المصمم",
        "assigned_at": "2026-09-28T10:00:00+00:00",
        "delivery_deadline": "2026-09-29",
    }
    monkeypatch.setattr(idx, "_find_task_any_client", lambda tid: (task, "cli_test_101"))
    monkeypatch.setattr(idx, "_my_employee_id", lambda: "EMP-9901-1111")
    monkeypatch.setattr(idx, "current_user_rec", lambda: {"name": "أحمد المصمم", "employee_id": "EMP-9901-1111", "role": "designer"})
    monkeypatch.setattr(idx, "is_admin", lambda: False)
    monkeypatch.setattr(idx, "is_manager", lambda: False)

    with idx.app.test_client() as client:
        with client.session_transaction() as sess:
            sess["uid"] = "ahmed_designer"
            sess["role"] = "designer"

        # Submit with zero drive_link and default simple notes
        res = client.post("/api/me/tasks/TASK-SUBMIT-001/submit", json={"notes": "تم الإنجاز والتسليم"})
        assert res.status_code == 200
        data = res.get_json()
        assert data.get("ok") is True
        
        # Verify task is submitted and review-ready
        assert task["status"] == "Submitted / In Review"
        assert task["submitted_at"] is not None
        assert task["submitted_by"] == "أحمد المصمم"
        assert len(saved_tasks) >= 1


def test_am_reject_creates_revision_subtask_with_new_deadline(monkeypatch):
    """Test Requirements 2 & 3: AM requesting revision creates a formal sub-task with its own new deadline."""
    saved_tasks = []
    monkeypatch.setattr(idx, "sync_from_supabase", lambda *a, **k: None)
    monkeypatch.setattr(idx, "save_one_task", lambda t, cid: saved_tasks.append((t, cid)))
    monkeypatch.setattr(idx, "send_telegram_bot_notification", lambda *a, **k: None)
    monkeypatch.setattr(idx, "_sheet_emp", lambda eid: {"telegram_id": ""})

    task = {
        "task_id": "TASK-REV-001",
        "client_id": "cli_test_101",
        "title": "فيديو ريلز للتعديل",
        "status": "Submitted / In Review",
        "assigned_employee_id": "EMP-8802-2222",
        "assignee_name": "سارة المونتيرة",
        "assigned_at": "2026-09-25T10:00:00+00:00",
        "delivery_deadline": "2026-09-26",
        "submitted_at": "2026-09-26T12:00:00+00:00",
        "subtasks": []
    }
    monkeypatch.setattr(idx, "_find_task_any_client", lambda tid: (task, "cli_test_101"))
    monkeypatch.setattr(idx, "can_see_client", lambda cid: True)
    monkeypatch.setattr(idx, "current_user_rec", lambda: {"name": "محمود خالد", "employee_id": "AM-2072-9827", "role": "account_manager"})

    with idx.app.test_client() as client:
        with client.session_transaction() as sess:
            sess["uid"] = "mahmoud_am"
            sess["role"] = "account_manager"

        # Request revision with a specific new deadline
        res = client.post("/api/tasks/TASK-REV-001/review", json={
            "action": "reject",
            "note": "يرجى تعديل الموسيقى وتقصير البداية",
            "modification_deadline": "2026-09-30"
        })
        assert res.status_code == 200
        data = res.get_json()
        assert data.get("ok") is True

        # Check that parent task is back Assigned for employee with new deadline
        assert task["status"] == "Assigned"
        assert task["modification_deadline"] == "2026-09-30"
        assert task["active_subtask_id"] == "TASK-REV-001-REV1"

        # Check subtask properties
        subtasks = task.get("subtasks") or []
        assert len(subtasks) == 1
        st = subtasks[0]
        assert st["subtask_id"] == "TASK-REV-001-REV1"
        assert st["parent_task_id"] == "TASK-REV-001"
        assert st["type"] == "revision"
        assert st["is_subtask"] is True
        assert st["revision_number"] == 1
        assert st["delivery_deadline"] == "2026-09-30"
        assert st["assigned_employee_id"] == "EMP-8802-2222"
        assert st["status"] == "In Progress"
        assert "الموسيقى" in st["notes"]


def test_employee_resubmission_resolves_subtask_and_computes_kpis(monkeypatch):
    """Test Requirement 4: Resubmitting marks active subtask as submitted and calculates turnaround & on-time KPIs."""
    saved_tasks = []
    monkeypatch.setattr(idx, "sync_from_supabase", lambda *a, **k: None)
    monkeypatch.setattr(idx, "save_one_task", lambda t, cid: saved_tasks.append((t, cid)))
    monkeypatch.setattr(idx, "_notify_client_am", lambda *a, **k: None)
    monkeypatch.setattr(idx, "send_telegram_bot_notification", lambda *a, **k: None)

    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    task = {
        "task_id": "TASK-REV-002",
        "client_id": "cli_test_101",
        "title": "تصميم بوست فيسبوك",
        "status": "In Progress",
        "assigned_employee_id": "EMP-7703-3333",
        "assignee_name": "كريم المصمم",
        "assigned_at": "2026-09-20T10:00:00+00:00",
        "delivery_deadline": "2026-09-21",
        "modification_deadline": today_str,
        "subtasks": [
            {
                "subtask_id": "TASK-REV-002-REV1",
                "task_id": "TASK-REV-002-REV1",
                "parent_task_id": "TASK-REV-002",
                "type": "revision",
                "is_subtask": True,
                "revision_number": 1,
                "title": "تعديل #1: تغيير الخط",
                "assigned_employee_id": "EMP-7703-3333",
                "assignee_name": "كريم المصمم",
                "client_id": "cli_test_101",
                "status": "In Progress",
                "assigned_at": "2026-09-28T08:00:00+00:00",
                "delivery_deadline": today_str,
                "submitted_at": None,
                "completed_at": None,
                "kpis": {}
            }
        ]
    }
    monkeypatch.setattr(idx, "_find_task_any_client", lambda tid: (task, "cli_test_101"))
    monkeypatch.setattr(idx, "_my_employee_id", lambda: "EMP-7703-3333")
    monkeypatch.setattr(idx, "current_user_rec", lambda: {"name": "كريم المصمم", "employee_id": "EMP-7703-3333", "role": "designer"})
    monkeypatch.setattr(idx, "is_admin", lambda: False)
    monkeypatch.setattr(idx, "is_manager", lambda: False)

    with idx.app.test_client() as client:
        with client.session_transaction() as sess:
            sess["uid"] = "karim_designer"
            sess["role"] = "designer"

        res = client.post("/api/me/tasks/TASK-REV-002/submit", json={"notes": "تم الإنجاز والتسليم"})
        assert res.status_code == 200

        st = task["subtasks"][0]
        assert st["submitted_at"] is not None
        assert st["status"] == "Submitted / In Review"
        
        # Verify subtask KPIs
        st_kpis = st.get("kpis") or {}
        assert st_kpis.get("is_subtask") is True
        assert st_kpis.get("is_on_time") is True
        assert st_kpis.get("turnaround_hours") is not None


def test_subtasks_included_in_kpi_database_and_monthly_report(monkeypatch):
    """Test Requirement 4: _all_tasks_for_kpi_db extracts revision subtasks and credits employee in monthly report."""
    parent_task = {
        "task_id": "TASK-PARENT-100",
        "client_id": "cli_test_101",
        "client_name": "عيادة الصفوة",
        "title": "بوست عيادة الصفوة الرئيسي",
        "status": "Completed",
        "assigned_employee_id": "EMP-6604-4444",
        "assignee_name": "مريم الشريف",
        "assigned_at": "2026-09-10T10:00:00+00:00",
        "delivery_deadline": "2026-09-12",
        "submitted_at": "2026-09-11T12:00:00+00:00",
        "completed_at": "2026-09-12T14:00:00+00:00",
        "subtasks": [
            {
                "subtask_id": "TASK-PARENT-100-REV1",
                "task_id": "TASK-PARENT-100-REV1",
                "parent_task_id": "TASK-PARENT-100",
                "type": "revision",
                "is_subtask": True,
                "revision_number": 1,
                "title": "تعديل #1: إبراز رقم الهاتف",
                "assigned_employee_id": "EMP-6604-4444",
                "assignee_name": "مريم الشريف",
                "status": "Completed",
                "assigned_at": "2026-09-15T10:00:00+00:00",
                "delivery_deadline": "2026-09-16",
                "submitted_at": "2026-09-15T16:00:00+00:00",
                "completed_at": "2026-09-16T10:00:00+00:00",
                "notes": "تم تعديل رقم الهاتف وتكبيره",
                "kpis": {"is_on_time": True, "turnaround_hours": 6.0}
            }
        ]
    }

    monkeypatch.setattr(idx, "_all_tasks_db", lambda: [parent_task])
    monkeypatch.setattr(idx, "_get_deleted_kpi_tasks", lambda: [])

    # Verify _all_tasks_for_kpi_db contains BOTH parent and subtask
    kpi_tasks = idx._all_tasks_for_kpi_db()
    task_ids = [t["task_id"] for t in kpi_tasks]
    assert "TASK-PARENT-100" in task_ids
    assert "TASK-PARENT-100-REV1" in task_ids

    # Verify monthly report calculation
    monkeypatch.setattr(idx, "sync_from_supabase", lambda *a, **k: None)
    monkeypatch.setattr(idx, "current_client_id", lambda: "cli_test_101")
    monkeypatch.setattr(idx, "is_admin", lambda: True)
    monkeypatch.setattr(idx, "get_client_employees", lambda cid: [{"employee_id": "EMP-6604-4444", "name": "مريم الشريف", "role": "designer"}])
    monkeypatch.setattr(idx, "hr_config", lambda: {"sheet_id": "", "employees_gid": ""})
    monkeypatch.setattr(idx, "_gsheet_rows", lambda *a, **k: [])

    with idx.app.test_client() as client:
        with client.session_transaction() as sess:
            sess["uid"] = "admin"
            sess["role"] = "admin"

        res = client.get("/api/tasks/monthly-report?month=2026-09")
        assert res.status_code == 200
        data = res.get_json()
        report = data.get("report") or []
        
        mariam = next((r for r in report if r["employee_id"] == "EMP-6604-4444" or r["name"] == "مريم الشريف"), None)
        assert mariam is not None
        # Maryam has 1 parent task + 1 revision subtask = 2 assigned & 2 completed!
        assert mariam["assigned"] == 2
        assert mariam["completed"] == 2
        assert mariam["on_time_count"] == 2
        
        # Verify subtask note formatting in report
        notes = mariam.get("notes") or []
        subtask_note = next((n for n in notes if n.get("task_id") == "TASK-PARENT-100-REV1"), None)
        assert subtask_note is not None
        assert "مهمة تعديل فرعية #1" in subtask_note.get("note", "")


def test_subtask_standalone_cards_api_and_direct_subtask_id_submit(monkeypatch):
    """Verify that:
    1. api_tasks returns parent task AND standalone synthesized revision subtask card with reason and links.
    2. api_my_tasks returns the revision subtask for the assigned employee.
    3. Direct submission via subtask_id (/api/me/tasks/TASK-PARENT-200-REV1/submit) resolves correctly.
    """
    saved_tasks = []
    monkeypatch.setattr(idx, "sync_from_supabase", lambda *a, **k: None)
    monkeypatch.setattr(idx, "save_one_task", lambda t, cid: saved_tasks.append((t, cid)))
    monkeypatch.setattr(idx, "_notify_client_am", lambda *a, **k: None)
    monkeypatch.setattr(idx, "send_telegram_bot_notification", lambda *a, **k: None)

    parent_task = {
        "task_id": "TASK-PARENT-200",
        "client_id": "cli_test_101",
        "client_name": "عيادة الصفوة",
        "title": "بوست فيسبوك رئيسي",
        "caption": "نص البوست الأصلي",
        "status": "Assigned",
        "assigned_employee_id": "EMP-3305-5555",
        "assignee_name": "راما المصممة",
        "assigned_at": "2026-09-20T10:00:00+00:00",
        "delivery_deadline": "2026-09-22",
        "modification_deadline": "2026-09-29",
        "active_subtask_id": "TASK-PARENT-200-REV1",
        "subtasks": [
            {
                "subtask_id": "TASK-PARENT-200-REV1",
                "task_id": "TASK-PARENT-200-REV1",
                "parent_task_id": "TASK-PARENT-200",
                "type": "revision",
                "is_subtask": True,
                "revision_number": 1,
                "title": "تعديل #1: تغيير ألوان الخلفية وكتابة السعر",
                "notes": "يرجى تغيير خلفية التصميم إلى الأبيض وإبراز السعر بخط واضح",
                "assigned_employee_id": "EMP-3305-5555",
                "assignee_name": "راما المصممة",
                "status": "In Progress",
                "assigned_at": "2026-09-28T09:00:00+00:00",
                "delivery_deadline": (datetime.now(timezone.utc) + timedelta(days=2)).strftime("%Y-%m-%d"),
                "submitted_at": None,
                "completed_at": None
            }
        ]
    }

    # Verify _find_task_any_client finds parent when passed subtask_id
    monkeypatch.setattr(idx, "_all_tasks_db", lambda: [parent_task])
    found_t, found_cid = idx._find_task_any_client("TASK-PARENT-200-REV1")
    assert found_t is not None
    assert found_t["task_id"] == "TASK-PARENT-200"
    assert found_cid == "cli_test_101"

    # Verify api_tasks returns both parent and standalone subtask
    monkeypatch.setattr(idx, "can_see_client", lambda cid: True)
    monkeypatch.setattr(idx, "current_client_id", lambda: "cli_test_101")
    monkeypatch.setattr(idx, "is_admin", lambda: True)

    with idx.app.test_client() as client:
        with client.session_transaction() as sess:
            sess["uid"] = "admin"
            sess["role"] = "admin"

        res = client.get("/api/tasks")
        assert res.status_code == 200
        data = res.get_json()
        tasks = data.get("tasks") or []
        tids = [t["task_id"] for t in tasks]
        assert "TASK-PARENT-200" in tids
        assert "TASK-PARENT-200-REV1" in tids
        
        # Check synthesized subtask entity properties
        subtask_card = next(t for t in tasks if t["task_id"] == "TASK-PARENT-200-REV1")
        assert subtask_card["is_subtask"] is True
        assert subtask_card["parent_task_id"] == "TASK-PARENT-200"
        assert "تغيير خلفية التصميم" in subtask_card["revision_reason"]
        assert subtask_card["assigned_employee_id"] == "EMP-3305-5555"

    # Verify api_my_tasks returns the subtask for Rama
    monkeypatch.setattr(idx, "_my_employee_id", lambda: "EMP-3305-5555")
    monkeypatch.setattr(idx, "current_user_rec", lambda: {"name": "راما المصممة", "employee_id": "EMP-3305-5555", "role": "designer"})
    monkeypatch.setattr(idx, "is_admin", lambda: False)
    monkeypatch.setattr(idx, "is_manager", lambda: False)

    with idx.app.test_client() as client:
        with client.session_transaction() as sess:
            sess["uid"] = "rama_designer"
            sess["role"] = "designer"

        res = client.get("/api/me/tasks")
        assert res.status_code == 200
        my_tasks = res.get_json().get("tasks") or []
        my_tids = [t["task_id"] for t in my_tasks]
        assert "TASK-PARENT-200-REV1" in my_tids

        # Submit DIRECTLY using the subtask ID
        sub_res = client.post("/api/me/tasks/TASK-PARENT-200-REV1/submit", json={"notes": "تم تعديل الخلفية والسعر بنجاح"})
        assert sub_res.status_code == 200
        assert sub_res.get_json().get("ok") is True

        # Check that parent task's subtask was marked submitted
        st = parent_task["subtasks"][0]
        assert st["submitted_at"] is not None
        assert st["status"] == "Submitted / In Review"
        assert st["kpis"]["is_on_time"] is True

