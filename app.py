#!/usr/bin/env python3
"""
Prerana Assistive Learning Platform - Integrated Flask Backend
Directly serves existing index.html and powers MySQL authentication via API.
"""

import os
import socket
from functools import wraps
from datetime import timedelta
from pathlib import Path
from flask import (
    Flask, send_from_directory, request, jsonify, session, make_response
)
from dotenv import load_dotenv
import database
import pdf_generator
import adaptive_ai

# Load environment configuration
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env", override=True)

app = Flask(
    __name__,
    static_folder=".",
    static_url_path=""
)

app.secret_key = os.getenv("SECRET_KEY", "prerana_apple_liquid_glass_2026_idd_secure")
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(days=14)
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0

@app.after_request
def add_no_cache_headers(response):
    """Prevent stale browser caching of HTML/CSS/JS/SW while allowing live updates."""
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

# Initialize MySQL Database on server start
with app.app_context():
    database.init_db()

def get_primary_ip():
    """Detect local LAN/Wi-Fi IP for multi-device network sharing."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip

def serialize_session_user():
    """Build clean user dictionary from Flask session."""
    return {
        "id": session.get("user_id"),
        "full_name": session.get("user_name"),
        "username": session.get("user_username"),
        "email": session.get("user_email"),
        "role": session.get("user_role"),
        "avatar": session.get("user_avatar", "🌟"),
        "support_tier": session.get("support_tier", "moderate"),
        "special_needs": session.get("special_needs", "Intellectual & Developmental Delay")
    }

def set_user_session(user, remember=False):
    """Populate Flask session for an authenticated user."""
    session.clear()
    session["user_id"] = user["id"]
    session["user_name"] = user["full_name"]
    session["user_username"] = user["username"]
    session["user_email"] = user["email"]
    session["user_role"] = user["role"]
    session["user_avatar"] = user.get("avatar") or "🌟"
    session["support_tier"] = user.get("support_tier") or "moderate"
    session["special_needs"] = user.get("special_needs") or "Intellectual & Developmental Delay"
    session.permanent = bool(remember)

def login_required(fn):
    """Decorator enforcing authenticated Flask session."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"success": False, "message": "Authentication required. Please sign in."}), 401
        return fn(*args, **kwargs)
    return wrapper

def role_required(*allowed_roles):
    """Decorator enforcing role-based authorization."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            if "user_id" not in session:
                return jsonify({"success": False, "message": "Authentication required. Please sign in."}), 401
            current_role = (session.get("user_role") or "").lower()
            if current_role not in allowed_roles:
                return jsonify({"success": False, "message": "Access forbidden for your account role."}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator

# ==============================================================================
# Existing Website Serving Route
# ==============================================================================

@app.route("/")
def serve_website():
    """Serves the user's existing website index.html directly."""
    return send_from_directory(".", "index.html")

# ==============================================================================
# Authentication API Endpoints
# ==============================================================================

@app.route("/api/check-session", methods=["GET"])
def check_session():
    """Returns the current user session state for seamless page flow."""
    if "user_id" in session:
        return jsonify({
            "authenticated": True,
            "user": serialize_session_user()
        })
    return jsonify({"authenticated": False})

@app.route("/api/login", methods=["POST"])
def api_login():
    """
    Authenticates user against MySQL database.
    Sets Flask session cookies and returns user profile.
    """
    data = request.get_json() or {}
    identifier = data.get("identifier", "").strip()
    password = data.get("password", "").strip()
    role = data.get("role", "").strip().lower()
    remember = bool(data.get("remember", False))

    if not identifier:
        return jsonify({"success": False, "message": "Please enter your username or email."}), 400
    if not password:
        return jsonify({"success": False, "message": "Please enter your password."}), 400

    # Authenticate with MySQL
    success, result = database.verify_user(identifier, password, expected_role=role if role else None)

    if not success:
        return jsonify({"success": False, "message": result}), 401

    user = result
    set_user_session(user, remember=remember)

    return jsonify({
        "success": True,
        "message": f"Welcome back, {user['full_name']}!",
        "user": serialize_session_user()
    })

