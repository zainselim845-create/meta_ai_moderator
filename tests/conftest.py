import pytest
import os
import sys

# Ensure testing environment flags are permanently active during test runs
os.environ["PYTEST_CURRENT_TEST"] = "1"
os.environ["FLASK_ENV"] = "testing"


@pytest.fixture(autouse=True)
def prevent_live_db_and_api_leakage(monkeypatch):
    """Universal safety fixture: strictly prevents tests from mutating production Supabase
    or calling live third-party network APIs."""
    import api.index as idx
    monkeypatch.setattr(idx, "push_setting", lambda *a, **k: True)
    monkeypatch.setattr(idx, "sync_from_supabase", lambda *a, **k: None)
