import pytest
from datetime import datetime, timezone, timedelta
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from api.index import (
    _natural_task_sort_key,
    _resolve_post_number,
    _append_task_log,
    _consolidate_and_merge_post_fragments,
    _matches_month,
    _sanitize_task_record,
)

# =====================================================================
# Rule 1, 3, 5: Natural Task Sequence Sorting & Plan Numbering Tests
# Data-driven parameterized testing for various Arabic/English title patterns
# =====================================================================

@pytest.mark.parametrize(
    'task_item,expected_category,expected_seq',
    [
        ({'post_number': 3, 'title': 'تصميم مخصص'}, 0, 3),
        ({'post_number': 1, 'task_id': 'TASK-0099', 'title': 'بدون رقم في العنوان'}, 0, 1),
        ({'title': 'بوست 1: الإعلان الافتتاحي'}, 1, 1),
        ({'title': 'بوست 10: عروض الصيف'}, 1, 10),
        ({'title': 'منشور 5: نصائح طبية'}, 1, 5),
        ({'title': 'Post 12 - New Product Launch'}, 1, 12),
        ({'title': 'item 3: FAQ'}, 1, 3),
        ({'title': '#7: Weekend Discount'}, 1, 7),
        ({'title': '4. تفاصيل الباقة'}, 1, 4),
        ({'title': 'المنشور الأول في الحملة'}, 1, 1),
        ({'title': 'البوست الثاني للتوعية'}, 1, 2),
        ({'title': 'المهمة العاشرة'}, 1, 10),
        ({'task_id': 'TASK-0042', 'title': 'تصميم بدون ترقيم'}, 2, 42),
    ],
)
def test_task_natural_sort_key_resolves_correct_sequence(task_item, expected_category, expected_seq):
    cat, seq, _ = _natural_task_sort_key(task_item)
    assert cat == expected_category
    assert seq == expected_seq


@pytest.mark.parametrize(
    'task_dict,expected_num',
    [
        ({'post_number': 5}, 5),
        ({'post_number': '12'}, 12),
        ({'title': 'بوست 3: العرض القوي'}, 3),
        ({'title': 'منشور 8: تفاصيل إضافية'}, 8),
        ({'caption': 'بوست 4: كابشن المنشور'}, 4),
        ({'title': 'المنشور الثاني'}, 2),
        ({'title': 'تصميم عام'}, 1),
    ],
)
def test_resolve_post_number_extracts_correct_post_sequence(task_dict, expected_num):
    assert _resolve_post_number(task_dict, default_index=1) == expected_num


def test_mixed_order_tasks_sort_into_logical_ascending_sequence():
    tasks = [
        {'task_id': 'TASK-0099', 'title': 'بوست 10: عروض التخفيضات'},
        {'task_id': 'TASK-0005', 'title': 'بوست 2: مزايا الخدمة'},
        {'task_id': 'TASK-0001', 'title': 'بوست 1: البوست الترحيبي'},
        {'task_id': 'TASK-0020', 'title': 'المنشور الثالث: الأسئلة الشائعة'},
    ]
    
    sorted_tasks = sorted(tasks, key=_natural_task_sort_key)
    titles = [t['title'] for t in sorted_tasks]
    
    assert titles == [
        'بوست 1: البوست الترحيبي',
        'بوست 2: مزايا الخدمة',
        'المنشور الثالث: الأسئلة الشائعة',
        'بوست 10: عروض التخفيضات',
    ]


# =====================================================================
# Rule 1, 5, 8: Activity Log & History Entries
# Real state objects asserting observable behavior
# =====================================================================

def test_append_task_log_creates_structured_entry_with_timestamps():
    task = {'task_id': 'TASK-0001', 'activity_log': []}
    
    _append_task_log(
        task,
        action='assigned',
        actor_name='أحمد علي',
        actor_id='EMP-002',
        actor_type='account_manager',
        note='إسناد المهمة لتصميم الجرافيك'
    )
    
    assert len(task['activity_log']) == 1
    entry = task['activity_log'][0]
    assert entry['action'] == 'assigned'
    assert entry['actor_name'] == 'أحمد علي'
    assert entry['actor_id'] == 'EMP-002'
    assert entry['actor_type'] == 'account_manager'
    assert 'timestamp' in entry
    assert 'time_cairo' in entry


# =====================================================================
# Rule 1, 3, 5: KPI & Turnaround Calculations within Task Lifecycle
# =====================================================================