@app.route("/api/logout", methods=["POST", "GET"])
def api_logout():
    """Logs out active session and returns confirmation."""
    session.clear()
    return jsonify({"success": True, "message": "Logged out successfully."})

@app.route("/api/register", methods=["POST"])
def api_register():
    """Registers a new student or teacher in MySQL and starts their session."""
    data = request.get_json() or {}

    full_name = data.get("full_name", "").strip()
    email = data.get("email", "").strip()
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()
    requested_role = data.get("role", "student").strip().lower()
    # Restrict self-registration strictly to student or teacher roles
    role = requested_role if requested_role in ("student", "teacher") else "student"
    avatar = data.get("avatar", "🌟" if role == "student" else "👩‍🏫")
    support_tier = data.get("support_tier", "moderate")
    special_needs = data.get("special_needs", "Intellectual & Developmental Delay" if role == "student" else "Special Education")

    success, result = database.create_user(
        full_name=full_name,
        email=email,
        username=username,
        password=password,
        role=role,
        avatar=avatar,
        support_tier=support_tier,
        special_needs=special_needs
    )

    if not success:
        return jsonify({"success": False, "message": result}), 400

    set_user_session(result, remember=False)

    return jsonify({
        "success": True,
        "message": f"Account for {full_name} created successfully!",
        "user_id": result["id"],
        "user": serialize_session_user()
    })

@app.route("/api/auth/picture-login", methods=["POST"])
def api_picture_login():
    """
    Accessible picture-based login for learners with intellectual & cognitive delay.
    Learner taps their Mascot Avatar and Color Code (no typing required).
    """
    data = request.get_json() or {}
    avatar = data.get("avatar", "🌟")
    color = data.get("color", "")
    ok, user = database.verify_picture_login(avatar, color)
    if not ok or not user:
        return jsonify({"success": False, "message": "Learner profile not found for this mascot."}), 404

    set_user_session(user, remember=True)
    return jsonify({
        "success": True,
        "message": f"Welcome back, {user['full_name']}!",
        "user_id": user["id"],
        "user": serialize_session_user()
    })

# ==============================================================================
# Protected Role-Based Dashboard Routes
# ==============================================================================

@app.route("/api/dashboard/student", methods=["GET"])
@login_required
def api_student_dashboard():
    """Protected student dashboard profile endpoint."""
    return jsonify({
        "success": True,
        "user": serialize_session_user(),
        "dashboard": database.get_student_dashboard_data(session["user_id"])
    })


@app.route("/api/student/dashboard-data", methods=["GET"])
@login_required
def api_student_dashboard_data():
    """Return full MySQL progress, achievements, daily rewards, favorites, and accessibility settings."""
    data = database.get_student_dashboard_data(session["user_id"])
    if data is None:
        return jsonify({"success": False, "message": "Could not load student dashboard data."}), 500
    return jsonify({
        "success": True,
        "user": serialize_session_user(),
        "dashboard": data
    })


@app.route("/api/student/progress", methods=["POST"])
@login_required
def api_student_record_progress():
    """Persist completed activity, stars, score, and unlocked achievements to MySQL."""
    payload = request.get_json() or {}
    module_key = (payload.get("module_key") or "").strip()
    module_name = (payload.get("module_name") or module_key or "Activity").strip()
    objective = (payload.get("objective") or "Completed learning task").strip()
    difficulty = (payload.get("difficulty") or "medium").strip().lower()
    success = bool(payload.get("success", True))
    attempts = int(payload.get("attempts") or 1)
    response_time_ms = int(payload.get("response_time_ms") or 1000)
    stars_earned = int(payload.get("stars_earned") if payload.get("stars_earned") is not None else (1 if success else 0))
    score = int(payload.get("score") if payload.get("score") is not None else (10 if success else 2))

    if not module_key:
        return jsonify({"success": False, "message": "Missing module_key."}), 400

    ok, result = database.record_student_activity(
        user_id=session["user_id"],
        module_key=module_key,
        module_name=module_name,
        objective=objective,
        difficulty=difficulty,
        success=success,
        attempts=attempts,
        response_time_ms=response_time_ms,
        stars_earned=stars_earned,
        score=score
    )
    if not ok:
        return jsonify({"success": False, "message": result}), 500
    return jsonify({"success": True, "dashboard": result})


