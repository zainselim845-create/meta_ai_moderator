import re
import os

filepath = r"C:\Users\mhmd\meta_ai_moderator\api\index.py"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

old_oauth_url = """@app.route("/api/oauth_url", methods=["GET"])
def api_oauth_url():
    app_id = os.environ.get("META_APP_ID", "1331918902446123")
    redirect_uri = "https://metaaimoderator.vercel.app/oauth_callback"
    scope = "pages_show_list,pages_messaging,instagram_basic,instagram_manage_comments,instagram_manage_messages"
    url = f"https://www.facebook.com/v21.0/dialog/oauth?client_id={app_id}&redirect_uri={redirect_uri}&scope={scope}&response_type=code"
    return jsonify({"url": url})"""

new_oauth_url = """import base64
import hashlib
import secrets
from flask import make_response

@app.route("/api/oauth/start", methods=["GET"])
def api_oauth_start():
    app_id = os.environ.get("META_APP_ID", "1331918902446123")
    redirect_uri = "https://metaaimoderator.vercel.app/api/oauth/callback"
    scopes = "pages_show_list,pages_read_engagement,pages_manage_metadata,pages_messaging,instagram_basic,instagram_manage_messages,instagram_manage_comments,business_management"
    
    state = secrets.token_urlsafe(32)
    code_verifier = secrets.token_urlsafe(64)
    code_challenge = base64.urlsafe_b64encode(hashlib.sha256(code_verifier.encode('ascii')).digest()).decode('ascii').rstrip('=')
    
    url = f"https://www.facebook.com/v21.0/dialog/oauth?client_id={app_id}&redirect_uri={redirect_uri}&scope={scopes}&state={state}&response_type=code&code_challenge={code_challenge}&code_challenge_method=S256"
    
    resp = make_response(redirect(url))
    resp.set_cookie('oauth_state', state, httponly=True, secure=True, max_age=600)
    resp.set_cookie('oauth_code_verifier', code_verifier, httponly=True, secure=True, max_age=600)
    return resp

@app.route("/api/oauth_url", methods=["GET"])
def api_oauth_url_legacy():
    # Legacy wrapper for old frontend
    return jsonify({"url": "/api/oauth/start"})"""

code = code.replace(old_oauth_url, new_oauth_url)

callback_pattern = re.compile(r'@app\.route\("/oauth_callback"\)\s*@app\.route\("/api/oauth/callback"\)\s*def oauth_callback\(\):.*?try:', re.DOTALL)
match = callback_pattern.search(code)
if match:
    old_cb_start = match.group(0)
    new_cb_start = """@app.route("/oauth_callback")
@app.route("/api/oauth/callback")
def oauth_callback():
    if request.args.get('error'):
        return redirect('/?oauth=error&reason=denied')

    code = request.args.get('code')
    if not code:
        return redirect('/?oauth=error&reason=nocode')

    state = request.args.get('state')
    expected_state = request.cookies.get('oauth_state')
    code_verifier = request.cookies.get('oauth_code_verifier')
    
    if not expected_state or not state or state != expected_state:
        print("[OAuth Warning] Mismatched state token")
        return redirect('/?oauth=error&reason=state')

    meta_app_id = os.environ.get('META_APP_ID', '1331918902446123')
    meta_app_secret = os.environ.get('META_APP_SECRET', 'REMOVED_SECRET')
    
    redirect_uri = "https://metaaimoderator.vercel.app/api/oauth/callback"

    try:"""
    code = code.replace(old_cb_start, new_cb_start)

token_exchange_repl = """'redirect_uri': redirect_uri,
            'code': code,
            'code_verifier': code_verifier,
        })"""

code = code.replace("""'redirect_uri': redirect_uri,
            'code': code,
        })""", token_exchange_repl)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("OAuth logic updated!")