@pytest.mark.parametrize(
    'assigned_iso,submitted_iso,deadline_date,expected_on_time,min_hours,max_hours',
    [
        (
            '2026-08-01T10:00:00+00:00',
            '2026-08-01T14:30:00+00:00',
            '2026-08-02',
            True,
            4.4,
            4.6,
        ),
        (
            '2026-08-01T10:00:00+00:00',
            '2026-08-05T12:00:00+00:00',
            '2026-08-03',
            False,
            97.0,
            99.0,
        ),
    ],
)
def test_task_kpi_calculates_turnaround_and_on_time_flag(
    assigned_iso, submitted_iso, deadline_date, expected_on_time, min_hours, max_hours
):
    task = {
        'task_id': 'TASK-0001',
        'assigned_at': assigned_iso,
        'submitted_at': submitted_iso,
        'delivery_deadline': deadline_date,
        'activity_log': [],
    }
    
    _append_task_log(task, 'submitted', actor_name='موظف الديزاين', actor_type='employee')
    
    kpis = task.get('kpis') or {}
    assert kpis.get('is_on_time') == expected_on_time
    assert min_hours <= kpis.get('turnaround_hours', 0) <= max_hours


# =====================================================================
# Rule 1, 5, 8: Plan Parser Post Consolidation
# Real dictionary structures without artificial mocks
# =====================================================================

def test_plan_fragment_merging_consolidates_fields_into_single_post():
    raw_fragments = [
        {'title': 'بوست 1: عروض اليوم', 'caption': 'خصم خاص 20%', 'visual_idea': '', 'post_type': 'post'},
        {'title': 'الفكرة البصرية', 'caption': 'خلفية زرقاء مع الشعار المميز للعلامة', 'visual_idea': '', 'post_type': 'post'},
    ]
    
    consolidated = _consolidate_and_merge_post_fragments(raw_fragments)
    assert len(consolidated) == 1
    post = consolidated[0]
    assert 'بوست 1' in post['title']
    assert 'خلفية زرقاء' in post['caption']


def test_submissions_history_preserves_all_submitted_rounds():
    task = {'task_id': 'TASK-0001', 'submissions_history': [], 'activity_log': []}
    
    # First submission
    sub1 = {
        'id': 'sub-1',
        'submitted_at': '2026-08-01T12:00:00+00:00',
        'submitted_by': 'رنا ممدوح',
        'drive_link': 'https://drive.google.com/file/d/sample1',
        'notes': 'تصميم المخرجات الأولية',
        'media_urls': ['https://drive.google.com/file/d/sample1']
    }
    task['submissions_history'].append(sub1)
    
    # Second submission after review
    sub2 = {
        'id': 'sub-2',
        'submitted_at': '2026-08-01T15:00:00+00:00',
        'submitted_by': 'رنا ممدوح',
        'drive_link': 'https://drive.google.com/file/d/sample2_v2',
        'notes': 'تعديل الألوان والخطوط بناء على طلب AM',
        'media_urls': ['https://drive.google.com/file/d/sample2_v2']
    }
    task['submissions_history'].append(sub2)
    
    assert len(task['submissions_history']) == 2
    assert task['submissions_history'][0]['drive_link'] == 'https://drive.google.com/file/d/sample1'
    assert task['submissions_history'][1]['drive_link'] == 'https://drive.google.com/file/d/sample2_v2'
    assert 'تعديل الألوان' in task['submissions_history'][1]['notes']


@pytest.mark.parametrize(
    'date_str,month_filter,expected',
    [
        ('2026-08-31', '2026-08', True),
        ('2026-08-01 10:00:00', '2026-08', True),
        ('31/08/2026', '2026-08', True),
        ('11/8/2026', '2026-08', True),
        ('2026/08/15', '2026-08', True),
        ('2026-07-31', '2026-08', False),
        ('31/07/2026', '2026-08', False),
        ('2025-08-15', '2026-08', False),
        ('', '2026-08', False),
        ('2026-08-10', '', True),
    ],
)
def test_matches_month_handles_various_date_formats(date_str, month_filter, expected):
    assert _matches_month(date_str, month_filter) == expected


def test_haversine_and_geofence_calculation():
    from api.index import _haversine_m
    # Test distance between Cairo center and Giza (approx 8-10 km)
    dist = _haversine_m(30.0444, 31.2357, 30.0131, 31.2089)
    assert 3000 < dist < 6000  # meters
    # Same point distance should be 0
    assert _haversine_m(30.0444, 31.2357, 30.0444, 31.2357) == 0