@app.route("/api/student/favorite", methods=["POST"])
@login_required
def api_student_toggle_favorite():
    """Toggle a learning module key in the signed-in user's favorites list."""
    payload = request.get_json() or {}
    module_key = (payload.get("module_key") or "").strip()
    ok, result = database.toggle_student_favorite(session["user_id"], module_key)
    if not ok:
        return jsonify({"success": False, "message": result}), 400
    return jsonify({"success": True, "favorites": result})


@app.route("/api/student/daily-reward", methods=["POST"])
@login_required
def api_student_daily_reward():
    """Claim once-per-day bonus stars & increment learning streak in MySQL."""
    ok, msg, data = database.claim_daily_reward(session["user_id"])
    status_code = 200 if ok else 400
    return jsonify({"success": ok, "message": msg, "dashboard": data}), status_code


@app.route("/api/student/settings", methods=["POST"])
@login_required
def api_student_update_settings():
    """Persist difficulty level and accessibility preferences in MySQL."""
    payload = request.get_json() or {}
    difficulty = payload.get("difficulty")
    settings_patch = payload.get("settings") if isinstance(payload.get("settings"), dict) else {}
    ok, msg, updated = database.update_student_settings(
        session["user_id"],
        settings_patch=settings_patch,
        difficulty=difficulty
    )
    if not ok:
        return jsonify({"success": False, "message": msg}), 400
    return jsonify({
        "success": True,
        "message": msg,
        "difficulty": updated["difficulty"],
        "settings": updated["settings"]
    })


@app.route("/api/dashboard/teacher", methods=["GET"])
@role_required("teacher", "admin")
def api_teacher_dashboard():
    """Protected teacher/admin dashboard endpoint returning MySQL student roster & activity logs."""
    students = database.get_students()
    metrics_map = database.get_student_metrics_map()
    recent_logs = database.get_all_activity_logs(limit=60)
    formatted = []
    for s in students:
        m = metrics_map.get(s["id"], {})
        formatted.append({
            "id": s["id"],
            "full_name": s["full_name"],
            "username": s["username"],
            "email": s["email"],
            "role": s["role"],
            "avatar": s.get("avatar") or "🌟",
            "support_tier": s.get("support_tier") or "moderate",
            "special_needs": s.get("special_needs") or "Special Education",
            "stars": m.get("stars", 5),
            "score": m.get("score", 0),
            "difficulty": m.get("difficulty", "medium"),
            "completed_activities": m.get("completed_activities", 0)
        })
    return jsonify({
        "success": True,
        "user": serialize_session_user(),
        "students": formatted,
        "activity_logs": recent_logs
    })

@app.route("/api/dashboard/admin", methods=["GET"])
@role_required("admin")
def api_admin_dashboard():
    """Protected admin-only endpoint returning full MySQL user registry."""
    users = database.get_all_users()
    formatted = []
    for u in users:
        formatted.append({
            "id": u["id"],
            "full_name": u["full_name"],
            "username": u["username"],
            "email": u["email"],
            "role": u["role"],
            "avatar": u.get("avatar") or "🌟",
            "support_tier": u.get("support_tier") or "moderate",
            "special_needs": u.get("special_needs") or ""
        })
    return jsonify({
        "success": True,
        "user": serialize_session_user(),
        "users": formatted
    })

@app.route("/api/students", methods=["POST"])
@role_required("teacher", "admin")
def api_add_student():
    """Protected endpoint for educators/admins to add a student directly to MySQL."""
    data = request.get_json() or {}
    full_name = data.get("full_name", "").strip()
    username = data.get("username", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "student123").strip() or "student123"
    avatar = data.get("avatar", "🌟")
    support_tier = data.get("support_tier", "moderate")
    special_needs = data.get("special_needs", "Intellectual & Developmental Delay")

    success, result = database.create_user(
        full_name=full_name,
        email=email,
        username=username,
        password=password,
        role="student",
        avatar=avatar,
        support_tier=support_tier,
        special_needs=special_needs
    )
    if not success:
        return jsonify({"success": False, "message": result}), 400

    return jsonify({
        "success": True,
        "message": f"Student {full_name} added to roster.",
        "student": {
            "id": result["id"],
            "full_name": result["full_name"],
            "username": result["username"],
            "email": result["email"],
            "role": result["role"],
            "avatar": result.get("avatar") or "🌟",
            "support_tier": result.get("support_tier") or "moderate",
            "special_needs": result.get("special_needs") or "Intellectual & Developmental Delay"
        }
    })

