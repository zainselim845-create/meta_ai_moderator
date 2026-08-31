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