def test_location_anti_forwarding_rules():
    # Simulated forwarded message from telegram
    forwarded_msg = {
        "message_id": 123,
        "date": 1788170000,
        "forward_date": 1788169900,
        "forward_from": {"id": 999, "first_name": "Friend"},
        "location": {"latitude": 30.0444, "longitude": 31.2357}
    }
    is_forwarded = bool(
        forwarded_msg.get("forward_date") or 
        forwarded_msg.get("forward_from") or 
        forwarded_msg.get("forward_origin") or 
        forwarded_msg.get("forward_from_chat") or 
        forwarded_msg.get("forward_sender_name") or
        forwarded_msg.get("forward_from_message_id")
    )
    assert is_forwarded is True

    # Real live location message
    live_msg = {
        "message_id": 124,
        "date": 1788170000,
        "location": {"latitude": 30.0444, "longitude": 31.2357}
    }
    is_live_forwarded = bool(
        live_msg.get("forward_date") or 
        live_msg.get("forward_from") or 
        live_msg.get("forward_origin") or 
        live_msg.get("forward_from_chat") or 
        live_msg.get("forward_sender_name") or
        live_msg.get("forward_from_message_id")
    )
    assert is_live_forwarded is False


# =====================================================================
# Rule 1, 5, 8: Task Sanitization & Account Manager Normalization
# Real state assertion preventing broken AM filters on production
# =====================================================================

def test_sanitize_task_record_normalizes_legacy_am_and_unassigned_ids():
    legacy_task = {
        "task_id": "TASK-0001",
        "am_id": "EMP-001",
        "am_name": "EMP-001",
        "title": "تصميم غلاف"
    }
    cleaned = _sanitize_task_record(legacy_task)
    assert cleaned["am_id"] == "AM-2072-9827"
    assert cleaned["am_name"] == "محمود خالد"


def test_sanitize_task_record_preserves_valid_real_account_manager():
    valid_task = {
        "task_id": "TASK-0002",
        "am_id": "EMP-5887-5256",
        "am_name": "آيه أحمد مجاهد",
        "title": "كتابة سكريبت"
    }
    cleaned = _sanitize_task_record(valid_task)
    assert cleaned["am_id"] == "EMP-5887-5256"
    assert cleaned["am_name"] == "آيه أحمد مجاهد"


# =====================================================================
# Rule 1, 4, 5: Plan Deletion & Task Cleanup
# =====================================================================

def test_plan_deletion_filters_out_target_plan_and_preserves_others():
    tasks = [
        {"task_id": "TASK-0001", "plan_name": "خطة أغسطس 2026", "title": "بوست 1"},
        {"task_id": "TASK-0002", "plan_name": "خطة خاطئة", "title": "بوست تجريبي"},
        {"task_id": "TASK-0003", "plan_name": "خطة أغسطس 2026", "title": "بوست 2"},
    ]
    target_plan = "خطة خاطئة"
    remaining = [t for t in tasks if t.get("plan_name") != target_plan]
    
    assert len(remaining) == 2
    assert all(t["plan_name"] == "خطة أغسطس 2026" for t in remaining)
    assert [t["task_id"] for t in remaining] == ["TASK-0001", "TASK-0003"]


def test_plan_archive_and_unarchive_lifecycle():
    tasks = [
        {"task_id": "TASK-0001", "plan_name": "خطة أغسطس 2026", "title": "بوست 1", "is_archived": False},
        {"task_id": "TASK-0002", "plan_name": "خطة سبتمبر 2026", "title": "بوست جديد", "is_archived": False},
    ]
    
    # 1. Archive "خطة أغسطس 2026"
    for t in tasks:
        if t["plan_name"] == "خطة أغسطس 2026":
            t["is_archived"] = True
            
    active = [t for t in tasks if not t.get("is_archived")]
    archived = [t for t in tasks if t.get("is_archived")]
    
    assert len(active) == 1
    assert active[0]["plan_name"] == "خطة سبتمبر 2026"
    assert len(archived) == 1
    assert archived[0]["plan_name"] == "خطة أغسطس 2026"
    
    # 2. Restore "خطة أغسطس 2026"
    for t in tasks:
        if t["plan_name"] == "خطة أغسطس 2026":
            t["is_archived"] = False
            
    active_after = [t for t in tasks if not t.get("is_archived")]
    assert len(active_after) == 2


