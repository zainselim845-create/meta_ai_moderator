import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import api.index as idx

@pytest.fixture(autouse=True)
def mock_supabase_and_cache(monkeypatch):
    monkeypatch.setattr(idx, "sync_from_supabase", lambda *a, **k: None)
    monkeypatch.setattr(idx, "push_setting", lambda *a, **k: None)
    monkeypatch.setattr(idx, "save_one_task", lambda *a, **k: None)
    monkeypatch.setattr(idx, "_notify_client_am", lambda *a, **k: None)
    monkeypatch.setattr(idx, "send_telegram_bot_notification", lambda *a, **k: None)
    monkeypatch.setattr(idx, "get_google_oauth_access_token", lambda *a, **k: None)
    monkeypatch.setattr(idx, "client_month_folder_id", lambda *a, **k: "fake_folder")
    monkeypatch.setattr(idx, "client_drive_folder_id", lambda *a, **k: "fake_folder")
    idx.AGENCY_CLIENTS_STORE = [dict(c) for c in idx.CANONICAL_DEFAULT_CLIENTS]
    idx.sync_am_client_sets()

def test_am_client_isolation_and_visibility():
    """Verify each AM sees only their assigned clients in /api/clients by pure employee_id."""
    idx.sync_am_client_sets()
    with idx.app.test_client() as client:
        # 1. Mahmoud login (AM-2072-9827)
        with client.session_transaction() as sess:
            sess["uid"] = "AM-2072-9827"
            sess["role"] = "account_manager"
            sess["user_rec"] = {"name": "محمود خالد", "employee_id": "AM-2072-9827", "role": "account_manager"}

        res = client.get("/api/clients")
        assert res.status_code == 200
        mahmoud_clients = res.get_json() or []
        m_cids = {c["id"] for c in mahmoud_clients}
        assert "cli_dr_ahmed_1788270119" in m_cids
        assert "cli_sk_1788270118" in m_cids
        assert "cli_انفينيتي_1788270119" in m_cids
        assert "cli_هبه_حافظ_1788431922" in m_cids
        # Verify no Aya clients leaked to Mahmoud
        assert "client_100821894800009" not in m_cids
        assert "cli_ايه_عبدو_1788944266" not in m_cids

        # 2. Habiba login (EMP-0652-9532)
        with client.session_transaction() as sess:
            sess["uid"] = "EMP-0652-9532"
            sess["role"] = "account_manager"
            sess["user_rec"] = {"name": "حبيبه احمد محمد", "employee_id": "EMP-0652-9532", "role": "account_manager"}

        res = client.get("/api/clients")
        assert res.status_code == 200
        habiba_clients = res.get_json() or []
        h_cids = {c["id"] for c in habiba_clients}
        assert "cli_dr_abdallah_1791790876" in h_cids
        assert "cli_dr_abdallah_1791790843" in h_cids
        # Mahmoud's clients must NOT leak to Habiba
        assert "cli_dr_ahmed_1788270119" not in h_cids
        assert "cli_sk_1788270118" not in h_cids

        # 3. Aya login (EMP-5887-5256)
        with client.session_transaction() as sess:
            sess["uid"] = "EMP-5887-5256"
            sess["role"] = "account_manager"
            sess["user_rec"] = {"name": "آيه أحمد مجاهد", "employee_id": "EMP-5887-5256", "role": "account_manager"}

        res = client.get("/api/clients")
        assert res.status_code == 200
        aya_clients = res.get_json() or []
        a_cids = {c["id"] for c in aya_clients}
        assert "client_100821894800009" in a_cids
        assert "cli_معامل_رعاية_1788336726" in a_cids
        # Mahmoud's client Heba Hafez must NOT be with Aya
        assert "cli_هبه_حافظ_1788431922" not in a_cids

def test_pure_id_telegram_chat_resolution():
    """Verify _am_telegram_chat_id resolves pure Telegram chat ID strictly by employee_id."""
    assert idx._am_telegram_chat_id("AM-2072-9827") == "1205102072"
    assert idx._am_telegram_chat_id("EMP-2072-9827") == "1205102072"
    assert idx._am_telegram_chat_id("EMP-5887-5256") == "1199255887"
    assert idx._am_telegram_chat_id("AM-5887-5256") == "1199255887"
    assert idx._am_telegram_chat_id("EMP-0652-9532") == "8845590652"
    assert idx._am_telegram_chat_id("AM-0652-9532") == "8845590652"
    assert idx._am_telegram_chat_id("") == ""

def test_cross_am_client_edit_protection():
    """Verify an AM cannot edit another AM's client."""
    with idx.app.test_client() as client:
        # Habiba tries to update Aya's client
        with client.session_transaction() as sess:
            sess["uid"] = "EMP-0652-9532"
            sess["role"] = "account_manager"
            sess["user_rec"] = {"name": "حبيبه احمد محمد", "employee_id": "EMP-0652-9532", "role": "account_manager"}

        res = client.post("/api/clients/client_100821894800009", json={"name": "Hacked Domya"})
        assert res.status_code == 403

        # Admin CAN update client and reassign AM
        with client.session_transaction() as sess:
            sess["uid"] = "admin"
            sess["role"] = "admin"
            sess["user_rec"] = {"name": "Admin", "role": "admin"}

        res = client.post("/api/clients/cli_dr_ahmed_1788270119", json={"package": "Business VIP"})
        assert res.status_code == 200

def test_cross_am_task_dates_and_coassign_protection(monkeypatch):
    """Verify an AM cannot modify deadlines or co-assign tasks for another AM's client."""
    mock_tasks = [
        {
            "task_id": "TASK-AYA-001",
            "client_id": "client_100821894800009",
            "client_name": "Domya Marketing Agency",
            "am_id": "EMP-5887-5256",
            "am_name": "آيه أحمد مجاهد",
            "assigned_employee_id": "EMP-8086-4520",
            "status": "In Progress"
        },
        {
            "task_id": "TASK-MAHMOUD-001",
            "client_id": "cli_dr_ahmed_1788270119",
            "client_name": "دكتور أحمد حمدي",
            "am_id": "AM-2072-9827",
            "am_name": "محمود خالد",
            "assigned_employee_id": "EMP-2945-2364",
            "status": "In Progress"
        }
    ]
    monkeypatch.setattr(idx, "_all_tasks_db", lambda: mock_tasks)

    with idx.app.test_client() as client:
        # Mahmoud tries to edit dates on Aya's task
        with client.session_transaction() as sess:
            sess["uid"] = "AM-2072-9827"
            sess["role"] = "account_manager"
            sess["user_rec"] = {"name": "محمود خالد", "employee_id": "AM-2072-9827", "role": "account_manager"}

        res = client.post("/api/tasks/TASK-AYA-001/dates", json={"delivery_deadline": "2026-10-05"})
        assert res.status_code == 403

        # Mahmoud CAN edit dates on his OWN task
        res = client.post("/api/tasks/TASK-MAHMOUD-001/dates", json={"delivery_deadline": "2026-10-05"})
        assert res.status_code == 200