@app.route("/api/students/<int:student_id>/tier", methods=["PATCH"])
@role_required("teacher", "admin")
def api_update_student_tier(student_id):
    """Protected endpoint to update a student's cognitive support tier in MySQL."""
    data = request.get_json() or {}
    tier = data.get("support_tier", "").strip().lower()
    ok, msg = database.update_student_tier(student_id, tier)
    if not ok:
        return jsonify({"success": False, "message": msg}), 400
    return jsonify({"success": True, "message": msg})

@app.route("/api/students/<int:student_id>", methods=["DELETE"])
@role_required("teacher", "admin")
def api_delete_student(student_id):
    """Protected endpoint to delete a student record from MySQL."""
    ok, msg = database.delete_user(student_id)
    if not ok:
        return jsonify({"success": False, "message": msg}), 404
    return jsonify({"success": True, "message": msg})

@app.route("/api/teacher/student/<student_id>/progress-pdf", methods=["GET"])
@role_required("teacher", "admin")
def api_student_progress_pdf(student_id):
    """
    Generates and downloads or previews an official Individualized Cognitive & Pedagogical
    Progress Evaluation (IEP) report for a specific student.
    Uses ReportLab if available, with a fallback printable HTML view.
    """
    report_data = database.get_student_evaluation_report_data(student_id)
    if not report_data:
        return jsonify({"success": False, "message": "Student record not found."}), 404

    as_attachment = request.args.get("download") == "1"

    try:
        pdf_bytes, filename = pdf_generator.generate_student_progress_pdf(report_data)
        disposition_type = "attachment" if as_attachment else "inline"
        response = make_response(pdf_bytes)
        response.headers["Content-Type"] = "application/pdf"
        response.headers["Content-Disposition"] = f'{disposition_type}; filename="{filename}"'
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        return response
    except Exception as err:
        app.logger.warning(f"PDF generation failed, falling back to printable HTML: {err}")
        html_content = pdf_generator.generate_student_progress_html(report_data)
        response = make_response(html_content)
        response.headers["Content-Type"] = "text/html; charset=utf-8"
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        return response

@app.route("/api/teacher/class-progress-pdf", methods=["GET"])
@app.route("/api/teacher/export-report-pdf", methods=["GET"])
@role_required("teacher", "admin")
def api_class_progress_pdf():
    """
    Generates and downloads or previews an official Center-Wide / Class
    IEP Progress & Outcomes Evaluation report in PDF format (in English).
    Uses ReportLab if available, with a fallback printable HTML view.
    """
    user_session = session.get("name") or session.get("user") or "Mrs. Sunita Sharma"
    report_data = database.get_class_evaluation_report_data(evaluator_name=user_session)
    if not report_data:
        return jsonify({"success": False, "message": "No active students found in roster."}), 404

    as_attachment = request.args.get("download") == "1"

    try:
        pdf_bytes, filename = pdf_generator.generate_class_progress_pdf(report_data)
        disposition_type = "attachment" if as_attachment else "inline"
        response = make_response(pdf_bytes)
        response.headers["Content-Type"] = "application/pdf"
        response.headers["Content-Disposition"] = f'{disposition_type}; filename="{filename}"'
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        return response
    except Exception as err:
        app.logger.warning(f"Class PDF generation failed, falling back to printable HTML: {err}")
        html_content = pdf_generator.generate_class_progress_html(report_data)
        response = make_response(html_content)
        response.headers["Content-Type"] = "text/html; charset=utf-8"
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        return response

# ==============================================================================
# Educator Custom Lessons & Activities
# ==============================================================================