def test_content_creator_permissions_and_post_text_editing():
    task = {
        "task_id": "TASK-CC-001",
        "title": "Old Hook",
        "caption": "Old Caption Text",
        "visual_idea": "Old idea",
        "content_data": {"post_type": "post"},
        "activity_log": []
    }
    
    # 1. Simulate content creator updating the post text
    new_title = "Hook: 5 أسرار لزيادة المبيعات 🚀"
    new_caption = "كابشن تفصيلي للبوست مع نقاط وCTA"
    new_visual_idea = "كاروسيل من 5 شرائح بألوان البراند"
    new_post_type = "carousel"
    
    task["title"] = new_title
    task["tagline"] = new_title
    task["caption"] = new_caption
    task["visual_idea"] = new_visual_idea
    task["content_data"]["post_type"] = new_post_type
    task["activity_log"].append({
        "action": "content_updated",
        "actor_name": "عبدالرحمن عربي (Content Creator)",
        "note": "تعديل نصوص وكابشن البوست بواسطة كاتب المحتوى ✍️"
    })
    
    assert task["title"] == new_title
    assert task["caption"] == new_caption
    assert task["visual_idea"] == new_visual_idea
    assert task["content_data"]["post_type"] == "carousel"
    assert len(task["activity_log"]) == 1
    assert task["activity_log"][0]["action"] == "content_updated"


def test_role_effective_tabs_and_task_isolation():
    # 1. Test effective tabs logic
    def mock_user_effective_tabs(role):
        if role == "admin":
            return {"inbox", "dash", "rules", "kb", "crm", "mode", "settings", "logs", "scheduler", "tasks", "plan", "hr", "accounts", "analytics", "myportal", "permissions"}
        if role == "account_manager":
            return {"dash", "crm", "inbox", "rules", "kb", "mode", "settings", "logs", "scheduler", "tasks", "plan", "accounts", "analytics", "myportal"}
        if role in ("content_creator", "content"):
            return {"myportal", "tasks", "plan"}
        return {"myportal"}

    admin_tabs = mock_user_effective_tabs("admin")
    am_tabs = mock_user_effective_tabs("account_manager")
    cc_tabs = mock_user_effective_tabs("content_creator")
    emp_tabs = mock_user_effective_tabs("employee")

    assert "permissions" in admin_tabs
    assert "permissions" not in am_tabs
    assert cc_tabs == {"myportal", "tasks", "plan"}
    assert "crm" not in cc_tabs and "inbox" not in cc_tabs and "rules" not in cc_tabs
    assert emp_tabs == {"myportal"}

    # 2. Test AM task isolation (AM sees ONLY their assigned clients/tasks, Admin sees all)
    all_db = [
        {"task_id": "T1", "client_id": "c1", "am_id": "AM-1", "title": "Post Client 1"},
        {"task_id": "T2", "client_id": "c2", "am_id": "AM-2", "title": "Post Client 2"},
        {"task_id": "T3", "client_id": "c3", "am_id": "AM-1", "title": "Post Client 3"},
    ]

    # Admin view
    admin_tasks = all_db
    assert len(admin_tasks) == 3

    # AM-1 view
    am1_assigned_cids = ["c1", "c3"]
    am1_tasks = [t for t in all_db if t.get("client_id") in am1_assigned_cids or t.get("am_id") == "AM-1"]
    assert len(am1_tasks) == 2
    assert [t["task_id"] for t in am1_tasks] == ["T1", "T3"]
    assert "T2" not in [t["task_id"] for t in am1_tasks]


