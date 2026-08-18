import sys

def patch_file():
    with open('api/index.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Init cache
    content = content.replace('conv_cache = {"timestamp": 0, "data": None, "ttl": 15}', 'conv_cache = {"ttl": 15}')
    
    # 2. In api_conversations
    old_read = '''    force = request.args.get("force") == "true"
    now = time.time()
    all_threads = []
    if not force and conv_cache.get("all_threads") and (now - conv_cache["timestamp"] < conv_cache["ttl"]):
        all_threads = conv_cache["all_threads"]
    else:
        sync_from_supabase()

    cid = current_client_id()'''
    new_read = '''    force = request.args.get("force") == "true"
    now = time.time()
    all_threads = []
    cid = current_client_id()
    cc = conv_cache.setdefault(cid, {"timestamp": 0, "data": None, "all_threads": []})
    
    if not force and cc.get("all_threads") and (now - cc["timestamp"] < conv_cache["ttl"]):
        all_threads = cc["all_threads"]
    else:
        sync_from_supabase()'''
    content = content.replace(old_read, new_read)
    
    # 3. Save cache in api_conversations
    old_save = '''    # Cache the structured result
    conv_cache["all_threads"] = all_threads
    conv_cache["data"] = {"conversations": all_threads}
    conv_cache["timestamp"] = now'''
    new_save = '''    # Cache the structured result
    cc = conv_cache.setdefault(cid, {"timestamp": 0, "data": None, "all_threads": []})
    cc["all_threads"] = all_threads
    cc["data"] = {"conversations": all_threads}
    cc["timestamp"] = now'''
    content = content.replace(old_save, new_save)
    
    # 4. validate_thread_ownership
    old_val = '''def validate_thread_ownership(thread_id):
    cid = current_client_id()
    if not thread_id:
        return None, cid

    # Validate thread_id format (prevent path traversal / injection)
    if not re.fullmatch(r'[A-Za-z0-9_\-]{4,128}', thread_id):
        return None, cid

    # Default deny: thread_id must exist in cache or registered threads
    if not conv_cache.get("data"):
        sync_from_supabase()

    threads = (conv_cache.get("data") or {}).get("conversations", [])
    if not threads:
        threads = conv_cache.get("all_threads", [])'''
    new_val = '''def validate_thread_ownership(thread_id):
    cid = current_client_id()
    if not thread_id:
        return None, cid

    # Validate thread_id format (prevent path traversal / injection)
    if not re.fullmatch(r'[A-Za-z0-9_\-]{4,128}', thread_id):
        return None, cid

    # Default deny: thread_id must exist in cache or registered threads
    cc = conv_cache.setdefault(cid, {"timestamp": 0, "data": None, "all_threads": []})
    if not cc.get("data"):
        sync_from_supabase()

    threads = (cc.get("data") or {}).get("conversations", [])
    if not threads:
        threads = cc.get("all_threads", [])'''
    content = content.replace(old_val, new_val)
    
    # 5. fetch_rich_thread_messages
    old_fetch = '''def fetch_rich_thread_messages(thread_id, before=None, limit=50):
    if thread_id.startswith("ig_comment_") or thread_id.startswith("fb_comment_"):
        target_comment_id = thread_id.replace("ig_comment_", "").replace("fb_comment_", "")
        real_time = "2026-05-26T17:33:35+0000"
        real_sender = "عميل"
        real_text = "تعليق العميل"
        if conv_cache.get("data"):
            threads = conv_cache["data"].get("conversations", [])'''
    new_fetch = '''def fetch_rich_thread_messages(thread_id, before=None, limit=50):
    cid = current_client_id()
    cc = conv_cache.setdefault(cid, {"timestamp": 0, "data": None, "all_threads": []})
    if thread_id.startswith("ig_comment_") or thread_id.startswith("fb_comment_"):
        target_comment_id = thread_id.replace("ig_comment_", "").replace("fb_comment_", "")
        real_time = "2026-05-26T17:33:35+0000"
        real_sender = "عميل"
        real_text = "تعليق العميل"
        if cc.get("data"):
            threads = cc["data"].get("conversations", [])'''
    content = content.replace(old_fetch, new_fetch)
    
    # 6. /api/conversations/clear_cache
    # Search for conv_cache["timestamp"] = 0
    import re
    content = re.sub(r'conv_cache\["timestamp"\] = 0', r'cid = current_client_id(); if cid in conv_cache: conv_cache[cid]["timestamp"] = 0', content)
    
    # 7. Unread total in dashboard
    content = content.replace('((conv_cache.get("data") or {}).get("conversations") or [])', '((conv_cache.get(current_client_id(), {}).get("data") or {}).get("conversations") or [])')
    
    with open('api/index.py', 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Patch applied")

if __name__ == '__main__':
    patch_file()
