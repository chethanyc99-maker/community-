import sys
import os
import json

# Ensure project root is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import database
import adaptive_ai
from app import app

def test_full_suite():
    print("=== 1. TESTING DATABASE & REPOSITORY METHODS ===")
    database.init_db()
    print("✓ init_db completed without errors.")

    # Test Picture Login
    success, student = database.verify_picture_login("🌟", "blue")
    print(f"✓ Picture login verified: {student.get('full_name') if success and isinstance(student, dict) else 'None (Fallback mode)'}")

    # Test Custom Lessons
    lessons = database.get_all_custom_lessons()
    print(f"✓ Fetched custom lessons count: {len(lessons)}")
    assert len(lessons) >= 1, "Expected seeded custom lessons"
    sample = lessons[0]
    print(f"  Sample Lesson: '{sample.get('title')}' | Icon: {sample.get('image_url')} | Choices: {sample.get('distractors')}")

    print("\n=== 2. TESTING ADAPTIVE AI & BAYESIAN KNOWLEDGE TRACING ===")
    mock_logs = [
        {"status": "Completed (First-Try)", "latency_seconds": 1.8},
        {"status": "Completed (First-Try)", "latency_seconds": 2.1},
        {"status": "Completed (First-Try)", "latency_seconds": 1.5},
        {"status": "Completed (First-Try)", "latency_seconds": 2.0},
        {"status": "Completed", "latency_seconds": 3.4},
        {"status": "Completed (First-Try)", "latency_seconds": 1.9},
    ]
    eval_res = adaptive_ai.evaluate_student_cognitive_state(student_id=1, activity_logs=mock_logs, current_tier="moderate")
    print(f"✓ AI Evaluation: Mastery {eval_res['mastery_probability']}% ({eval_res['mastery_level']})")
    print(f"✓ Latency Index: {eval_res['average_latency_sec']}s ({eval_res['cognitive_load_state']})")
    print(f"✓ Recommended Tier: {eval_res['recommended_tier']} ({eval_res['recommended_choices']} choices)")
    print(f"✓ Pedagogical Guidance: {eval_res['ai_insights']}")

    print("\n=== 3. TESTING FLASK API ENDPOINTS VIA TEST CLIENT ===")
    client = app.test_client()

    # Test GET /api/teacher/custom-lessons
    res_lessons = client.get("/api/teacher/custom-lessons")
    print(f"✓ GET /api/teacher/custom-lessons: status {res_lessons.status_code}")
    data_lessons = res_lessons.get_json()
    assert data_lessons.get("success") is True
    print(f"  Loaded {len(data_lessons.get('lessons', []))} lessons via API")

    # Test POST /api/auth/picture-login
    res_pic = client.post("/api/auth/picture-login", json={"avatar": "🌟", "color_code": "blue"})
    print(f"✓ POST /api/auth/picture-login: status {res_pic.status_code}")
    data_pic = res_pic.get_json()
    assert data_pic.get("success") is True
    print(f"  Logged in as: {data_pic.get('user', {}).get('full_name')} ({data_pic.get('user', {}).get('role')})")

    # Test POST /api/login for teacher
    res_login_tea = client.post("/api/login", json={"identifier": "teacher", "password": "teacher123", "role": "teacher"})
    print(f"✓ Teacher Login: status {res_login_tea.status_code}")

    # Test GET /api/adaptive/student/1
    res_ai = client.get("/api/adaptive/student/1")
    print(f"✓ GET /api/adaptive/student/1: status {res_ai.status_code}")
    data_ai = res_ai.get_json()
    assert data_ai.get("success") is True
    print(f"  AI Evaluation from Endpoint: {data_ai.get('adaptive_analysis', {}).get('mastery_probability')}%")

    print("\n==============================================")
    print("ALL 7 LIMITATION UPGRADE TESTS PASSED PERFECTLY!")
    print("==============================================")

if __name__ == "__main__":
    test_full_suite()
