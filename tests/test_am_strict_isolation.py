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

def test_am_client_isolation_and_visibility():
    """Verify each AM sees only their assigned clients in /api/clients."""
    with idx.app.test_client() as client:
        # 1. Habiba login
        with client.session_transaction() as sess:
            sess["uid"] = "EMP-0652-9532"
            sess["role"] = "account_manager"
            sess["user_rec"] = {"name": "حبيبه احمد محمد", "employee_id": "EMP-0652-9532", "role": "account_manager"}

        res = client.get("/api/clients")
        assert res.status_code == 200
        habiba_clients = res.get_json() or []
        h_cids = {c["id"] for c in habiba_clients}
        assert "cli_dr_ahmed_1788270119" in h_cids
        assert "cli_sk_1788270118" in h_cids
        assert "cli_انفينيتي_1788270119" in h_cids
        assert "cli_د_حسام_مشعل_1790680406" in h_cids
        assert len(habiba_clients) == 4
        # Verify no Aya clients leaked
        assert "client_100821894800009" not in h_cids
        assert "cli_ايه_عبدو_1788944266" not in h_cids
        assert "cli_eng_1790243022" not in h_cids

        # 2. Aya login
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
        assert "cli_هبه_حافظ_1788431922" in a_cids
        assert "cli_dr_ahmed_fahmy_1788683119" in a_cids
        assert "cli_dr_hadeer_1788684282" in a_cids
        assert "cli_hayat_dental_center_1788685057" in a_cids
        assert "cli_dr_shimaa_atef_1788298157" in a_cids
        assert "cli_dr_shahenda_1788685119" in a_cids
        assert "cli_ايه_عبدو_1788944266" in a_cids
        assert "cli_eng_1790243022" in a_cids
        assert len(aya_clients) == 10
        # Verify no Habiba clients leaked
        assert "cli_dr_ahmed_1788270119" not in a_cids
        assert "cli_د_حسام_مشعل_1790680406" not in a_cids

        # 3. Mahmoud login
        with client.session_transaction() as sess:
            sess["uid"] = "AM-2072-9827"
            sess["role"] = "account_manager"
            sess["user_rec"] = {"name": "محمود خالد", "employee_id": "AM-2072-9827", "role": "account_manager"}

        res = client.get("/api/clients")
        assert res.status_code == 200
        mahmoud_clients = res.get_json() or []
        assert len(mahmoud_clients) == 0

def test_cross_am_client_edit_protection():
    """Verify an AM cannot edit another AM's client, nor reassign AM."""
    with idx.app.test_client() as client:
        # Habiba tries to update Aya's client
        with client.session_transaction() as sess:
            sess["uid"] = "EMP-0652-9532"
            sess["role"] = "account_manager"
            sess["user_rec"] = {"name": "حبيبه احمد محمد", "employee_id": "EMP-0652-9532", "role": "account_manager"}

        res = client.post("/api/clients/client_100821894800009", json={"name": "Hacked Domya"})
        assert res.status_code == 403

        # Habiba tries to reassign her own client's AM to someone else
        res = client.post("/api/clients/cli_dr_ahmed_1788270119", json={"am_employee_id": "EMP-5887-5256"})
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
            "task_id": "TASK-HABIBA-001",
            "client_id": "cli_dr_ahmed_1788270119",
            "client_name": "دكتور أحمد حمدي",
            "am_id": "EMP-0652-9532",
            "am_name": "حبيبه احمد محمد",
            "assigned_employee_id": "EMP-2945-2364",
            "status": "In Progress"
        }
    ]
    monkeypatch.setattr(idx, "_all_tasks_db", lambda: mock_tasks)

    with idx.app.test_client() as client:
        # Habiba tries to edit dates on Aya's task
        with client.session_transaction() as sess:
            sess["uid"] = "EMP-0652-9532"
            sess["role"] = "account_manager"
            sess["user_rec"] = {"name": "حبيبه احمد محمد", "employee_id": "EMP-0652-9532", "role": "account_manager"}

        res = client.post("/api/tasks/TASK-AYA-001/dates", json={"delivery_deadline": "2026-10-05"})
        assert res.status_code == 403

        # Habiba tries to co-assign on Aya's task
        res = client.post("/api/tasks/TASK-AYA-001/co-assign", json={"secondary_employee_id": "EMP-8148"})
        assert res.status_code == 403

        # Aya tries to edit dates on Habiba's task
        with client.session_transaction() as sess:
            sess["uid"] = "EMP-5887-5256"
            sess["role"] = "account_manager"
            sess["user_rec"] = {"name": "آيه أحمد مجاهد", "employee_id": "EMP-5887-5256", "role": "account_manager"}

        res = client.post("/api/tasks/TASK-HABIBA-001/dates", json={"delivery_deadline": "2026-10-05"})
        assert res.status_code == 403

        # Aya CAN edit dates on her OWN task
        res = client.post("/api/tasks/TASK-AYA-001/dates", json={"delivery_deadline": "2026-10-05"})
        assert res.status_code == 200
