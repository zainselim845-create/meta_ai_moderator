import sys
import os
import json
import re

sys.path.insert(0, os.path.abspath('.'))

from api.index import app

def run_endpoint_audits():
    client = app.test_client()
    app.testing = True

    results = []

    os.environ["ADMIN_SECRET_KEY"] = "[REDACTED]"
    headers = {"Authorization": "Bearer [REDACTED]"}

    # 1. Unauthenticated protection on secure endpoints
    res_unauth1 = client.get('/api/secure/settings')
    res_unauth2 = client.get('/api/secure/stats')
    if res_unauth1.status_code == 401 and res_unauth2.status_code == 401:
        results.append(("Secure Endpoints Auth Protection", "PASS", "Returns 401 Unauthorized when unauthenticated"))
    else:
        results.append(("Secure Endpoints Auth Protection", "FAIL", f"Status: {res_unauth1.status_code}, {res_unauth2.status_code}"))

    # 2. Authenticated access on secure endpoints
    res_auth1 = client.get('/api/secure/settings', headers=headers)
    res_auth2 = client.get('/api/secure/stats', headers=headers)
    if res_auth1.status_code == 200 and res_auth2.status_code == 200:
        results.append(("Secure Endpoints Authenticated 200", "PASS", "Returns 200 OK when authenticated with Bearer token"))
    else:
        results.append(("Secure Endpoints Authenticated 200", "FAIL", f"Status: {res_auth1.status_code}, {res_auth2.status_code}"))

    # 3. Accounts token masking
    with client.session_transaction() as sess:
        sess['user_id'] = 'test_user'
        sess['authenticated'] = True

    resp_acc = client.get('/api/accounts', headers=headers)
    json_acc = resp_acc.get_json() or {}
    accounts = json_acc.get("accounts", [])
    raw_found = False
    for a in accounts:
        t = a.get("access_token", "")
        if t != "EAAS7X••••••••4fA9" and not t.startswith("EAAS7X••••"):
            raw_found = True

    if resp_acc.status_code == 200 and not raw_found and len(accounts) > 0:
        results.append(("Accounts Token Masking", "PASS", f"Returned {len(accounts)} accounts with strictly masked token EAAS7X••••••••4fA9"))
    else:
        results.append(("Accounts Token Masking", "FAIL", f"Status: {resp_acc.status_code}, Raw token found: {raw_found}"))

    # 4. OAuth Meta Graph API v21.0 URL via /api/chatwoot/login-url
    resp_oauth = client.get('/api/chatwoot/login-url', headers=headers)
    json_oauth = resp_oauth.get_json() or {}
    url = json_oauth.get("oauth_url", "")
    if resp_oauth.status_code == 200 and "facebook.com/v21.0/dialog/oauth" in url:
        results.append(("Meta Graph API v21.0 OAuth URL", "PASS", f"OAuth URL uses v21.0 endpoint ({url[:45]}...)"))
    else:
        results.append(("Meta Graph API v21.0 OAuth URL", "FAIL", f"Status {resp_oauth.status_code}, URL: {url}"))

    # 5. /privacy route
    resp_priv = client.get('/privacy')
    priv_text = resp_priv.get_data(as_text=True)
    if resp_priv.status_code == 200 and "Privacy Policy" in priv_text and "v21.0" in priv_text:
        results.append(("/privacy Route Compliance", "PASS", "Returns 200 OK with privacy policy HTML & v21.0 compliance"))
    else:
        results.append(("/privacy Route Compliance", "FAIL", f"Status {resp_priv.status_code}"))

    # 6. /api/health
    resp_health = client.get('/api/health')
    json_health = resp_health.get_json() or {}
    if resp_health.status_code == 200 and json_health.get("status") == "ok":
        results.append(("/api/health Compliance", "PASS", "Returns 200 OK with status ok"))
    else:
        results.append(("/api/health Compliance", "FAIL", f"Status {resp_health.status_code}"))

    print("\n=== VERIFICATION RESULTS ===")
    all_passed = True
    for title, status, desc in results:
        print(f"[{status}] {title}: {desc}")
        if status != "PASS":
            all_passed = False

    return all_passed

if __name__ == '__main__':
    ok = run_endpoint_audits()
    sys.exit(0 if ok else 1)
