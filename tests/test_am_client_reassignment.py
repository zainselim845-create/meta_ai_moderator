import json
import time
import pytest
from unittest.mock import patch
import api.index as idx

@pytest.fixture
def client():
    idx.app.config["TESTING"] = True
    with idx.app.test_client() as c:
        yield c

def test_account_manager_can_reassign_client(client, monkeypatch):
    """Verify that an Account Manager can change client AM assignment directly."""
    test_cid = "test_cli_am_reassign_999"
    idx.AGENCY_CLIENTS_STORE.append({
        "id": test_cid,
        "name": "Test Client Brand",
        "company": "Brand Co",
        "package": "Business VIP",
        "am_employee_id": "AM-2072-9827",
        "am_name": "محمود خالد",
        "is_active": True
    })

    test_task = {
        "task_id": "TASK-AM-REASSIGN-001",
        "client_id": test_cid,
        "client_name": "Test Client Brand",
        "am_id": "AM-2072-9827",
        "am_name": "محمود خالد",
        "status": "Pending AM Approval"
    }

    idx._tasks_cache_data = [test_task]
    idx._tasks_cache_time = time.time()

    saved_tasks_capture = []
    def mock_save_client_tasks(tasks, cid):
        saved_tasks_capture.extend(tasks)
        return True

    monkeypatch.setattr(idx, "save_client_tasks", mock_save_client_tasks)

    with client.session_transaction() as sess:
        sess["uid"] = "EMP-5887-5256"
        sess["user"] = "EMP-5887-5256"
        sess["role"] = "account_manager"
        sess["authenticated"] = True

    monkeypatch.setattr(idx, "current_role", lambda: "account_manager")
    monkeypatch.setattr(idx, "current_user_rec", lambda: {
        "employee_id": "EMP-5887-5256",
        "name": "آيه أحمد مجاهد",
        "role": "account_manager"
    })
    monkeypatch.setattr(idx, "is_admin", lambda: False)
    monkeypatch.setattr(idx, "is_manager", lambda: True)

    payload = {
        "id": test_cid,
        "name": "Test Client Brand",
        "company": "Brand Co",
        "package": "Business VIP",
        "am_employee_id": "EMP-0652-9532",
        "am_name": "حبيبه احمد محمد"
    }

    resp = client.put(f"/api/clients/{test_cid}",
                      data=json.dumps(payload),
                      content_type="application/json")

    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.data}"
    data = resp.get_json()
    assert data.get("ok") is True
    assert data.get("am_changed") is True
    assert data.get("client", {}).get("am_employee_id") == "EMP-0652-9532"
    assert data.get("client", {}).get("am_name") == "حبيبه احمد محمد"

    # Verify task was cascaded to the new AM
    assert len(saved_tasks_capture) > 0
    assert saved_tasks_capture[0].get("am_id") == "EMP-0652-9532"
    assert saved_tasks_capture[0].get("am_name") == "حبيبه احمد محمد"

    # Clean up test client and task
    idx.AGENCY_CLIENTS_STORE[:] = [c for c in idx.AGENCY_CLIENTS_STORE if c.get("id") != test_cid]
    idx._tasks_cache_data = None
    idx._tasks_cache_time = 0

def test_plain_employee_cannot_reassign_client(client, monkeypatch):
    """Verify that a plain non-manager employee gets 403 Forbidden."""
    test_cid = "test_cli_emp_block_888"
    idx.AGENCY_CLIENTS_STORE.append({
        "id": test_cid,
        "name": "Block Test",
        "am_employee_id": "AM-2072-9827",
        "am_name": "محمود خالد"
    })

    with client.session_transaction() as sess:
        sess["uid"] = "EMP-TEST-99"
        sess["user"] = "EMP-TEST-99"
        sess["role"] = "employee"
        sess["authenticated"] = True

    monkeypatch.setattr(idx, "current_role", lambda: "employee")
    monkeypatch.setattr(idx, "is_admin", lambda: False)
    monkeypatch.setattr(idx, "is_manager", lambda: False)
    monkeypatch.setattr(idx, "is_content_creator", lambda: False)

    payload = {
        "am_employee_id": "EMP-5887-5256",
        "am_name": "آيه أحمد مجاهد"
    }

    resp = client.put(f"/api/clients/{test_cid}",
                      data=json.dumps(payload),
                      content_type="application/json")

    assert resp.status_code == 403

    idx.AGENCY_CLIENTS_STORE[:] = [c for c in idx.AGENCY_CLIENTS_STORE if c.get("id") != test_cid]