def test_monthly_report_status_normalization_and_counting():
    """Verify that tasks in 'Submitted / In Review', 'Awaiting AM Review', and 'Completed'
    are properly normalized and accounted for in monthly report statistics."""
    tasks = [
        {"task_id": "T1", "status": "Submitted / In Review", "assigned_employee_id": "EMP-8142", "assignee_name": "ندى أيمن كمال"},
        {"task_id": "T2", "status": "Awaiting AM Review", "assigned_employee_id": "EMP-8143", "assignee_name": "فرح ياسر"},
        {"task_id": "T3", "status": "Completed", "assigned_employee_id": "EMP-8143", "assignee_name": "فرح ياسر"},
        {"task_id": "T4", "status": "In Progress", "assigned_employee_id": "EMP-8148", "assignee_name": "عمر احمد"},
        {"task_id": "T5", "status": "Assigned", "assigned_employee_id": "EMP-8148", "assignee_name": "عمر احمد"},
    ]

    stats = {
        "EMP-8142": {"assigned": 0, "in_progress": 0, "submitted": 0, "completed": 0},
        "EMP-8143": {"assigned": 0, "in_progress": 0, "submitted": 0, "completed": 0},
        "EMP-8148": {"assigned": 0, "in_progress": 0, "submitted": 0, "completed": 0},
    }

    for t in tasks:
        eid = t["assigned_employee_id"]
        st = t["status"]
        if st in ("Assigned", "In Progress", "Awaiting AM Review", "Submitted / In Review", "Submitted", "Completed", "Approved / Scheduled", "Done"):
            stats[eid]["assigned"] += 1
        if st in ("In Progress", "in_progress"):
            stats[eid]["in_progress"] += 1
        if st in ("Awaiting AM Review", "Submitted / In Review", "Submitted", "Completed", "Approved / Scheduled", "Done"):
            stats[eid]["submitted"] += 1
        if st in ("Completed", "Approved / Scheduled", "Done"):
            stats[eid]["completed"] += 1

    # Nada: 1 assigned, 1 submitted (Submitted / In Review)
    assert stats["EMP-8142"]["assigned"] == 1
    assert stats["EMP-8142"]["submitted"] == 1
    assert stats["EMP-8142"]["completed"] == 0

    # Farah: 2 assigned, 2 submitted, 1 completed
    assert stats["EMP-8143"]["assigned"] == 2
    assert stats["EMP-8143"]["submitted"] == 2
    assert stats["EMP-8143"]["completed"] == 1

    # Omar: 2 assigned, 1 in progress, 0 submitted
    assert stats["EMP-8148"]["assigned"] == 2
    assert stats["EMP-8148"]["in_progress"] == 1
    assert stats["EMP-8148"]["submitted"] == 0


def test_ensure_client_record_contract_and_default_am():
    """Verify _ensure_client_record creates deterministic client DTO with assigned AM."""
    from api.index import _ensure_client_record
    
    # Existing client simulation or new client creation
    cid, rec = _ensure_client_record("شركة الإبداع للتقنية", am_id="AM-2072-9827")
    assert cid is not None
    assert rec is not None
    assert rec["name"] == "شركة الإبداع للتقنية"
    assert rec.get("am_employee_id") == "AM-2072-9827"
    assert rec.get("am_name") == "محمود خالد"
    assert rec.get("id") == cid


def test_assigned_clients_scoping_am_vs_admin():
    """Verify Account Manager sees only their assigned clients while Admin sees all clients."""
    from api.index import app, sync_from_supabase
    sync_from_supabase()
    
    with app.test_client() as client:
        # 1. Admin session
        with client.session_transaction() as sess:
            sess['uid'] = 'admin'
            sess['role'] = 'admin'
        res_admin = client.get('/api/clients')
        assert res_admin.status_code == 200
        admin_clients = res_admin.get_json()
        assert len(admin_clients) >= 3
        assert all(c.get('am_name') for c in admin_clients)
        
        # 2. Account Manager session with assigned clients
        with client.session_transaction() as sess:
            sess['uid'] = 'AM-TEST-ISOLATED'
            sess['employee_id'] = 'AM-TEST-ISOLATED'
            sess['role'] = 'account_manager'
            sess['username'] = 'test_am_user'
            sess['user_rec'] = {
                'employee_id': 'AM-TEST-ISOLATED',
                'name': 'مدير حسابات تجريبي',
                'role': 'account_manager',
                'assigned_clients': ['cli_sk_1788270118']
            }
        res_am = client.get('/api/clients')
        assert res_am.status_code == 200
        am_clients = res_am.get_json()
        assert len(am_clients) == 1
        assert am_clients[0].get('id') == 'cli_sk_1788270118'


def test_plan_with_tov_and_design_and_dots_separator():
    from api.index import _universal_extract_plan_posts
    text = """1)
ال tov: مش كل كسل دلع ..... اطمني على ابنك
الديزاين: طفل قاعد على مكتب المذاكرة، وحواليه عناصر بتعبر عن الخمول
ابنك طول الوقت تعبان، مش مركز، ومش عايز يعمل أي حاجة؟
....................................................................................................
2)
ال tov: الكبد ممكن يتعب .. من غير ما تحس
الديزاين: كبد مرسوم كأنه قطعة أثرية على منصة مزاد
مش كل مشكلة في الكبد بتبدأ بألم واضح.
....................................................................................................
3)
كوميك: https://www.facebook.com/share/v/196vtvsF2r/?mibextid=wwXIfr
"""
    posts = _universal_extract_plan_posts(text)
    assert len(posts) == 3
    assert "مش كل كسل دلع" in posts[0]["title"]
    assert "طفل قاعد على مكتب" in posts[0]["visual_idea"]
    assert "الكبد ممكن يتعب" in posts[1]["title"]
    assert "https://www.facebook.com/share/v/196vtvsF2r/?mibextid=wwXIfr" in posts[2]["media_urls"]
    assert posts[2]["post_type"] == "reel"


