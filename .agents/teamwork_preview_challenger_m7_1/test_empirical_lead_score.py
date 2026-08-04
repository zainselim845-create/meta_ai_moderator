import os
import sys

sys.path.insert(0, r"C:\Users\mhmd\meta_ai_moderator")
from server import calculate_lead_score

print("=== STRESS TEST 4: DYNAMIC LEAD SCORING (calculate_lead_score) ===")

test_cases = [
    # 1. Null / None / Empty falsy inputs
    {"input": None, "expected_category": "Cold", "min_score": 0, "max_score": 0},
    {"input": "", "expected_category": "Cold", "min_score": 0, "max_score": 0},
    {"input": {}, "expected_category": "Cold", "min_score": 0, "max_score": 0},

    # 2. String inputs
    {"input": "مرحبا اريد معرفة الاسعار وهاتفي 01090121000", "expected_category": "Hot", "min_score": 75, "max_score": 100},
    {"input": "السلام عليكم استفسار عن خدماتكم", "expected_category": "Warm", "min_score": 45, "max_score": 74},
    {"input": "شكرا", "expected_category": "Cold", "min_score": 10, "max_score": 44},

    # 3. Dict inputs with high intent + phone (Hot Lead)
    {
        "input": {
            "last_msg": "أريد حجز باقة التسويق الاحترافية بسعر 6000 ج.م",
            "phone": "01090121000",
            "msg_count": 5,
            "channel": "instagram_dm"
        },
        "expected_category": "Hot",
        "min_score": 80,
        "max_score": 100
    },

    # 4. Dict input with warm intent (Warm Lead)
    {
        "input": {
            "last_msg": "مرحبا، ما هي خدمات التصميم والهوية البصرية؟",
            "msg_count": 2,
            "channel": "messenger"
        },
        "expected_category": "Warm",
        "min_score": 45, "max_score": 74
    },

    # 5. Dict input with minimal intent (Cold Lead)
    {
        "input": {
            "last_msg": "أهلاً وسهلاً",
            "msg_count": 1,
            "channel": "facebook_comment"
        },
        "expected_category": "Cold",
        "min_score": 10, "max_score": 44
    },

    # 6. Extreme input with multiple hot keywords + phone + high message count (Clamped to 100)
    {
        "input": {
            "last_msg": "سعر الباقة والاشتراك ورقم الهاتف للحجز والتعاقد والشراء فورا 01211223344",
            "notes": "سعر تفاصيل باقات حجز",
            "phone": "01211223344",
            "msg_count": 10,
            "channel": "instagram_dm"
        },
        "expected_category": "Hot",
        "min_score": 100, "max_score": 100
    }
]

passed = True

for i, tc in enumerate(test_cases, 1):
    inp = tc["input"]
    res = calculate_lead_score(inp)
    score = res.get("score")
    category = res.get("category")
    label = res.get("label")

    valid_score = (tc["min_score"] <= score <= tc["max_score"])
    valid_cat = (category == tc["expected_category"])
    valid_label = (label == f"{score}% {category}")

    tc_pass = valid_score and valid_cat and valid_label
    if not tc_pass:
        passed = False
        print(f"[FAIL] Test Case #{i}: Input={inp}")
        print(f"       Got score={score}, category={category}, label='{label}'")
        print(f"       Expected range=[{tc['min_score']}, {tc['max_score']}], category={tc['expected_category']}")
    else:
        print(f"[PASS] Test Case #{i}: Score={score}, Category={category}, Label='{label}'")

print(f"\n>>> LEAD SCORING STRESS TEST RESULT: {'PASS' if passed else 'FAIL'}")
sys.exit(0 if passed else 1)