@app.route("/api/teacher/custom-lessons", methods=["GET"])
def api_get_custom_lessons():
    """Fetches custom teacher flashcards/activities for both classroom instruction and student play."""
    lessons = database.get_all_custom_lessons()
    return jsonify({"success": True, "lessons": lessons})

@app.route("/api/teacher/custom-lessons", methods=["POST"])
@role_required("teacher", "admin")
def api_create_custom_lesson():
    """Allows special educators to author tailored multi-sensory lessons."""
    data = request.get_json() or {}
    title = data.get("title", "").strip()
    prompt_text = data.get("prompt_text", "").strip()
    correct_answer = data.get("correct_answer", "").strip()
    distractors = data.get("distractors", [])
    category = data.get("category", "Adaptive Learning").strip()
    image_url = data.get("image_url", "🎒").strip()

    if not title or not prompt_text or not correct_answer:
        return jsonify({"success": False, "message": "Title, prompt, and correct answer are required."}), 400

    teacher_id = session.get("user_id")
    ok, result = database.create_custom_lesson(teacher_id, category, title, prompt_text, image_url, correct_answer, distractors)
    if not ok:
        return jsonify({"success": False, "message": result}), 500

    return jsonify({"success": True, "message": "Custom lesson created successfully!", "lesson_id": result})

@app.route("/api/teacher/custom-lessons/<int:lesson_id>", methods=["DELETE"])
@role_required("teacher", "admin")
def api_delete_custom_lesson(lesson_id):
    """Deletes an educator custom lesson."""
    ok, msg = database.delete_custom_lesson(lesson_id)
    return jsonify({"success": ok, "message": msg}), (200 if ok else 404)

# ==============================================================================
# Adaptive AI & Bayesian Knowledge Tracing Telemetry
# ==============================================================================

@app.route("/api/adaptive/student/<int:student_id>", methods=["GET"])
@role_required("teacher", "admin")
def api_adaptive_evaluation(student_id):
    """Computes real-time Bayesian Knowledge Tracing (BKT) and Cognitive Latency evaluation for student."""
    user = database.get_user_by_id(student_id)
    if not user:
        return jsonify({"success": False, "message": "Student record not found."}), 404

    logs = database.get_user_activity_logs(student_id, limit=30)
    current_tier = (user.get("support_tier") or "moderate").lower()
    evaluation = adaptive_ai.evaluate_student_cognitive_state(student_id, logs, current_tier)
    return jsonify({"success": True, "student": user, "adaptive_analysis": evaluation})

@app.route("/api/network-info", methods=["GET"])
def network_info():
    """Returns local network IP for cross-device Wi-Fi/LAN connection."""
    primary_ip = get_primary_ip()
    port = int(os.getenv("PORT", 5000))
    return jsonify({
        "primary_ip": primary_ip,
        "port": port,
        "network_url": f"http://{primary_ip}:{port}",
        "local_url": f"http://localhost:{port}"
    })

@app.route("/api/db-status", methods=["GET"])
def db_status():
    """Healthcheck endpoint returning MySQL connection parameters and status."""
    db_conn = database.get_db_connection()
    connected = db_conn is not None and db_conn.is_connected()
    if db_conn:
        db_conn.close()
    return jsonify({
        "database_type": "MySQL (MySQL80)",
        "connected": connected,
        "host": database.DB_CONFIG.get("host"),
        "port": database.DB_CONFIG.get("port"),
        "user": database.DB_CONFIG.get("user"),
        "database": database.DB_CONFIG.get("database")
    })

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    primary_ip = get_primary_ip()
    print("=" * 68)
    print("  PRERANA SPECIAL EDUCATION LEARNING PLATFORM - FLASK + MYSQL")
    print(f"  MySQL Server: {database.DB_CONFIG['host']}:{database.DB_CONFIG['port']} (MySQL80)")
    print(f"  Database:     {database.DB_CONFIG['database']}")
    print(f"  DB User:      {database.DB_CONFIG['user']}")
    print("=" * 68)
    print(f"  Local URL:   http://localhost:{port}")
    print(f"  Network URL: http://{primary_ip}:{port} (Wi-Fi / LAN)")
    print("=" * 68)
    app.run(host="0.0.0.0", port=port, debug=True)
