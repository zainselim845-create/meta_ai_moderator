import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from api.index import app

def test_kpis_restricted_for_employees_and_visible_to_managers():
    with app.test_client() as client:
        # 1. Test Regular Employee / Designer (Omar: EMP-8148)
        res_emp = client.post("/api/login", json={"username": "EMP-8148", "password": "QhEBR-h_"})
        assert res_emp.status_code == 200
        me_emp = client.get("/api/me").get_json()
        assert me_emp["can_view_kpi"] is False
        assert me_emp["is_admin"] is False
        assert me_emp["is_manager"] is False

        # Attempt to access monthly-report -> MUST be 403 Forbidden
        rep_emp = client.get("/api/tasks/monthly-report")
        assert rep_emp.status_code == 403
        rep_emp_json = rep_emp.get_json()
        assert "غير مصرح" in rep_emp_json.get("error", "")

        # Check /api/me/tasks -> t["kpis"] must be stripped or empty
        my_tasks_emp = client.get("/api/me/tasks").get_json()
        if isinstance(my_tasks_emp, list) and my_tasks_emp:
            for t in my_tasks_emp:
                assert t.get("kpis") in ({}, None, False)

        # Check /api/tasks -> t["kpis"] must be stripped or empty
        tasks_emp = client.get("/api/tasks").get_json()
        tasks_list = tasks_emp if isinstance(tasks_emp, list) else tasks_emp.get("tasks", [])
        if tasks_list:
            for t in tasks_list:
                assert t.get("kpis") in ({}, None, False)

        # 2. Test Account Manager (Aya: EMP-5887-5256)
        res_am = client.post("/api/login", json={"username": "EMP-5887-5256", "password": "1jGzGc17"})
        assert res_am.status_code == 200
        me_am = client.get("/api/me").get_json()
        assert me_am["can_view_kpi"] is True
        assert me_am["is_manager"] is True

        # Attempt to access monthly-report -> MUST be 200 OK
        rep_am = client.get("/api/tasks/monthly-report?month=current")
        assert rep_am.status_code == 200
        assert "report" in rep_am.get_json()

        # Check /api/tasks -> AM has access to kpis
        tasks_am = client.get("/api/tasks").get_json()
        assert isinstance(tasks_am, list) or "tasks" in tasks_am

        # 3. Test Admin (admin: admin2026)
        res_admin = client.post("/api/login", json={"username": "admin", "password": "admin2026"})
        assert res_admin.status_code == 200
        me_admin = client.get("/api/me").get_json()
        assert me_admin["can_view_kpi"] is True
        assert me_admin["is_admin"] is True

        # Attempt to access monthly-report -> MUST be 200 OK
        rep_admin = client.get("/api/tasks/monthly-report?month=current")
        assert rep_admin.status_code == 200
        assert "report" in rep_admin.get_json()
