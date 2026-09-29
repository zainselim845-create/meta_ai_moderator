import pytest
import json
import api.index as idx

def test_am_revision_workflow_and_zero_data_loss(monkeypatch):
    """Test full cycle of submission -> AM revision request -> unlocked re-edit -> resubmission -> approval,
    verifying zero data loss across all steps.
    """
    cid = "client_test_rev_flow"
    task_id = "TASK-REV-TEST-001"
    
    # 1. Initialize task state in test memory
    mock_task = {
        "task_id": task_id,
        "title": "تصميم بوست يوم التأسيس",
        "client_id": cid,
        "client_name": "Test Client",
        "assigned_employee_id": "EMP-8142",
        "assignee_name": "ندى أيمن كمال",
        "am_id": "AM-2072-9827",
        "am_name": "محمود خالد",
        "status": "In Progress",
        "delivery_deadline": "2026-10-01",
        "caption": "الكابشن المبدئي قبل التسليم",
        "visual_idea": "تصميم هادئ بخلفية بيضاء",
        "deliverables": [],
        "submissions_history": []
    }

    monkeypatch.setattr(idx, "sync_from_supabase", lambda: None)
    monkeypatch.setattr(idx, "_find_task_any_client", lambda tid: (mock_task, cid) if tid == task_id else (None, None))
    monkeypatch.setattr(idx, "save_one_task", lambda t, c: None)
    monkeypatch.setattr(idx, "can_see_client", lambda c: True)
    monkeypatch.setattr(idx, "_notify_client_am", lambda c, msg, task=None: None)
    monkeypatch.setattr(idx, "send_telegram_bot_notification", lambda tg, msg: True)
    
    # 2. Step 1: Employee submits initial work
    monkeypatch.setattr(idx, "_my_employee_id", lambda: "EMP-8142")
    monkeypatch.setattr(idx, "current_user_rec", lambda: {"name": "ندى أيمن كمال", "employee_id": "EMP-8142", "role": "employee"})

    with idx.app.test_client() as client:
        with client.session_transaction() as sess:
            sess["uid"] = "nada"
            sess["role"] = "employee"

        submit_payload = {
            "drive_link": "https://drive.google.com/file/d/initial_submission_123/view",
            "notes": "تم تسليم المسودة الأولى للتصميم",
            "deliverables": [{
                "url": "https://drive.google.com/file/d/initial_submission_123/view",
                "filename": "design_v1.png"
            }]
        }
        res = client.post(f"/api/me/tasks/{task_id}/submit", json=submit_payload)
        assert res.status_code == 200, res.get_json()
        assert mock_task["status"] == "Submitted / In Review"
        assert mock_task["drive_link"] == "https://drive.google.com/file/d/initial_submission_123/view"
        assert len(mock_task["submissions_history"]) == 1
        assert mock_task["submissions_history"][0]["drive_link"] == "https://drive.google.com/file/d/initial_submission_123/view"
        assert mock_task["submissions_history"][0]["notes"] == "تم تسليم المسودة الأولى للتصميم"

    # 3. Step 2: AM requests a revision
    monkeypatch.setattr(idx, "_my_employee_id", lambda: "AM-2072-9827")
    monkeypatch.setattr(idx, "current_user_rec", lambda: {"name": "محمود خالد", "employee_id": "AM-2072-9827", "role": "account_manager"})
    monkeypatch.setattr(idx, "is_manager", lambda: True)

    with idx.app.test_client() as client:
        with client.session_transaction() as sess:
            sess["uid"] = "mahmoud"
            sess["role"] = "account_manager"

        am_review_payload = {
            "action": "reject",
            "note": "يرجى تعديل ألوان الشعار لتطابق الهوية وتكبير النص الرئيسي",
            "modification_deadline": "2026-10-02"
        }
        rev_res = client.post(f"/api/tasks/{task_id}/review", json=am_review_payload)
        assert rev_res.status_code == 200, rev_res.get_json()
        
        # Verify Status & Unlocked flags
        assert mock_task["status"] == "Assigned"
        assert mock_task["modification_requested_at"] is not None
        assert mock_task["modification_deadline"] == "2026-10-02"
        assert mock_task["review_note"] == "يرجى تعديل ألوان الشعار لتطابق الهوية وتكبير النص الرئيسي"
        
        # ZERO DATA LOSS VERIFICATION:
        # 1) Initial drive link is preserved!
        assert mock_task["drive_link"] == "https://drive.google.com/file/d/initial_submission_123/view"
        # 2) Initial submission is preserved in history!
        assert len(mock_task["submissions_history"]) >= 1
        assert mock_task["submissions_history"][0]["drive_link"] == "https://drive.google.com/file/d/initial_submission_123/view"
        # 3) Subtask is created
        assert "subtasks" in mock_task and len(mock_task["subtasks"]) >= 1
        subtask = mock_task["subtasks"][-1]
        assert subtask["type"] == "revision"
        assert subtask["revision_number"] == 1
        assert "يرجى تعديل ألوان الشعار" in subtask["title"]
        assert subtask["delivery_deadline"] == "2026-10-02"

    # 4. Step 3: Employee modifies content during revision (MUST NOT be locked)
    monkeypatch.setattr(idx, "_my_employee_id", lambda: "EMP-8142")
    monkeypatch.setattr(idx, "current_user_rec", lambda: {"name": "ندى أيمن كمال", "employee_id": "EMP-8142", "role": "employee"})
    monkeypatch.setattr(idx, "is_manager", lambda: False)

    with idx.app.test_client() as client:
        with client.session_transaction() as sess:
            sess["uid"] = "nada"
            sess["role"] = "employee"

        content_payload = {
            "title": "تصميم بوست يوم التأسيس - نسخة معدلة",
            "caption": "الكابشن بعد التعديل وتكبير النص",
            "visual_idea": "خلفية بلون الهوية الرسمي والشعار بحجم مناسب"
        }
        content_res = client.put(f"/api/tasks/{task_id}/content", json=content_payload)
        assert content_res.status_code == 200, content_res.get_json()
        assert mock_task["caption"] == "الكابشن بعد التعديل وتكبير النص"

    # 5. Step 4: Employee resubmits with updated deliverable
    with idx.app.test_client() as client:
        with client.session_transaction() as sess:
            sess["uid"] = "nada"
            sess["role"] = "employee"

        resubmit_payload = {
            "drive_link": "https://drive.google.com/file/d/revised_submission_456/view",
            "notes": "تم تعديل الشعار وألوان الهوية وتحديث الكابشن",
            "deliverables": [{
                "url": "https://drive.google.com/file/d/revised_submission_456/view",
                "filename": "design_v2_final.png"
            }]
        }
        resub_res = client.post(f"/api/me/tasks/{task_id}/submit", json=resubmit_payload)
        assert resub_res.status_code == 200, resub_res.get_json()

        # Verify status is back to Submitted / In Review
        assert mock_task["status"] == "Submitted / In Review"
        assert mock_task["drive_link"] == "https://drive.google.com/file/d/revised_submission_456/view"
        assert mock_task["modification_requested_at"] is None

        # ZERO DATA LOSS VERIFICATION:
        # submissions_history must contain BOTH submissions!
        history = mock_task["submissions_history"]
        assert len(history) >= 2
        assert any(h["drive_link"] == "https://drive.google.com/file/d/initial_submission_123/view" for h in history)
        assert any(h["drive_link"] == "https://drive.google.com/file/d/revised_submission_456/view" for h in history)

    # 6. Step 5: AM Finalizes & Approves
    monkeypatch.setattr(idx, "_my_employee_id", lambda: "AM-2072-9827")
    monkeypatch.setattr(idx, "current_user_rec", lambda: {"name": "محمود خالد", "employee_id": "AM-2072-9827", "role": "account_manager"})
    monkeypatch.setattr(idx, "is_manager", lambda: True)

    with idx.app.test_client() as client:
        with client.session_transaction() as sess:
            sess["uid"] = "mahmoud"
            sess["role"] = "account_manager"

        approve_res = client.post(f"/api/tasks/{task_id}/review", json={"action": "finalize", "note": "شغل ممتاز ومعتمد"})
        assert approve_res.status_code == 200, approve_res.get_json()

        assert mock_task["status"] == "Completed"
        assert mock_task["completed_at"] is not None
        # All historical submissions remain intact!
        assert len(mock_task["submissions_history"]) >= 2
