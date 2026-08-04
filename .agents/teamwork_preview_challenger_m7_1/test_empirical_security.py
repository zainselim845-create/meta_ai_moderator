import os
import sys
import json

sys.path.insert(0, r"C:\Users\mhmd\meta_ai_moderator")
from server import app

print("=== STRESS TEST 2: SECURITY ENDPOINT PROTECTION (401 VERIFICATION) ===")

client = app.test_client()

protected_endpoints = [
    ("/api/secure/settings", "GET"),
    ("/api/secure/settings", "POST"),
    ("/api/secure/settings", "PUT"),
    ("/api/secure/stats", "GET"),
]

unprotected_endpoints = [
    ("/api/health", "GET"),
    ("/api/chatwoot/login-url", "GET"),
    ("/api/chatwoot/login", "GET"),
    ("/api/chatwoot/status", "GET"),
]

passed = True

print("\n--- 1. Testing Protected Endpoints WITHOUT Authentication ---")
for endpoint, method in protected_endpoints:
    if method == "GET":
        res = client.get(endpoint)
    elif method == "POST":
        res = client.post(endpoint, data=json.dumps({"test": "data"}), content_type="application/json")
    elif method == "PUT":
        res = client.put(endpoint, data=json.dumps({"test": "data"}), content_type="application/json")

    is_401 = (res.status_code == 401)
    status_str = "PASS (401 Unauthorized)" if is_401 else f"FAIL ({res.status_code})"
    if not is_401:
        passed = False
    print(f"[{method}] {endpoint} -> {status_str}")

print("\n--- 2. Testing Protected Endpoints WITH INVALID Token ---")
invalid_headers = {"Authorization": "Bearer invalid_secret_token_12345"}
for endpoint, method in protected_endpoints:
    if method == "GET":
        res = client.get(endpoint, headers=invalid_headers)
    elif method == "POST":
        res = client.post(endpoint, headers=invalid_headers, data=json.dumps({"test": "data"}), content_type="application/json")
    elif method == "PUT":
        res = client.put(endpoint, headers=invalid_headers, data=json.dumps({"test": "data"}), content_type="application/json")

    is_401 = (res.status_code == 401)
    status_str = "PASS (401 Unauthorized)" if is_401 else f"FAIL ({res.status_code})"
    if not is_401:
        passed = False
    print(f"[{method}] {endpoint} -> {status_str}")

print("\n--- 3. Testing Protected Endpoints WITH VALID Bearer Token ---")
valid_headers = {"Authorization": "Bearer secure_meta_ai_admin_token"}
for endpoint, method in protected_endpoints:
    if method == "GET":
        res = client.get(endpoint, headers=valid_headers)
    elif method == "POST":
        res = client.post(endpoint, headers=valid_headers, data=json.dumps({"bot_enabled": True}), content_type="application/json")
    elif method == "PUT":
        res = client.put(endpoint, headers=valid_headers, data=json.dumps({"bot_enabled": True}), content_type="application/json")

    is_200 = (res.status_code == 200)
    status_str = "PASS (200 OK)" if is_200 else f"FAIL ({res.status_code})"
    if not is_200:
        passed = False
    print(f"[{method}] {endpoint} -> {status_str}")

print("\n--- 4. Testing Public Unprotected Endpoints ---")
for endpoint, method in unprotected_endpoints:
    res = client.get(endpoint)
    is_200 = (res.status_code == 200)
    status_str = "PASS (200 OK)" if is_200 else f"FAIL ({res.status_code})"
    if not is_200:
        passed = False
    print(f"[{method}] {endpoint} -> {status_str}")

print(f"\n>>> SECURITY ENDPOINT STRESS TEST RESULT: {'PASS' if passed else 'FAIL'}")
sys.exit(0 if passed else 1)
