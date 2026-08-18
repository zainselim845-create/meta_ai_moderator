import re
import os

with open('api/index.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Inject generate_embedding before search_kb
if 'def generate_embedding' not in content:
    embedding_func = '''def generate_embedding(text):
    if OPENROUTER_API_KEY:
        try:
            import requests
            res = requests.post(
                "https://openrouter.ai/api/v1/embeddings",
                headers={"Authorization": f"Bearer {OPENROUTER_API_KEY}", "Content-Type": "application/json"},
                json={"model": "openai/text-embedding-3-small", "input": text},
                timeout=10
            )
            if res.status_code == 200:
                return res.json()["data"][0]["embedding"]
        except Exception as e:
            print(f"[Embedding Error] {e}")
    return None

def search_kb(query, client_id=None):'''
    content = content.replace('def search_kb(query, client_id=None):', embedding_func)

# 2. Update search_kb logic
old_search_kb_body = '''def search_kb(query, client_id=None):
    cid = client_id or current_client_id()
    items = get_kb_data()
    if not items or not query or not str(query).strip():
        return ""
    client_items = [i for i in items if (i.get("client_id") or "client_default") == cid]
    words = [w for w in re.split(r'\\s+', str(query).lower()) if len(w) >= 2]
    scored = []
    for item in client_items:
        text = (item.get("question", "") + " " + item.get("answer", "")).lower()
        score = sum(1 for w in words if w in text)
        if score > 0:
            scored.append((score, item))
    scored.sort(key=lambda x: x[0], reverse=True)
    if not scored:
        return ""
    res_lines = []
    for _, i in scored[:2]:
        res_lines.append("- " + str(i.get('question')) + ": " + str(i.get('answer')))
    return "\\n".join(res_lines)'''

new_search_kb_body = '''def search_kb(query, client_id=None):
    cid = client_id or current_client_id()
    items = get_kb_data()
    if not items or not query or not str(query).strip():
        return ""
        
    # 1. Try vector RAG on Supabase if possible
    embedding = generate_embedding(query)
    if embedding and SUPABASE_URL and SUPABASE_KEY:
        try:
            import requests
            res = requests.post(
                f"{SUPABASE_URL}/rest/v1/rpc/match_documents",
                headers=supa_headers(),
                json={
                    "query_embedding": embedding,
                    "match_threshold": 0.7,
                    "match_count": 3,
                    "p_client_id": cid
                },
                timeout=10
            )
            if res.status_code == 200:
                docs = res.json()
                if docs:
                    return "\\n".join([doc.get("content", "") for doc in docs])
        except Exception as e:
            print(f"[Vector Search Error] {e}")

    # 2. Fallback to keyword search
    client_items = [i for i in items if (i.get("client_id") or "client_default") == cid]
    words = [w for w in re.split(r'\\s+', str(query).lower()) if len(w) >= 2]
    scored = []
    for item in client_items:
        text = (item.get("question", "") + " " + item.get("answer", "")).lower()
        score = sum(1 for w in words if w in text)
        if score > 0:
            scored.append((score, item))
    scored.sort(key=lambda x: x[0], reverse=True)
    if not scored:
        return ""
    res_lines = []
    for _, i in scored[:2]:
        res_lines.append("- " + str(i.get('question')) + ": " + str(i.get('answer')))
    return "\\n".join(res_lines)'''

if old_search_kb_body in content:
    content = content.replace(old_search_kb_body, new_search_kb_body)
else:
    print("Warning: old_search_kb_body not matched exactly. Attempting regex...")
    # Just in case there are minor whitespace differences
    import re
    content = re.sub(
        r'def search_kb\(query, client_id=None\):.*?return "\\n"\.join\(res_lines\)',
        new_search_kb_body,
        content,
        flags=re.DOTALL
    )

# 3. Update api_kb_add
old_api_kb = '''@app.route("/api/kb", methods=["POST"])
@auth_guard
def api_kb_add():
    cid = current_client_id()
    data = request.get_json() or {}
    q = data.get("question")
    a = data.get("answer")
    if not q or not a:
        return jsonify({"error": "Missing data"}), 400
        
    kb = get_kb_data()
    new_id = int(time.time() * 1000)
    kb.append({
        "id": new_id,
        "question": q,
        "answer": a,
        "client_id": cid
    })
    cache["kb"] = kb
    push_setting("meta_ai_kb", kb)
    return jsonify({"ok": True, "id": new_id})'''

new_api_kb = '''@app.route("/api/kb", methods=["POST"])
@auth_guard
def api_kb_add():
    cid = current_client_id()
    data = request.get_json() or {}
    q = data.get("question")
    a = data.get("answer")
    if not q or not a:
        return jsonify({"error": "Missing data"}), 400
        
    kb = get_kb_data()
    new_id = int(time.time() * 1000)
    
    # Generate embedding and save to Supabase Vector DB if possible
    content_text = f"Q: {q}\\nA: {a}"
    embedding = generate_embedding(content_text)
    if embedding and SUPABASE_URL and SUPABASE_KEY:
        try:
            import requests
            requests.post(
                f"{SUPABASE_URL}/rest/v1/documents",
                headers=supa_headers(),
                json={
                    "client_id": cid,
                    "content": content_text,
                    "embedding": embedding
                },
                timeout=5
            )
        except Exception as e:
            print(f"[Supabase Vector Insert Error] {e}")

    kb.append({
        "id": new_id,
        "question": q,
        "answer": a,
        "client_id": cid
    })
    cache["kb"] = kb
    push_setting("meta_ai_kb", kb)
    return jsonify({"ok": True, "id": new_id})'''

if old_api_kb in content:
    content = content.replace(old_api_kb, new_api_kb)
else:
    print("Warning: old_api_kb not matched exactly. Attempting regex...")
    content = re.sub(
        r'@app\.route\("/api/kb", methods=\["POST"\]\)\s*@auth_guard\s*def api_kb_add\(\):.*?return jsonify\(\{"ok": True, "id": new_id\}\)',
        new_api_kb,
        content,
        flags=re.DOTALL
    )

with open('api/index.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("SUCCESS RAG PATCH")
