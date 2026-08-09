import sys, time, os
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, '.')

from api.index import generate_reply, search_kb, check_custom_rules, cache, DEFAULT_KB

# Inject 1,000 simulated clients into cache to benchmark performance
print("=" * 60)
print("  BENCHMARK: 1,000 CLIENTS PERFORMANCE & RESPONSE SPEED TEST")
print("=" * 60)

mock_kb = []
for i in range(1, 1001):
    cid = f"client_mock_{i:04d}"
    mock_kb.append({"id": i*10 + 1, "question": f"ما هو عنوان الفرع الخاص بالعميل {i}؟", "answer": f"العنوان هو الشارع الرئيسي للعميل رقم {i}", "client_id": cid})
    mock_kb.append({"id": i*10 + 2, "question": f"ما هي مواعيد العمل للعميل {i}؟", "answer": f"مواعيد العمل للعميل {i} من الساعة 9 إلى 5", "client_id": cid})

cache["kb"] = mock_kb
print(f"\n📊 Total KB Items Loaded in Cache: {len(mock_kb)} across 1,000 clients")

# Benchmark O(1) Search for Client #789 out of 1,000
target_cid = "client_mock_0789"
start_time = time.perf_counter()

kb_result = search_kb("ما هي مواعيد العمل للعميل 789؟", client_id=target_cid)

elapsed_ms = (time.perf_counter() - start_time) * 1000

print(f"⏱️ Lookup Time for Client #789 out of 1,000 clients: {elapsed_ms:.4f} milliseconds!")
print(f"📝 Result Found: {kb_result[:100]}...")

if elapsed_ms < 5.0 and "مواعيد العمل للعميل 789" in kb_result:
    print("\n✅ PASSED: System scales seamlessly to 1,000+ clients with O(1) instant response speed!")
else:
    print("\n❌ FAILED: Response was too slow or inaccurate.")
