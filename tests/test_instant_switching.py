import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import api.index as idx

@pytest.fixture(autouse=True)
def mock_external(monkeypatch):
    monkeypatch.setattr(idx, "sync_from_supabase", lambda *a, **k: None)
    monkeypatch.setattr(idx, "push_setting", lambda *a, **k: None)
    monkeypatch.setattr(idx, "_notify_client_am", lambda *a, **k: None)
    monkeypatch.setattr(idx, "send_telegram_bot_notification", lambda *a, **k: True)
    monkeypatch.setattr(idx, "send_task_to_employee", lambda *a, **k: True)
    monkeypatch.setattr(idx, "get_google_oauth_access_token", lambda *a, **k: None)
    monkeypatch.setattr(idx, "client_month_folder_id", lambda *a, **k: "fake_folder")
    monkeypatch.setattr(idx, "client_drive_folder_id", lambda *a, **k: "fake_folder")
    monkeypatch.setattr(idx, "_ensure_task_plan_in_employee_drive", lambda *a, **k: None)
    idx.AGENCY_CLIENTS_STORE = [dict(c) for c in idx.CANONICAL_DEFAULT_CLIENTS]
    idx.sync_am_client_sets()

def test_employee_can_reassign_task_instantly(monkeypatch):
    """Verify an employee can reassign a task assigned to them to another teammate."""
    test_task = {
        "task_id": "TASK-TEST-SW-01",
        "id": "TASK-TEST-SW-01",
        "client_id": "cli_dr_ahmed_1788270119",
        "title": "مهمة اختبار التحويل اللحظي",
        "status": "In Progress",
        "assigned_employee_id": "emp-designer-1",
        "assignee_name": "المصمم الأول",
        "am_id": "AM-2072-9827",
        "am_name": "محمود خالد"
    }

    saved_tasks = []
    monkeypatch.setattr(idx, "_find_task_any_client", lambda tid: (test_task, test_task["client_id"]))
    monkeypatch.setattr(idx, "save_one_task", lambda t, cid: saved_tasks.append(t))

    with idx.app.test_client() as client:
        with client.session_transaction() as sess:
            sess["uid"] = "emp-designer-1"
            sess["role"] = "employee"
            sess["user_rec"] = {"name": "المصمم الأول", "employee_id": "emp-designer-1", "role": "employee"}

        res = client.post("/api/tasks/TASK-TEST-SW-01/assign", json={
            "employee_id": "emp-designer-2"
        })
        assert res.status_code == 200
        data = res.get_json()
        assert data.get("ok") is True
        assert test_task["assigned_employee_id"] == "emp-designer-2"
        assert len(saved_tasks) == 1
        logs = test_task.get("activity_log") or []
        assert any("تحويل المهمة" in (l.get("note") or "") for l in logs)

def test_client_am_instant_switch_and_cascade(monkeypatch):
    """Verify transferring client AM updates client and cascades to all its tasks."""
    client_id = "cli_sk_1788270118"
    tasks_pool = [
        {"task_id": "TASK-SK-01", "client_id": client_id, "am_id": "AM-2072-9827", "am_name": "محمود خالد"},
        {"task_id": "TASK-SK-02", "client_id": client_id, "am_id": "AM-2072-9827", "am_name": "محمود خالد"},
    ]
    monkeypatch.setattr(idx, "_all_tasks_db", lambda *a, **k: tasks_pool)
    saved_cascaded = []
    monkeypatch.setattr(idx, "save_client_tasks", lambda tasks, cid: saved_cascaded.extend(tasks))

    with idx.app.test_client() as client:
        with client.session_transaction() as sess:
            sess["uid"] = "admin"
            sess["role"] = "admin"
            sess["user_rec"] = {"name": "مدير النظام", "role": "admin"}

        res = client.put(f"/api/clients/{client_id}", json={
            "am_employee_id": "EMP-0652-9532"
        })
        assert res.status_code == 200
        data = res.get_json()
        assert data.get("ok") is True
        assert data.get("am_changed") is True

        c_rec = next(c for c in idx.AGENCY_CLIENTS_STORE if c["id"] == client_id)
        assert c_rec["am_employee_id"] == "EMP-0652-9532"
        assert c_rec["am_name"] == "حبيبه احمد محمد"
        assert all(t["am_id"] == "EMP-0652-9532" for t in saved_cascaded)

def test_quick_switch_user_endpoint():
    """Verify /api/switch-user changes the session and user identity instantaneously."""
    with idx.app.test_client() as client:
        res = client.post("/api/switch-user", json={"user": "AM-2072-9827"})
        assert res.status_code == 200
        data = res.get_json()
        assert data["ok"] is True
        assert data["employee_id"] == "AM-2072-9827"
        assert data["role"] == "account_manager"
        assert data["name"] == "محمود خالد"

        res2 = client.post("/api/switch-user", json={"user": "EMP-0652-9532"})
        assert res2.status_code == 200
        data2 = res2.get_json()
        assert data2["employee_id"] == "EMP-0652-9532"
        assert data2["role"] == "account_manager"

        res3 = client.post("/api/switch-user", json={"user": "admin"})
        assert res3.status_code == 200
        data3 = res3.get_json()
        assert data3["role"] == "admin"
        assert data3["username"] == "admin"

def test_team_switch_list_endpoint():
    """Verify /api/team-switch-list returns the list of available team accounts."""
    with idx.app.test_client() as client:
        res = client.get("/api/team-switch-list")
        assert res.status_code == 200
        data = res.get_json()
        assert data["ok"] is True
        accounts = data.get("accounts", [])
        eids = {a["id"].upper() for a in accounts}
        assert "ADMIN" in eids
        assert "AM-2072-9827" in eids
        assert "EMP-5887-5256" in eids
        assert "EMP-0652-9532" in eids