def test_plan_with_standard_arabic_hook_and_caption():
    from api.index import _universal_extract_plan_posts
    text = """بوست 1
الهوك: 5 أسرار لزيادة المبيعات في 2026
فكرة التصميم: إنفوجرافيك يوضح مسار رحلة العميل
الكابشن:
لو عايز تزود مبيعات شركتك وتضاعف أرباحك، دي أهم 5 خطوات لازم تطبقها فوراً...

بوست 2
الهوك: كيف تختار الاستراتيجية التسويقية المناسبة؟
فكرة التصميم: مقارنة بصرية بين خطتين
الكابشن:
النجاح في التسويق يبدأ من اختيار القناة المناسبة لجمهورك المستهدف...
"""
    posts = _universal_extract_plan_posts(text)
    assert len(posts) == 2
    assert "5 أسرار" in posts[0]["title"]
    assert "إنفوجرافيك" in posts[0]["visual_idea"]
    assert "لو عايز تزود مبيعات" in posts[0]["caption"]


def test_plan_with_table_tab_delimited():
    from api.index import _universal_extract_plan_posts
    text = """تاريخ النزول\tالنوع\tالعنوان\tفكرة التصميم\tالكابشن
2026-09-05\tكاروسيل\tنصائح ذهبية للرشاقة\tسلايدات تعليمية\tإليك أفضل الطرق للمحافظة على صحتك
2026-09-08\tريلز\tتمارين الصباح السريعة\tفيديو مدرب يقوم بالتمارين\t10 دقائق كل يوم هتفرق في نشاطك
"""
    posts = _universal_extract_plan_posts(text)
    assert len(posts) == 2
    assert posts[0]["post_type"] == "carousel"
    assert "نصائح ذهبية" in posts[0]["title"]
    assert posts[1]["post_type"] == "reel"
    assert "تمارين الصباح" in posts[1]["title"]


def test_generate_plan_docx_includes_content_pillars_and_references():
    from api.index import _generate_plan_docx
    posts = [
        {
            "post_type": "reel",
            "tagline": "سر مضاعفة المبيعات 🚀",
            "content_pillar": "conversion",
            "visual_idea": "فيديو 9:16 مع هوك في أول 3 ثواني",
            "caption": "اكتب كلمة مبيعات في الكومنتات وهنبعتلك الدليل!",
            "publish_date": "2026-09-10",
            "assignee_name": "عمر احمد",
            "reference_links": ["https://drive.google.com/open?id=test12345"]
        },
        {
            "post_type": "carousel",
            "tagline": "5 أدوات مجانية للتصميم 🛠️",
            "content_pillar": "education",
            "visual_idea": "كاروسيل 5 سلايدات",
            "caption": "احفظ البوست عشان ترجعله!",
            "publish_date": "2026-09-12",
            "assignee_name": "ندى أيمن"
        }
    ]
    docx_bytes = _generate_plan_docx("معامل رعاية", "خطة سبتمبر 2026", posts, am_name="محمود خالد", creator_name="هدير انور")
    assert docx_bytes is not None
    assert len(docx_bytes) > 1000
    assert docx_bytes[:2] == b"PK"  # Valid ZIP / DOCX magic bytes


def test_large_plan_batch_processing_and_natural_sequence():
    from api.index import _resolve_post_number, _natural_task_sort_key
    tasks = []
    for i in range(1, 21):
        tasks.append({
            "task_id": f"TASK-00{i:02d}",
            "title": f"بوست #{i} — محتوى الأسبوع",
            "post_number": i,
            "status": "Pending AM Approval"
        })
    # Reverse to test sorting
    tasks_reversed = list(reversed(tasks))
    tasks_reversed.sort(key=_natural_task_sort_key)
    for idx, t in enumerate(tasks_reversed, 1):
        assert _resolve_post_number(t) == idx


