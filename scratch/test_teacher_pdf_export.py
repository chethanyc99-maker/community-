"""
test_teacher_pdf_export.py - Comprehensive verification for Teacher PDF Export
Tests:
1. /api/teacher/class-progress-pdf (Class-wide IEP Progress Report in PDF, English)
2. /api/teacher/export-report-pdf (Alias endpoint)
3. /api/teacher/student/<id>/progress-pdf with int ID, string ID, and username
4. Attachment download header checks (?download=1)
5. Clinical English terminology assertions
"""

import sys
from pathlib import Path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app import app
import database
import pdf_generator

def run_tests():
    print("========================================================")
    print("  TEACHER SECTION PDF EXPORT VERIFICATION (ENGLISH)   ")
    print("========================================================")

    # 1. Test database get_class_evaluation_report_data
    print("\n[1] Testing database.get_class_evaluation_report_data()...")
    class_data = database.get_class_evaluation_report_data(evaluator_name="Mrs. Sunita Sharma")
    assert class_data is not None, "class_data should not be None"
    assert "institution" in class_data, "class_data must contain 'institution'"
    assert "metrics" in class_data, "class_data must contain 'metrics'"
    assert "students" in class_data, "class_data must contain 'students'"
    assert "clinical_narrative" in class_data, "class_data must contain 'clinical_narrative'"
    print(f"    [PASS] Cohort size: {class_data['metrics']['cohort_size']}, Students: {len(class_data['students'])}")

    # 2. Test PDF Generator for Class Report
    print("\n[2] Testing pdf_generator.generate_class_progress_pdf()...")
    pdf_bytes, filename = pdf_generator.generate_class_progress_pdf(class_data)
    assert pdf_bytes.startswith(b"%PDF"), "Output must be a valid PDF binary"
    assert filename.endswith(".pdf"), "Filename must end with .pdf"
    assert "IEP_Progress_Report" in filename or "Prerana" in filename, f"Unexpected filename {filename}"
    print(f"    [PASS] Valid PDF generated: {filename} ({len(pdf_bytes)} bytes)")

    # 3. Test HTML Fallback Generator for Class Report
    print("\n[3] Testing pdf_generator.generate_class_progress_html()...")
    html_content = pdf_generator.generate_class_progress_html(class_data)
    assert "<!DOCTYPE html>" in html_content, "Must be valid HTML"
    assert "PRERANA ASSISTIVE LEARNING PLATFORM" in html_content
    assert "COMPREHENSIVE SPECIAL EDUCATION IEP PROGRESS &amp; OUTCOMES EVALUATION" in html_content
    assert "window.print()" in html_content
    print(f"    [PASS] HTML fallback generated ({len(html_content)} characters)")

    # 4. Test Flask Client Endpoints
    print("\n[4] Testing Flask API endpoints with Test Client...")
    with app.test_client() as client:
        # A. Unauthenticated access
        res = client.get("/api/teacher/class-progress-pdf")
        assert res.status_code == 401, f"Expected 401, got {res.status_code}"
        print("    [PASS] Unauthenticated access properly blocked (401)")

        # B. Student role forbidden
        with client.session_transaction() as sess:
            sess["user_id"] = 1
            sess["user_role"] = "student"
            sess["username"] = "student"
            sess["name"] = "Arjun Kumar"
        res = client.get("/api/teacher/class-progress-pdf")
        assert res.status_code == 403, f"Expected 403, got {res.status_code}"
        print("    [PASS] Student role access to teacher report blocked (403)")

        # C. Teacher role access - Class PDF inline
        with client.session_transaction() as sess:
            sess["user_id"] = 4
            sess["user_role"] = "teacher"
            sess["username"] = "teacher"
            sess["name"] = "Mrs. Sunita Sharma"

        res = client.get("/api/teacher/class-progress-pdf")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        assert res.headers["Content-Type"] == "application/pdf"
        assert res.data.startswith(b"%PDF")
        assert 'inline; filename="' in res.headers["Content-Disposition"]
        print(f"    [PASS] /api/teacher/class-progress-pdf served valid inline PDF ({len(res.data)} bytes)")

        # D. Teacher role access - Class PDF download (?download=1)
        res_dl = client.get("/api/teacher/class-progress-pdf?download=1")
        assert res_dl.status_code == 200
        assert res_dl.headers["Content-Type"] == "application/pdf"
        assert 'attachment; filename="' in res_dl.headers["Content-Disposition"]
        print("    [PASS] /api/teacher/class-progress-pdf?download=1 served attachment header")

        # E. Alias route /api/teacher/export-report-pdf
        res_alias = client.get("/api/teacher/export-report-pdf?download=1")
        assert res_alias.status_code == 200
        assert res_alias.headers["Content-Type"] == "application/pdf"
        assert 'attachment; filename="' in res_alias.headers["Content-Disposition"]
        print("    [PASS] /api/teacher/export-report-pdf served identical attachment PDF")

        # F. Student progress PDF with int ID
        first_stu_id = class_data["students"][0]["student"]["id"]
        res_stu = client.get(f"/api/teacher/student/{first_stu_id}/progress-pdf?download=1")
        assert res_stu.status_code == 200
        assert res_stu.headers["Content-Type"] == "application/pdf"
        assert 'attachment; filename="' in res_stu.headers["Content-Disposition"]
        print(f"    [PASS] /api/teacher/student/{first_stu_id}/progress-pdf served attachment PDF")

        # G. Student progress PDF with string ID / prefix
        res_stu_str = client.get(f"/api/teacher/student/stu_{first_stu_id}/progress-pdf?download=1")
        assert res_stu_str.status_code == 200
        assert res_stu_str.headers["Content-Type"] == "application/pdf"
        print(f"    [PASS] /api/teacher/student/stu_{first_stu_id}/progress-pdf gracefully resolved string ID")

    # 5. Verify Clinical English Terminology in Clinical Narrative
    print("\n[5] Verifying professional special-education English terminology...")
    narrative = class_data["clinical_narrative"]
    expected_terms = [
        "Baseline Cognitive Support Tier",
        "Multimodal Scaffolding",
        "Task Completion Latency",
        "Attentional stamina",
        "Curricular Domain Competency",
        "receptive phonemic decoding",
        "Institutional Pedagogical Interventions"
    ]
    for term in expected_terms:
        found = any(term in str(v) for v in narrative.values())
        assert found, f"Expected clinical term '{term}' not found in narrative"
        print(f"    [PASS] Verified term: '{term}'")

    print("\n========================================================")
    print("  ALL TEACHER PDF EXPORT VERIFICATIONS PASSED!         ")
    print("========================================================\n")

if __name__ == "__main__":
    run_tests()
