import json
import pytest
from datetime import datetime, timezone
from api.index import (
    app,
    cache,
    invalidate_tasks_cache,
    _all_tasks_db,
    _all_tasks_for_kpi_db,
    _get_deleted_kpi_tasks,
    _record_deleted_tasks_for_kpi,
    _find_task_any_client,
)
from api.services.kpi_service import (
    task_has_employee_effort,
    prepare_deleted_task_for_kpi,
)

@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c

def test_task_has_employee_effort_unit():
    assert not task_has_employee_effort({})
    assert not task_has_employee_effort({"title": "Draft post", "status": "Draft"})
    
    t1 = {
        "task_id": "TASK-TEST-001",
        "assigned_employee_id": "EMP-4100-3630",
        "assignee_name": "إسلام أحمد",
        "status": "In Progress"
    }
    assert task_has_employee_effort(t1) is True

    t2 = {
        "task_id": "TASK-TEST-002",
        "assigned_employee_id": "EMP-4100-3630",
        "status": "Draft",
        "drive_link": "https://drive.google.com/file/d/test1234/view"
    }
    assert task_has_employee_effort(t2) is True

    t3 = {
        "task_id": "TASK-TEST-003",
        "assigned_employee_id": "EMP-4100-3630",
        "status": "Draft",
        "elapsed_seconds": 1200
    }
    assert task_has_employee_effort(t3) is True

    t4 = {
        "task_id": "TASK-TEST-004",
        "assigned_employee_id": "EMP-4100-3630",
        "status": "Completed",
        "completed_at": datetime.now(timezone.utc).isoformat()
    }
    assert task_has_employee_effort(t4) is True

def test_prepare_deleted_task_for_kpi():
    t = {
        "task_id": "TASK-DEL-101",
        "assigned_employee_id": "EMP-4100-3630",
        "assignee_name": "إسلام أحمد",
        "status": "Completed",
        "assigned_at": "2026-09-01T10:00:00+00:00",
        "submitted_at": "2026-09-01T12:00:00+00:00",
        "completed_at": "2026-09-01T14:00:00+00:00",
        "delivery_deadline": "2026-09-02",
    }
    prep = prepare_deleted_task_for_kpi(t)
    assert prep is not None
    assert prep["is_deleted"] is True
    assert "deleted_at" in prep
    assert prep["kpis"]["is_on_time"] is True
    assert prep["kpis"]["turnaround_hours"] == 2.0
    assert any(a.get("action") == "task_deleted_preserved_for_kpi" for a in prep["activity_log"])

def test_single_task_deletion_preserves_kpi(client):
    with client.session_transaction() as sess:
        sess["uid"] = "admin"
        sess["username"] = "admin"
        sess["role"] = "admin"
        sess["cid"] = "client_default"

    now_iso = datetime.now(timezone.utc).isoformat()
    worked_task = {
        "task_id": "TASK-DEL-TEST-999",
        "client_id": "client_default",
        "title": "مهمة إسلام التجريبية للحذف",
        "status": "Completed",
        "assigned_employee_id": "EMP-4100-3630",
        "assignee_name": "إسلام أحمد",
        "assigned_at": now_iso,
        "submitted_at": now_iso,
        "completed_at": now_iso,
        "delivery_deadline": "2026-09-30",
        "drive_link": "https://drive.google.com/file/d/deltest/view",
        "notes": "تم تسليم العمل بدقة"
    }

    cache["tasks"] = [worked_task]
    cache["deleted_kpi_tasks"] = []
    invalidate_tasks_cache()

    active_before = [x for x in _all_tasks_db() if x.get("task_id") == "TASK-DEL-TEST-999"]
    assert len(active_before) == 1

    res = client.delete("/api/tasks/TASK-DEL-TEST-999")
    assert res.status_code == 200
    res_data = res.get_json()
    assert res_data.get("success") is True

    active_after = [x for x in _all_tasks_db() if x.get("task_id") == "TASK-DEL-TEST-999"]
    assert len(active_after) == 0

    deleted_kpi = [x for x in _get_deleted_kpi_tasks() if x.get("task_id") == "TASK-DEL-TEST-999"]
    assert len(deleted_kpi) == 1
    assert deleted_kpi[0].get("is_deleted") is True

    t_found, c_found = _find_task_any_client("TASK-DEL-TEST-999")
    assert t_found is not None
    assert t_found["drive_link"] == "https://drive.google.com/file/d/deltest/view"

    get_res = client.get("/api/tasks/TASK-DEL-TEST-999")
    assert get_res.status_code == 200
    assert get_res.get_json().get("ok") is True

    curr_month = now_iso[:7]
    rep_res = client.get(f"/api/tasks/monthly-report?month={curr_month}")
    assert rep_res.status_code == 200
    rep_data = rep_res.get_json().get("report") or []
    eslam_row = next((r for r in rep_data if r.get("employee_id") == "EMP-4100-3630"), None)
    assert eslam_row is not None
    assert eslam_row["assigned"] >= 1
    assert eslam_row["completed"] >= 1
    assert any(n.get("task_id") == "TASK-DEL-TEST-999" and n.get("is_deleted") is True for n in eslam_row["notes"])

def test_plan_deletion_preserves_kpi(client):
    with client.session_transaction() as sess:
        sess["uid"] = "admin"
        sess["username"] = "admin"
        sess["role"] = "admin"
        sess["cid"] = "client_default"

    now_iso = datetime.now(timezone.utc).isoformat()
    plan_tasks = [
        {
            "task_id": "TASK-PLAN-DEL-01",
            "client_id": "client_default",
            "plan_name": "خطة سوشيال ميديا سبتمبر المحذوفة",
            "title": "بوست 1 من خطة محذوفة",
            "status": "Completed",
            "assigned_employee_id": "EMP-4100-3630",
            "assignee_name": "إسلام أحمد",
            "assigned_at": now_iso,
            "submitted_at": now_iso,
            "completed_at": now_iso,
            "delivery_deadline": "2026-09-30",
            "drive_link": "https://drive.google.com/file/d/planpost1/view",
        },
        {
            "task_id": "TASK-PLAN-DEL-02",
            "client_id": "client_default",
            "plan_name": "خطة سوشيال ميديا سبتمبر المحذوفة",
            "title": "بوست 2 مسودة غير مسندة",
            "status": "Draft",
        }
    ]

    cache["tasks"] = plan_tasks
    cache["deleted_kpi_tasks"] = []
    invalidate_tasks_cache()

    del_res = client.post("/api/plans/delete", json={
        "plan_name": "خطة سوشيال ميديا سبتمبر المحذوفة",
        "client_id": "client_default"
    })
    assert del_res.status_code == 200
    assert del_res.get_json().get("deleted_count") == 2

    assert len(_all_tasks_db()) == 0

    del_kpis = _get_deleted_kpi_tasks()
    del_ids = [d.get("task_id") for d in del_kpis]
    assert "TASK-PLAN-DEL-01" in del_ids
    assert "TASK-PLAN-DEL-02" not in del_ids

    wl_res = client.get("/api/employees/workload")
    assert wl_res.status_code == 200
    wl_data = wl_res.get_json()
    assert wl_data["completed"].get("EMP-4100-3630", 0) >= 1
    assert wl_data["workload"].get("EMP-4100-3630", 0) == 0
