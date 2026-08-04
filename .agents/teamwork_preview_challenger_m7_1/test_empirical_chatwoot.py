import os
import sys
import json

sys.path.insert(0, r"C:\Users\mhmd\meta_ai_moderator")
from server import app
from facebook_free_connector import FacebookFreeConnector

print("=== STRESS TEST 3: CHATWOOT FREE CONNECTOR & LOGIN URL ENDPOINTS ===")

client = app.test_client()
passed = True

print("\n--- 1. Testing Direct FacebookFreeConnector.getLoginUrl() ---")
default_url = FacebookFreeConnector.getLoginUrl()
print(f"Default URL: {default_url}")
if "dialog/oauth" in default_url and "100821894800009" in default_url and "chatwoot_free_0mo" in default_url:
    print("[PASS] FacebookFreeConnector default login URL verified.")
else:
    print("[FAIL] FacebookFreeConnector default login URL invalid.")
    passed = False

custom_url = FacebookFreeConnector.getLoginUrl(redirect_uri="https://myapp.com/callback", state="custom_state_999")
print(f"Custom URL: {custom_url}")
if "redirect_uri=https://myapp.com/callback" in custom_url and "state=custom_state_999" in custom_url:
    print("[PASS] FacebookFreeConnector custom redirect_uri and state verified.")
else:
    print("[FAIL] FacebookFreeConnector custom redirect_uri and state invalid.")
    passed = False

print("\n--- 2. Testing FacebookFreeConnector.getConnectorStatus() ---")
status = FacebookFreeConnector.getConnectorStatus()
print(f"Status response: {status}")
if status.get("enabled") is True and status.get("paid_integrations") is False and status.get("license") == "MIT Free Tier":
    print("[PASS] FacebookFreeConnector status dict verified.")
else:
    print("[FAIL] FacebookFreeConnector status dict invalid.")
    passed = False

print("\n--- 3. Testing Flask Endpoint GET /api/chatwoot/login-url ---")
res = client.get("/api/chatwoot/login-url?redirect_uri=https://mytest.com/cb&state=test_st_123")
if res.status_code == 200:
    data = res.get_json()
    print(f"Response: {data}")
    if data.get("success") is True and "mytest.com/cb" in data.get("oauth_url", "") and data.get("paid_integrations") is False:
        print("[PASS] GET /api/chatwoot/login-url verified.")
    else:
        print("[FAIL] GET /api/chatwoot/login-url invalid JSON structure.")
        passed = False
else:
    print(f"[FAIL] GET /api/chatwoot/login-url returned status {res.status_code}")
    passed = False

print("\n--- 4. Testing Flask Endpoint GET /api/chatwoot-free/oauth/url ---")
res = client.get("/api/chatwoot-free/oauth/url")
if res.status_code == 200:
    data = res.get_json()
    print(f"Response: {data}")
    if data.get("success") is True and "oauth_url" in data:
        print("[PASS] GET /api/chatwoot-free/oauth/url verified.")
    else:
        print("[FAIL] GET /api/chatwoot-free/oauth/url invalid content.")
        passed = False
else:
    print(f"[FAIL] GET /api/chatwoot-free/oauth/url status {res.status_code}")
    passed = False

print("\n--- 5. Testing Flask Endpoint GET/POST /api/chatwoot/login ---")
res_login_get = client.get("/api/chatwoot/login?redirect_uri=https://login.com/cb")
res_login_post = client.post("/api/chatwoot/login", data={"redirect_uri": "https://login.com/cb"})
if res_login_get.status_code == 200 and res_login_post.status_code == 200:
    print("[PASS] GET/POST /api/chatwoot/login returned 200 OK.")
else:
    print("[FAIL] GET/POST /api/chatwoot/login status failure.")
    passed = False

print("\n--- 6. Testing Flask Endpoint GET /api/chatwoot/status ---")
res_status = client.get("/api/chatwoot/status")
if res_status.status_code == 200 and res_status.get_json().get("paid_integrations") is False:
    print("[PASS] GET /api/chatwoot/status returned 200 OK with paid_integrations=False.")
else:
    print("[FAIL] GET /api/chatwoot/status failed.")
    passed = False

print(f"\n>>> CHATWOOT ENDPOINT & CONNECTOR STRESS TEST RESULT: {'PASS' if passed else 'FAIL'}")
sys.exit(0 if passed else 1)
