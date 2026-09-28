"""
Test the new bulk date update endpoint for plans:
1. Test unified mode (setting same date for all tasks in a plan)
2. Test sequential mode (spreading tasks evenly across a month)
3. Test interval mode (starting from a date and incrementing by X days)
4. Verify all date fields are properly synced
"""
import sys, os, unittest, json

# Ensure project root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from api.index import app, _all_tasks_db, save_one_task

class TestBulkPlanDates(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        # Seed test tasks for a plan
        self.test_plan = "خطة اختبار المواعيد الجماعية — سبتمبر 2026"
        self.client_id = "cli_test_bulk_dates"
        self.created_task_ids = []

        for i in range(1, 6):
            tid = f"TASK-TESTDATE-{i:03d}"
            t = {
                "task_id": tid,
                "post_number": i,
                "client_id": self.client_id,
                "client_name": "عميل اختبار المواعيد",
                "plan_name": self.test_plan,
                "file_name": self.test_plan,
                "title": f"بوست اختبار {i}",
                "status": "Pending AM Approval",
                "publish_date": "",
                "delivery_deadline": "",
                "scheduled_start_date": "",
                "modification_deadline": ""
            }
            save_one_task(t, self.client_id)
            self.created_task_ids.append(tid)

    def test_01_unified_date_update(self):
        """Test setting a single unified date for all tasks in the plan at once"""
        with self.client.session_transaction() as sess:
            sess["role"] = "admin"
            sess["uid"] = "admin"
            sess["username"] = "admin"

        target_date = "2026-09-25"
        res = self.client.post("/api/plans/update-dates-bulk", json={
            "plan_name": self.test_plan,
            "client_id": self.client_id,
            "mode": "unified",
            "target_date": target_date,
            "publish_time": "12:00"
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("ok"))
        self.assertEqual(data.get("count"), 5)

        # Verify all tasks have the target date across all fields
        all_t = {t["task_id"]: t for t in _all_tasks_db()}
        for tid in self.created_task_ids:
            task = all_t[tid]
            self.assertEqual(task.get("publish_date"), target_date)
            self.assertEqual(task.get("delivery_deadline"), target_date)
            self.assertEqual(task.get("scheduled_start_date"), target_date)
            self.assertEqual(task.get("modification_deadline"), target_date)
            self.assertEqual(task.get("publish_time"), "12:00")
        print("✓ Test 1: Unified date successfully set on all 5 tasks!")

    def test_02_sequential_date_update(self):
        """Test distributing dates sequentially across a month"""
        with self.client.session_transaction() as sess:
            sess["role"] = "admin"
            sess["uid"] = "admin"

        res = self.client.post("/api/plans/update-dates-bulk", json={
            "plan_name": self.test_plan,
            "client_id": self.client_id,
            "mode": "sequential",
            "target_month": 9,
            "target_year": 2026
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("ok"))
        self.assertEqual(data.get("count"), 5)

        all_t = {t["task_id"]: t for t in _all_tasks_db()}
        dates = [all_t[tid]["publish_date"] for tid in self.created_task_ids]
        # Dates should be in September 2026 and sorted ascending
        for d in dates:
            self.assertTrue(d.startswith("2026-09-"))
        self.assertEqual(dates, sorted(dates))
        print(f"✓ Test 2: Sequential dates evenly distributed: {dates}")

    def test_03_interval_date_update(self):
        """Test incrementing dates with an interval (e.g. every 2 days)"""
        with self.client.session_transaction() as sess:
            sess["role"] = "admin"
            sess["uid"] = "admin"

        res = self.client.post("/api/plans/update-dates-bulk", json={
            "plan_name": self.test_plan,
            "client_id": self.client_id,
            "mode": "interval",
            "start_date": "2026-09-01",
            "interval_days": 2
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("ok"))

        all_t = {t["task_id"]: t for t in _all_tasks_db()}
        expected = ["2026-09-01", "2026-09-03", "2026-09-05", "2026-09-07", "2026-09-09"]
        actual = [all_t[tid]["publish_date"] for tid in self.created_task_ids]
        self.assertEqual(actual, expected)
        print(f"✓ Test 3: Interval dates correctly calculated: {actual}")

if __name__ == "__main__":
    unittest.main()
