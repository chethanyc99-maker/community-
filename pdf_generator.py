"""
pdf_generator.py - Prerana Assistive Learning Platform
Generates official, high-resolution Individualized Education Program (IEP)
progress evaluation reports in PDF format using ReportLab, with a fallback
printable HTML representation.
"""

import io
import os
from datetime import datetime

# Try importing ReportLab
REPORTLAB_AVAILABLE = False
try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
    )
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False


# Register system fonts for clean rendering if available
FONT_REGULAR = "Helvetica"
FONT_BOLD = "Helvetica-Bold"
FONT_ITALIC = "Helvetica-Oblique"

if REPORTLAB_AVAILABLE and os.path.exists(r"C:\Windows\Fonts\arial.ttf"):
    try:
        pdfmetrics.registerFont(TTFont("Arial", r"C:\Windows\Fonts\arial.ttf"))
        if os.path.exists(r"C:\Windows\Fonts\arialbd.ttf"):
            pdfmetrics.registerFont(TTFont("Arial-Bold", r"C:\Windows\Fonts\arialbd.ttf"))
        if os.path.exists(r"C:\Windows\Fonts\ariali.ttf"):
            pdfmetrics.registerFont(TTFont("Arial-Italic", r"C:\Windows\Fonts\ariali.ttf"))
        FONT_REGULAR = "Arial"
        FONT_BOLD = "Arial-Bold"
        FONT_ITALIC = "Arial-Italic"
    except Exception:
        pass


def sanitize_text(text):
    """Sanitize strings for ReportLab XML/HTML-like paragraph rendering."""
    if text is None:
        return ""
    s = str(text)
    s = s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return s


def generate_student_progress_pdf(data):
    """
    Builds an official, publication-grade IEP Progress Evaluation PDF for a student.
    Returns (bytes, filename).
    """
    if not REPORTLAB_AVAILABLE:
        raise RuntimeError("ReportLab is not installed.")

    student = data.get("student", {})
    metrics = data.get("metrics", {})
    domains = data.get("domains", [])
    narrative = data.get("clinical_narrative", {})

    student_name = student.get("full_name") or student.get("name") or "Student"
    username = student.get("username") or "learner"
    student_id = student.get("id") or "000"
    support_tier = (student.get("support_tier") or student.get("level") or "moderate").capitalize()
    special_needs = student.get("special_needs") or student.get("disability") or "Intellectual & Developmental Delay"
    avatar = student.get("avatar") or "🌟"
    # Avatar text mapping to ensure clean rendering across all PDF engines without missing glyph boxes
    AVATAR_TEXT_MAP = {
        "🌟": "Star [Gold]",
        "🦁": "Lion [Courage]",
        "🐻": "Bear [Friendly]",
        "🦋": "Butterfly [Discovery]",
        "🐰": "Rabbit [Swift]",
        "🐬": "Dolphin [Playful]",
        "🚀": "Rocket [Adventure]",
        "🌈": "Rainbow [Creative]",
        "👩‍🏫": "Special Educator"
    }
    avatar_label = AVATAR_TEXT_MAP.get(avatar, f"Learner Badge ({avatar})")
    eval_date = data.get("generated_at") or datetime.now().strftime("%B %d, %Y - %I:%M %p")

    filename = f"IEP_Progress_Report_{username}_{datetime.now().strftime('%Y%m%d')}.pdf"

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom typography styles
    style_header_title = ParagraphStyle(
        'HeaderTitle',
        fontName=FONT_BOLD,
        fontSize=15,
        leading=18,
        textColor=colors.HexColor('#1E1B4B'),
        alignment=1,
        spaceAfter=2
    )

    style_header_sub = ParagraphStyle(
        'HeaderSub',
        fontName=FONT_BOLD,
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#4338CA'),
        alignment=1,
        spaceAfter=2
    )

    style_header_conf = ParagraphStyle(
        'HeaderConf',
        fontName=FONT_REGULAR,
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor('#64748B'),
        alignment=1
    )

    style_sec_title = ParagraphStyle(
        'SecTitle',
        fontName=FONT_BOLD,
        fontSize=10,
        leading=13,
        textColor=colors.HexColor('#1E1B4B'),
        spaceBefore=6,
        spaceAfter=4
    )

    style_meta_label = ParagraphStyle(
        'MetaLabel',
        fontName=FONT_BOLD,
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#475569')
    )

    style_meta_val = ParagraphStyle(
        'MetaVal',
        fontName=FONT_REGULAR,
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#0F172A')
    )

    style_cell = ParagraphStyle(
        'CellText',
        fontName=FONT_REGULAR,
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor('#0F172A')
    )

    style_cell_bold = ParagraphStyle(
        'CellTextBold',
        fontName=FONT_BOLD,
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor('#0F172A')
    )

    style_cell_header = ParagraphStyle(
        'CellHeader',
        fontName=FONT_BOLD,
        fontSize=7.5,
        leading=10,
        textColor=colors.white
    )

    style_kpi_num = ParagraphStyle(
        'KpiNum',
        fontName=FONT_BOLD,
        fontSize=13,
        leading=15,
        textColor=colors.HexColor('#1E1B4B'),
        alignment=1
    )

    style_kpi_label = ParagraphStyle(
        'KpiLabel',
        fontName=FONT_BOLD,
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor('#64748B'),
        alignment=1
    )

    style_narrative_h = ParagraphStyle(
        'NarrativeHeading',
        fontName=FONT_BOLD,
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor('#312E81'),
        spaceBefore=3,
        spaceAfter=1
    )

    style_narrative_body = ParagraphStyle(
        'NarrativeBody',
        fontName=FONT_REGULAR,
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#1E293B'),
        alignment=4,  # Justified
        spaceAfter=4
    )

    story = []

    # 1. Official Header
    story.append(Paragraph("PRERANA ASSISTIVE LEARNING PLATFORM", style_header_title))
    story.append(Paragraph("INDIVIDUALIZED COGNITIVE &amp; PEDAGOGICAL PROGRESS EVALUATION (IEP)", style_header_sub))
    story.append(Paragraph("OFFICIAL SPECIAL EDUCATION CLINICAL &amp; PEDAGOGICAL ASSESSMENT RECORD", style_header_conf))
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#4338CA'), spaceBefore=2, spaceAfter=8))

    # 2. Student Metadata Grid
    meta_table_data = [
        [
            Paragraph("<b>Student Full Name:</b>", style_meta_label),
            Paragraph(sanitize_text(student_name), style_meta_val),
            Paragraph("<b>Learner ID / Ref:</b>", style_meta_label),
            Paragraph(f"PR-STU-{sanitize_text(student_id)}", style_meta_val),
        ],
        [
            Paragraph("<b>Username / Account:</b>", style_meta_label),
            Paragraph(f"@{sanitize_text(username)}", style_meta_val),
            Paragraph("<b>Evaluation Date:</b>", style_meta_label),
            Paragraph(eval_date, style_meta_val),
        ],
        [
            Paragraph("<b>Baseline Support Tier:</b>", style_meta_label),
            Paragraph(f"{sanitize_text(support_tier)} Support Tier", style_meta_val),
            Paragraph("<b>Mascot Profile Avatar:</b>", style_meta_label),
            Paragraph(sanitize_text(avatar_label), style_meta_val),
        ],
        [
            Paragraph("<b>Primary Profile / Special Needs:</b>", style_meta_label),
            Paragraph(sanitize_text(special_needs), style_meta_val),
            Paragraph("<b>Active Difficulty Pacing:</b>", style_meta_label),
            Paragraph(sanitize_text(metrics.get("difficulty", "Moderate").capitalize()), style_meta_val),
        ]
    ]

    meta_table = Table(meta_table_data, colWidths=[120, 160, 120, 140])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0, 0), (-1, -1), 3.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 8))

    # 3. Telemetry KPI Highlights Bar
    kpi_table_data = [
        [
            Paragraph(str(metrics.get("completed_modules_count", 0)) + " / 18", style_kpi_num),
            Paragraph(str(metrics.get("total_activities", 0)), style_kpi_num),
            Paragraph(f"{metrics.get('first_try_rate', 100)}%", style_kpi_num),
            Paragraph(f"{metrics.get('average_latency', 1.8):.1f} s", style_kpi_num),
            Paragraph(f"{metrics.get('stars', 0)} Stars", style_kpi_num)
        ],
        [
            Paragraph("DOMAINS EXPLORED", style_kpi_label),
            Paragraph("TASKS COMPLETED", style_kpi_label),
            Paragraph("FIRST-TRY ACCURACY", style_kpi_label),
            Paragraph("MEAN TASK LATENCY", style_kpi_label),
            Paragraph("STARS EARNED", style_kpi_label)
        ]
    ]
    kpi_table = Table(kpi_table_data, colWidths=[108, 108, 108, 108, 108])
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#EFF6FF')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#BFDBFE')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#DBEAFE')),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(kpi_table)
    story.append(Spacer(1, 8))

    # 4. Domain-Specific Competencies & Module Table
    story.append(Paragraph("INDIVIDUALIZED DOMAIN COMPETENCIES &amp; ACCURACY MATRIX", style_sec_title))

    col_widths = [115, 145, 60, 50, 55, 55, 60]
    domain_table_rows = [
        [
            Paragraph("Cognitive Domain", style_cell_header),
            Paragraph("Target Pedagogical Objective", style_cell_header),
            Paragraph("Tier", style_cell_header),
            Paragraph("Tasks", style_cell_header),
            Paragraph("Accuracy", style_cell_header),
            Paragraph("Latency", style_cell_header),
            Paragraph("Mastery", style_cell_header)
        ]
    ]

    for d in domains[:10]:  # Up to top 10 relevant domains assessed
        domain_table_rows.append([
            Paragraph(sanitize_text(d.get("name")), style_cell_bold),
            Paragraph(sanitize_text(d.get("objective")), style_cell),
            Paragraph(sanitize_text(d.get("difficulty", "Mid").capitalize()), style_cell),
            Paragraph(str(d.get("completed_count", 0)), style_cell),
            Paragraph(f"{d.get('accuracy', 100)}%", style_cell),
            Paragraph(f"{d.get('latency', 1.6):.1f}s", style_cell),
            Paragraph(sanitize_text(d.get("mastery_status", "Emerging")), style_cell_bold)
        ])

    domain_table = Table(domain_table_rows, colWidths=col_widths)
    domain_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E1B4B')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(domain_table)
    story.append(Spacer(1, 8))

    # 5. Formal Clinical & Pedagogical Narrative
    narrative_elements = [
        Paragraph("FORMAL CLINICAL NARRATIVE &amp; PEDAGOGICAL ASSESSMENT", style_sec_title),
        Paragraph("<b>1. Baseline Cognitive Support Tier &amp; Executive Functioning Analysis</b>", style_narrative_h),
        Paragraph(sanitize_text(narrative.get("cognitive_tier_analysis", "")), style_narrative_body),
        Paragraph("<b>2. Task Completion Latency, Attention &amp; Sensory Engagement</b>", style_narrative_h),
        Paragraph(sanitize_text(narrative.get("latency_engagement_analysis", "")), style_narrative_body),
        Paragraph("<b>3. Phonemic Decoding, Quantitative Reasoning &amp; Adaptive Gains</b>", style_narrative_h),
        Paragraph(sanitize_text(narrative.get("domain_gains_analysis", "")), style_narrative_body),
        Paragraph("<b>4. Recommended Pedagogical Interventions &amp; Scaffolded Accommodations</b>", style_narrative_h),
        Paragraph(sanitize_text(narrative.get("recommended_interventions", "")), style_narrative_body)
    ]
    story.append(KeepTogether(narrative_elements))
    story.append(Spacer(1, 8))

    # 6. Institutional Signatures & Verification Block
    sig_data = [
        [
            Paragraph("<b>EVALUATED BY SPECIAL EDUCATOR:</b>", style_meta_label),
            Paragraph("<b>INSTITUTIONAL ACCREDITATION &amp; APPROVAL:</b>", style_meta_label)
        ],
        [
            Paragraph("Signature: ___________________________________<br/>"
                      "<b>Licensed Special Educator / Case Manager</b><br/>"
                      "Date: " + eval_date, style_cell),
            Paragraph("Signature: ___________________________________<br/>"
                      "<b>Head of Special Pedagogy &amp; Clinical IEP Oversight</b><br/>"
                      "Prerana Assistive Learning Center", style_cell)
        ],
        [
            Paragraph("<i>Report verified under Prerana Assistive Technology Protocol &amp; Special Education Framework.</i>", style_header_conf),
            Paragraph("<i>Official Institutional Document • Confidential Student File</i>", style_header_conf)
        ]
    ]

    sig_table = Table(sig_data, colWidths=[270, 270])
    sig_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(KeepTogether([sig_table]))

    doc.build(story)
    return buf.getvalue(), filename


def generate_student_progress_html(data):
    """
    Fallback high-contrast, print-optimized HTML progress card view.
    Auto-triggers window.print() when opened in browser.
    """
    student = data.get("student", {})
    metrics = data.get("metrics", {})
    domains = data.get("domains", [])
    narrative = data.get("clinical_narrative", {})

    student_name = student.get("full_name") or student.get("name") or "Student"
    username = student.get("username") or "learner"
    student_id = student.get("id") or "000"
    support_tier = (student.get("support_tier") or student.get("level") or "moderate").capitalize()
    special_needs = student.get("special_needs") or student.get("disability") or "Intellectual & Developmental Delay"
    avatar = student.get("avatar") or "🌟"
    # Avatar text mapping to ensure clean rendering across all PDF engines without missing glyph boxes
    AVATAR_TEXT_MAP = {
        "🌟": "Star [Gold]",
        "🦁": "Lion [Courage]",
        "🐻": "Bear [Friendly]",
        "🦋": "Butterfly [Discovery]",
        "🐰": "Rabbit [Swift]",
        "🐬": "Dolphin [Playful]",
        "🚀": "Rocket [Adventure]",
        "🌈": "Rainbow [Creative]",
        "👩‍🏫": "Special Educator"
    }
    avatar_label = AVATAR_TEXT_MAP.get(avatar, f"Learner Badge ({avatar})")
    eval_date = data.get("generated_at") or datetime.now().strftime("%B %d, %Y - %I:%M %p")

    domains_html = ""
    for d in domains:
        domains_html += f"""
        <tr>
          <td><strong>{d.get('name')}</strong></td>
          <td>{d.get('objective')}</td>
          <td>{d.get('difficulty', 'Mid').capitalize()}</td>
          <td>{d.get('completed_count', 0)}</td>
          <td>{d.get('accuracy', 100)}%</td>
          <td>{d.get('latency', 1.8):.1f}s</td>
          <td><span class="badge badge-success">{d.get('mastery_status', 'Emerging')}</span></td>
        </tr>
        """

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>IEP Progress Evaluation - {student_name} (@{username})</title>
  <style>
    @page {{
      size: letter;
      margin: 12mm 15mm;
    }}
    * {{
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #0F172A;
      background: #FFFFFF;
      margin: 0;
      padding: 24px;
      line-height: 1.45;
      font-size: 13px;
    }}
    .iep-container {{
      max-width: 900px;
      margin: 0 auto;
      border: 1.5px solid #CBD5E1;
      border-radius: 12px;
      padding: 28px 32px;
      background: #FFFFFF;
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06);
    }}
    .iep-header {{
      text-align: center;
      border-bottom: 2px solid #4338CA;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }}
    .iep-title {{
      font-size: 20px;
      font-weight: 800;
      color: #1E1B4B;
      margin: 0 0 4px 0;
      letter-spacing: -0.01em;
    }}
    .iep-sub {{
      font-size: 12px;
      font-weight: 700;
      color: #4338CA;
      margin: 0 0 4px 0;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }}
    .iep-conf {{
      font-size: 10px;
      color: #64748B;
      margin: 0;
    }}
    .meta-grid {{
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px 20px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 16px;
    }}
    .meta-item {{
      font-size: 12px;
    }}
    .meta-label {{
      font-weight: 700;
      color: #475569;
    }}
    .kpi-row {{
      display: flex;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 20px;
    }}
    .kpi-card {{
      flex: 1;
      text-align: center;
      background: #EFF6FF;
      border: 1px solid #BFDBFE;
      border-radius: 8px;
      padding: 10px 6px;
    }}
    .kpi-num {{
      font-size: 18px;
      font-weight: 800;
      color: #1E1B4B;
    }}
    .kpi-label {{
      font-size: 9px;
      font-weight: 700;
      color: #64748B;
      text-transform: uppercase;
      margin-top: 2px;
    }}
    .sec-heading {{
      font-size: 13px;
      font-weight: 800;
      color: #1E1B4B;
      border-bottom: 1.5px solid #E2E8F0;
      padding-bottom: 4px;
      margin: 18px 0 10px 0;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }}
    table.data-table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-bottom: 18px;
    }}
    table.data-table th {{
      background: #1E1B4B;
      color: #FFFFFF;
      font-weight: 700;
      text-align: left;
      padding: 6px 8px;
    }}
    table.data-table td {{
      padding: 6px 8px;
      border-bottom: 1px solid #E2E8F0;
    }}
    table.data-table tr:nth-child(even) td {{
      background: #F8FAFC;
    }}
    .badge {{
      display: inline-block;
      padding: 2px 6px;
      font-size: 9px;
      font-weight: 700;
      border-radius: 4px;
    }}
    .badge-success {{
      background: #DCFCE7;
      color: #15803D;
      border: 1px solid #86EFAC;
    }}
    .clinical-narrative {{
      background: #FAFAFA;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 20px;
    }}
    .narrative-item {{
      margin-bottom: 10px;
    }}
    .narrative-item strong {{
      color: #312E81;
      font-size: 12px;
      display: block;
      margin-bottom: 3px;
    }}
    .narrative-item p {{
      margin: 0;
      font-size: 11.5px;
      color: #334155;
      text-align: justify;
    }}
    .sig-row {{
      display: flex;
      justify-content: space-between;
      gap: 30px;
      margin-top: 24px;
      padding-top: 14px;
      border-top: 1px solid #CBD5E1;
    }}
    .sig-box {{
      flex: 1;
      font-size: 11px;
    }}
    .sig-line {{
      margin-top: 36px;
      border-bottom: 1px solid #475569;
      width: 90%;
    }}
    .print-controls {{
      margin-bottom: 16px;
      text-align: right;
    }}
    .btn-print {{
      background: #4338CA;
      color: #FFFFFF;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      font-weight: 700;
      cursor: pointer;
    }}
    @media print {{
      .print-controls {{
        display: none !important;
      }}
      body {{
        padding: 0;
      }}
      .iep-container {{
        border: none;
        box-shadow: none;
        padding: 0;
      }}
    }}
  </style>
</head>
<body>
  <div class="print-controls">
    <button class="btn-print" onclick="window.print()">🖨️ Print or Save as PDF</button>
  </div>

  <div class="iep-container">
    <div class="iep-header">
      <h1 class="iep-title">PRERANA ASSISTIVE LEARNING PLATFORM</h1>
      <div class="iep-sub">Individualized Cognitive &amp; Pedagogical Progress Evaluation (IEP)</div>
      <div class="iep-conf">Confidential Special Education Assessment &amp; Clinical Progress Documentation</div>
    </div>

    <div class="meta-grid">
      <div class="meta-item"><span class="meta-label">Student Name:</span> <strong>{student_name}</strong></div>
      <div class="meta-item"><span class="meta-label">Learner ID:</span> PR-STU-{student_id}</div>
      <div class="meta-item"><span class="meta-label">Username:</span> @{username}</div>
      <div class="meta-item"><span class="meta-label">Evaluation Date:</span> {eval_date}</div>
      <div class="meta-item"><span class="meta-label">Support Tier:</span> {support_tier} Support Tier</div>
      <div class="meta-item"><span class="meta-label">Mascot Profile:</span> Badge {avatar}</div>
      <div class="meta-item"><span class="meta-label">Special Needs:</span> {special_needs}</div>
      <div class="meta-item"><span class="meta-label">Current Difficulty:</span> {metrics.get("difficulty", "Moderate").capitalize()}</div>
    </div>

    <div class="kpi-row">
      <div class="kpi-card">
        <div class="kpi-num">{metrics.get("completed_modules_count", 0)} / 18</div>
        <div class="kpi-label">Domains Explored</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-num">{metrics.get("total_activities", 0)}</div>
        <div class="kpi-label">Tasks Completed</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-num">{metrics.get("first_try_rate", 100)}%</div>
        <div class="kpi-label">First-Try Accuracy</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-num">{metrics.get("average_latency", 1.8):.1f}s</div>
        <div class="kpi-label">Mean Latency</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-num">⭐ {metrics.get("stars", 0)}</div>
        <div class="kpi-label">Stars Earned</div>
      </div>
    </div>

    <div class="sec-heading">Individualized Domain Competencies &amp; Accuracy Matrix</div>
    <table class="data-table">
      <thead>
        <tr>
          <th>Cognitive Domain</th>
          <th>Pedagogical Objective</th>
          <th>Tier</th>
          <th>Tasks</th>
          <th>Accuracy</th>
          <th>Latency</th>
          <th>Mastery Status</th>
        </tr>
      </thead>
      <tbody>
        {domains_html}
      </tbody>
    </table>

    <div class="sec-heading">Formal Clinical Narrative &amp; Pedagogical Evaluation</div>
    <div class="clinical-narrative">
      <div class="narrative-item">
        <strong>1. Baseline Cognitive Support Tier &amp; Executive Functioning Analysis</strong>
        <p>{narrative.get('cognitive_tier_analysis')}</p>
      </div>
      <div class="narrative-item">
        <strong>2. Task Completion Latency, Attention &amp; Sensory Engagement</strong>
        <p>{narrative.get('latency_engagement_analysis')}</p>
      </div>
      <div class="narrative-item">
        <strong>3. Phonemic Decoding, Numeracy &amp; Adaptive Skill Gains</strong>
        <p>{narrative.get('domain_gains_analysis')}</p>
      </div>
      <div class="narrative-item">
        <strong>4. Recommended Pedagogical Interventions &amp; Scaffolded Accommodations</strong>
        <p>{narrative.get('recommended_interventions')}</p>
      </div>
    </div>

    <div class="sig-row">
      <div class="sig-box">
        <strong>Evaluated by Special Educator:</strong>
        <div class="sig-line"></div>
        <div style="margin-top: 6px;">Licensed Special Education Specialist / Case Manager</div>
        <div style="color: #64748B;">Date: {eval_date}</div>
      </div>
      <div class="sig-box">
        <strong>Institutional Approval &amp; Accreditation:</strong>
        <div class="sig-line"></div>
        <div style="margin-top: 6px;">Director of Special Pedagogy &amp; Clinical Oversight</div>
        <div style="color: #64748B;">Prerana Assistive Learning Center</div>
      </div>
    </div>
  </div>
</body>
</html>
"""
    return html


def generate_class_progress_pdf(data):
    """
    Builds an official, publication-grade Center-Wide Special Education IEP Progress
    and Outcomes Evaluation PDF in English using ReportLab.
    Returns (bytes, filename).
    """
    if not REPORTLAB_AVAILABLE:
        raise RuntimeError("ReportLab is not installed.")

    institution = data.get("institution", {})
    metrics = data.get("metrics", {})
    students = data.get("students", [])
    domains_summary = data.get("domains_summary", [])
    narrative = data.get("clinical_narrative", {})

    center_name = institution.get("name", "Prerana Special Education & Assistive Learning Center")
    evaluator_name = institution.get("evaluator_name", "Mrs. Sunita Sharma")
    eval_date = institution.get("generated_at") or datetime.now().strftime("%B %d, %Y - %I:%M %p")
    cohort_size = metrics.get("cohort_size", len(students))
    tier_counts = metrics.get("tier_counts", {})
    tier_str = f"Mild: {tier_counts.get('mild', 0)} | Moderate: {tier_counts.get('moderate', 0)} | High: {tier_counts.get('high', 0)}"

    filename = f"Prerana_Center_IEP_Progress_Report_{datetime.now().strftime('%Y%m%d')}.pdf"

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    style_header_title = ParagraphStyle(
        'ClassHeaderTitle',
        fontName=FONT_BOLD,
        fontSize=14,
        leading=17,
        textColor=colors.HexColor('#1E1B4B'),
        alignment=1,
        spaceAfter=2
    )

    style_header_sub = ParagraphStyle(
        'ClassHeaderSub',
        fontName=FONT_BOLD,
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#4338CA'),
        alignment=1,
        spaceAfter=2
    )

    style_header_conf = ParagraphStyle(
        'ClassHeaderConf',
        fontName=FONT_REGULAR,
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor('#64748B'),
        alignment=1
    )

    style_sec_title = ParagraphStyle(
        'ClassSecTitle',
        fontName=FONT_BOLD,
        fontSize=9.5,
        leading=12.5,
        textColor=colors.HexColor('#1E1B4B'),
        spaceBefore=6,
        spaceAfter=3
    )

    style_meta_label = ParagraphStyle(
        'ClassMetaLabel',
        fontName=FONT_BOLD,
        fontSize=7.5,
        leading=10.5,
        textColor=colors.HexColor('#475569')
    )

    style_meta_val = ParagraphStyle(
        'ClassMetaVal',
        fontName=FONT_REGULAR,
        fontSize=7.5,
        leading=10.5,
        textColor=colors.HexColor('#0F172A')
    )

    style_cell = ParagraphStyle(
        'ClassCell',
        fontName=FONT_REGULAR,
        fontSize=7,
        leading=9.5,
        textColor=colors.HexColor('#0F172A')
    )

    style_cell_bold = ParagraphStyle(
        'ClassCellBold',
        fontName=FONT_BOLD,
        fontSize=7,
        leading=9.5,
        textColor=colors.HexColor('#0F172A')
    )

    style_cell_header = ParagraphStyle(
        'ClassCellHeader',
        fontName=FONT_BOLD,
        fontSize=7,
        leading=9.5,
        textColor=colors.white
    )

    style_kpi_num = ParagraphStyle(
        'ClassKpiNum',
        fontName=FONT_BOLD,
        fontSize=12,
        leading=14,
        textColor=colors.HexColor('#1E1B4B'),
        alignment=1
    )

    style_kpi_label = ParagraphStyle(
        'ClassKpiLabel',
        fontName=FONT_BOLD,
        fontSize=7,
        leading=9,
        textColor=colors.HexColor('#64748B'),
        alignment=1
    )

    style_narrative_h = ParagraphStyle(
        'ClassNarrativeH',
        fontName=FONT_BOLD,
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#312E81'),
        spaceBefore=3,
        spaceAfter=1
    )

    style_narrative_body = ParagraphStyle(
        'ClassNarrativeBody',
        fontName=FONT_REGULAR,
        fontSize=7.5,
        leading=10.5,
        textColor=colors.HexColor('#1E293B'),
        alignment=4,
        spaceAfter=3
    )

    AVATAR_TEXT_MAP = {
        "🌟": "Star [Gold]",
        "🦁": "Lion [Courage]",
        "🐻": "Bear [Friendly]",
        "🦋": "Butterfly [Discovery]",
        "🐰": "Rabbit [Swift]",
        "🐬": "Dolphin [Playful]",
        "🚀": "Rocket [Adventure]",
        "🌈": "Rainbow [Creative]",
        "👩‍🏫": "Educator"
    }

    story = []

    # 1. Official Header
    story.append(Paragraph("PRERANA ASSISTIVE LEARNING PLATFORM", style_header_title))
    story.append(Paragraph("COMPREHENSIVE SPECIAL EDUCATION IEP PROGRESS &amp; OUTCOMES EVALUATION", style_header_sub))
    story.append(Paragraph("OFFICIAL SPECIAL EDUCATION CLINICAL &amp; PEDAGOGICAL ASSESSMENT RECORD (ENGLISH)", style_header_conf))
    story.append(Spacer(1, 3))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#4338CA'), spaceBefore=2, spaceAfter=6))

    # 2. Metadata Grid
    meta_table_data = [
        [
            Paragraph("<b>Center / Institution:</b>", style_meta_label),
            Paragraph(sanitize_text(center_name), style_meta_val),
            Paragraph("<b>Evaluation Date:</b>", style_meta_label),
            Paragraph(sanitize_text(eval_date), style_meta_val),
        ],
        [
            Paragraph("<b>Evaluating Educator:</b>", style_meta_label),
            Paragraph(sanitize_text(evaluator_name), style_meta_val),
            Paragraph("<b>Enrolled Cohort Size:</b>", style_meta_label),
            Paragraph(f"{cohort_size} Enrolled Students", style_meta_val),
        ],
        [
            Paragraph("<b>Accreditation Alignment:</b>", style_meta_label),
            Paragraph("UN SDG 4.5 &amp; PO6 Assistive Special Education", style_meta_val),
            Paragraph("<b>Cognitive Tiers:</b>", style_meta_label),
            Paragraph(sanitize_text(tier_str), style_meta_val),
        ],
    ]
    meta_table = Table(meta_table_data, colWidths=[120, 150, 110, 160])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 5))

    # 3. KPI Callout Cards
    kpi_table_data = [
        [
            Paragraph(str(cohort_size), style_kpi_num),
            Paragraph(str(metrics.get("total_tasks", 0)), style_kpi_num),
            Paragraph(f"{metrics.get('average_accuracy', 100)}%", style_kpi_num),
            Paragraph(f"{metrics.get('average_latency', 2.0):.1f}s", style_kpi_num),
            Paragraph(f"{metrics.get('total_stars', 0)}", style_kpi_num),
        ],
        [
            Paragraph("Enrolled Learners", style_kpi_label),
            Paragraph("Tasks Completed", style_kpi_label),
            Paragraph("Mean Accuracy", style_kpi_label),
            Paragraph("Mean Latency", style_kpi_label),
            Paragraph("Stars Awarded", style_kpi_label),
        ]
    ]
    kpi_table = Table(kpi_table_data, colWidths=[108, 108, 108, 108, 108])
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#EEF2FF')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#C7D2FE')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E0E7FF')),
        ('TOPPADDING', (0, 0), (-1, 0), 4),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 1),
        ('TOPPADDING', (0, 1), (-1, 1), 0),
        ('BOTTOMPADDING', (0, 1), (-1, 1), 4),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    story.append(kpi_table)
    story.append(Spacer(1, 5))

    # 4. Cohort Student Performance Matrix Table
    story.append(Paragraph("<b>Individualized Student Progress &amp; IEP Milestone Matrix</b>", style_sec_title))
    stu_table_headers = [
        Paragraph("Learner Name &amp; ID", style_cell_header),
        Paragraph("Username", style_cell_header),
        Paragraph("Support Tier", style_cell_header),
        Paragraph("Badge", style_cell_header),
        Paragraph("Tasks", style_cell_header),
        Paragraph("Accuracy", style_cell_header),
        Paragraph("Latency", style_cell_header),
        Paragraph("Mastery Classification", style_cell_header),
    ]
    stu_table_data = [stu_table_headers]

    for s_rep in students:
        s_obj = s_rep.get("student", {})
        s_met = s_rep.get("metrics", {})
        s_name = s_obj.get("full_name") or s_obj.get("name") or "Student"
        s_id = s_obj.get("id") or "0"
        s_user = s_obj.get("username") or "learner"
        s_tier = (s_obj.get("support_tier") or "moderate").capitalize()
        s_avatar = s_obj.get("avatar") or "🌟"
        s_avatar_txt = AVATAR_TEXT_MAP.get(s_avatar, s_avatar)
        s_tasks = s_met.get("total_activities", 0)
        s_acc = s_met.get("first_try_rate", 100)
        s_lat = s_met.get("average_latency", 1.8)

        doms = s_rep.get("domains", [])
        mastered = len([d for d in doms if "Mastery" in d.get("mastery_status", "")])
        proficient = len([d for d in doms if "Proficient" in d.get("mastery_status", "")])
        if mastered >= 3:
            s_status = "Demonstrated Mastery (Level IV)"
        elif mastered >= 1 or proficient >= 2:
            s_status = "Proficient / Consolidated (Level III)"
        else:
            s_status = "Emerging Competency (Level II)"

        row = [
            Paragraph(f"<b>{sanitize_text(s_name)}</b><br/><font color='#64748B'>PR-STU-{s_id}</font>", style_cell),
            Paragraph(f"@{sanitize_text(s_user)}", style_cell),
            Paragraph(f"{sanitize_text(s_tier)}", style_cell),
            Paragraph(sanitize_text(s_avatar_txt), style_cell),
            Paragraph(str(s_tasks), style_cell),
            Paragraph(f"{s_acc}%", style_cell_bold),
            Paragraph(f"{s_lat:.1f}s", style_cell),
            Paragraph(f"<font color='#047857'><b>{sanitize_text(s_status)}</b></font>", style_cell),
        ]
        stu_table_data.append(row)

    stu_table = Table(stu_table_data, colWidths=[100, 60, 60, 60, 35, 45, 40, 140])
    stu_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#312E81')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(stu_table)
    story.append(Spacer(1, 5))

    # 5. Curricular Domain Summary Table
    story.append(Paragraph("<b>Curricular Assistive Domain Competency &amp; Accuracy Overview</b>", style_sec_title))
    dom_table_headers = [
        Paragraph("Learning Domain", style_cell_header),
        Paragraph("Pedagogical Category", style_cell_header),
        Paragraph("Active Learners", style_cell_header),
        Paragraph("Trials Completed", style_cell_header),
        Paragraph("Mean Accuracy", style_cell_header),
    ]
    dom_table_data = [dom_table_headers]

    for d in domains_summary[:8]:
        dom_table_data.append([
            Paragraph(f"<b>{sanitize_text(d.get('name'))}</b>", style_cell),
            Paragraph(sanitize_text(d.get('category')), style_cell),
            Paragraph(str(d.get('active_students', 0)), style_cell),
            Paragraph(str(d.get('completed_trials', 0)), style_cell),
            Paragraph(f"{d.get('accuracy', 100)}%", style_cell_bold),
        ])

    dom_table = Table(dom_table_data, colWidths=[160, 150, 70, 80, 80])
    dom_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4338CA')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(dom_table)
    story.append(Spacer(1, 6))

    # 6. Formal Clinical Narrative & Pedagogical Evaluation
    story.append(Paragraph("<b>Formal Clinical Narrative &amp; Institutional Pedagogical Evaluation</b>", style_sec_title))
    narrative_data = [
        [
            Paragraph("<b>1. Baseline Cognitive Support Tier &amp; Multimodal Scaffolding</b>", style_narrative_h),
        ],
        [
            Paragraph(sanitize_text(narrative.get("cohort_tier_analysis", "")), style_narrative_body),
        ],
        [
            Paragraph("<b>2. Cohort Task Completion Latency, Attention &amp; Sensory Engagement</b>", style_narrative_h),
        ],
        [
            Paragraph(sanitize_text(narrative.get("latency_engagement_analysis", "")), style_narrative_body),
        ],
        [
            Paragraph("<b>3. Curricular Domain Competency Progression &amp; Literacy/Numeracy Gains</b>", style_narrative_h),
        ],
        [
            Paragraph(sanitize_text(narrative.get("domain_gains_analysis", "")), style_narrative_body),
        ],
        [
            Paragraph("<b>4. Institutional Pedagogical Interventions &amp; Adaptive Accommodations</b>", style_narrative_h),
        ],
        [
            Paragraph(sanitize_text(narrative.get("recommended_interventions", "")), style_narrative_body),
        ],
    ]
    narrative_table = Table(narrative_data, colWidths=[540])
    narrative_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor('#C7D2FE')),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('LEFTPADDING', (0, 0), (-1, -1), 7),
        ('RIGHTPADDING', (0, 0), (-1, -1), 7),
    ]))
    story.append(KeepTogether([narrative_table]))
    story.append(Spacer(1, 8))

    # 7. Official Institutional Signatures
    sig_data = [
        [
            Paragraph("<b>Evaluated by Special Educator:</b>", style_meta_label),
            Paragraph("<b>Institutional Approval &amp; Accreditation:</b>", style_meta_label),
        ],
        [
            Paragraph("<br/><br/>________________________________________", style_cell),
            Paragraph("<br/><br/>________________________________________", style_cell),
        ],
        [
            Paragraph(f"<b>{sanitize_text(evaluator_name)}</b><br/>"
                      f"Licensed Special Education Specialist / Case Manager<br/>"
                      f"<font color='#64748B'>Evaluation Date: {sanitize_text(eval_date)}</font>", style_cell),
            Paragraph("<b>Director of Special Pedagogy &amp; Clinical Accreditation</b><br/>"
                      f"{sanitize_text(center_name)}<br/>"
                      f"<font color='#64748B'>Official Special Education Record</font>", style_cell),
        ],
    ]
    sig_table = Table(sig_data, colWidths=[270, 270])
    sig_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(KeepTogether([sig_table]))

    doc.build(story)
    return buf.getvalue(), filename


def generate_class_progress_html(data):
    """
    Fallback printable, high-contrast HTML view for Center-Wide IEP Progress Report.
    Auto-triggers window.print() when opened in browser.
    """
    institution = data.get("institution", {})
    metrics = data.get("metrics", {})
    students = data.get("students", [])
    domains_summary = data.get("domains_summary", [])
    narrative = data.get("clinical_narrative", {})

    center_name = institution.get("name", "Prerana Special Education & Assistive Learning Center")
    evaluator_name = institution.get("evaluator_name", "Mrs. Sunita Sharma")
    eval_date = institution.get("generated_at") or datetime.now().strftime("%B %d, %Y - %I:%M %p")
    cohort_size = metrics.get("cohort_size", len(students))
    tier_counts = metrics.get("tier_counts", {})
    tier_str = f"Mild: {tier_counts.get('mild', 0)} | Moderate: {tier_counts.get('moderate', 0)} | High: {tier_counts.get('high', 0)}"

    students_html = ""
    for s_rep in students:
        s_obj = s_rep.get("student", {})
        s_met = s_rep.get("metrics", {})
        s_name = s_obj.get("full_name") or s_obj.get("name") or "Student"
        s_id = s_obj.get("id") or "0"
        s_user = s_obj.get("username") or "learner"
        s_tier = (s_obj.get("support_tier") or "moderate").capitalize()
        s_avatar = s_obj.get("avatar") or "🌟"
        s_tasks = s_met.get("total_activities", 0)
        s_acc = s_met.get("first_try_rate", 100)
        s_lat = s_met.get("average_latency", 1.8)

        students_html += f"""
        <tr>
          <td><strong>{s_name}</strong><br><small style="color:#64748B;">PR-STU-{s_id}</small></td>
          <td>@{s_user}</td>
          <td><span class="badge badge-tier">{s_tier}</span></td>
          <td>{s_avatar}</td>
          <td>{s_tasks}</td>
          <td><strong>{s_acc}%</strong></td>
          <td>{s_lat:.1f}s</td>
          <td><span class="badge badge-success">Demonstrated Mastery</span></td>
        </tr>
        """

    domains_html = ""
    for d in domains_summary[:8]:
        domains_html += f"""
        <tr>
          <td><strong>{d.get('name')}</strong></td>
          <td>{d.get('category')}</td>
          <td>{d.get('active_students', 0)}</td>
          <td>{d.get('completed_trials', 0)}</td>
          <td><strong>{d.get('accuracy', 100)}%</strong></td>
        </tr>
        """

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Center-Wide Special Education IEP Progress Report - Prerana</title>
  <style>
    @page {{
      size: letter;
      margin: 12mm 15mm;
    }}
    * {{
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background: #F1F5F9;
      color: #0F172A;
      font-size: 11pt;
    }}
    .iep-container {{
      max-width: 900px;
      margin: 0 auto;
      background: #FFFFFF;
      padding: 32px;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.06);
    }}
    .iep-header {{
      text-align: center;
      border-bottom: 2px solid #4338CA;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }}
    .iep-title {{
      font-size: 18pt;
      font-weight: 800;
      color: #1E1B4B;
      margin: 0 0 4px 0;
      letter-spacing: 0.5px;
    }}
    .iep-sub {{
      font-size: 12pt;
      font-weight: 700;
      color: #4338CA;
      margin: 0 0 4px 0;
    }}
    .iep-conf {{
      font-size: 9pt;
      font-weight: 600;
      color: #64748B;
      letter-spacing: 0.5px;
    }}
    .meta-grid {{
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px 16px;
      background: #F8FAFC;
      border: 1px solid #CBD5E1;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 16px;
      font-size: 9.5pt;
    }}
    .meta-label {{
      font-weight: 700;
      color: #475569;
    }}
    .kpi-row {{
      display: flex;
      gap: 10px;
      margin-bottom: 16px;
    }}
    .kpi-card {{
      flex: 1;
      text-align: center;
      background: #EEF2FF;
      border: 1px solid #C7D2FE;
      border-radius: 8px;
      padding: 10px 6px;
    }}
    .kpi-num {{
      font-size: 15pt;
      font-weight: 800;
      color: #1E1B4B;
    }}
    .kpi-label {{
      font-size: 8pt;
      font-weight: 700;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-top: 2px;
    }}
    .sec-heading {{
      font-size: 11pt;
      font-weight: 800;
      color: #1E1B4B;
      border-bottom: 1px solid #CBD5E1;
      padding-bottom: 4px;
      margin: 16px 0 8px 0;
    }}
    .data-table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
      margin-bottom: 16px;
    }}
    .data-table th {{
      background: #312E81;
      color: #FFFFFF;
      text-align: left;
      padding: 6px 8px;
      font-weight: 700;
    }}
    .data-table td {{
      padding: 6px 8px;
      border-bottom: 1px solid #E2E8F0;
    }}
    .badge {{
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 7.5pt;
      font-weight: 700;
    }}
    .badge-success {{
      background: #DCFCE7;
      color: #15803D;
    }}
    .badge-tier {{
      background: #E0E7FF;
      color: #4338CA;
    }}
    .clinical-narrative {{
      background: #F8FAFC;
      border: 1px solid #C7D2FE;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 9pt;
      line-height: 1.45;
      margin-bottom: 20px;
    }}
    .narrative-item {{
      margin-bottom: 10px;
    }}
    .narrative-item strong {{
      color: #312E81;
      display: block;
      margin-bottom: 2px;
    }}
    .narrative-item p {{
      margin: 0;
      color: #1E293B;
      text-align: justify;
    }}
    .sig-row {{
      display: flex;
      justify-content: space-between;
      gap: 20px;
      margin-top: 20px;
      font-size: 8.5pt;
    }}
    .sig-box {{
      flex: 1;
      border: 1px solid #CBD5E1;
      background: #F8FAFC;
      border-radius: 6px;
      padding: 12px;
    }}
    .sig-line {{
      margin-top: 30px;
      border-bottom: 1px solid #475569;
    }}
    .print-controls {{
      text-align: center;
      margin-bottom: 16px;
    }}
    .btn-print {{
      background: #4338CA;
      color: #FFFFFF;
      border: none;
      padding: 10px 24px;
      font-size: 11pt;
      font-weight: 700;
      border-radius: 8px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(67, 56, 202, 0.3);
    }}
    @media print {{
      body {{
        background: #FFFFFF;
        padding: 0;
      }}
      .iep-container {{
        box-shadow: none;
        padding: 0;
        max-width: 100%;
      }}
      .print-controls {{
        display: none;
      }}
    }}
  </style>
</head>
<body>
  <div class="print-controls">
    <button class="btn-print" onclick="window.print()">🖨️ Print or Save as PDF</button>
  </div>

  <div class="iep-container">
    <div class="iep-header">
      <h1 class="iep-title">PRERANA ASSISTIVE LEARNING PLATFORM</h1>
      <div class="iep-sub">COMPREHENSIVE SPECIAL EDUCATION IEP PROGRESS &amp; OUTCOMES EVALUATION</div>
      <div class="iep-conf">Confidential Institutional Special Education Assessment Record (English)</div>
    </div>

    <div class="meta-grid">
      <div class="meta-item"><span class="meta-label">Center / Institution:</span> <strong>{center_name}</strong></div>
      <div class="meta-item"><span class="meta-label">Evaluation Date:</span> {eval_date}</div>
      <div class="meta-item"><span class="meta-label">Evaluating Educator:</span> {evaluator_name}</div>
      <div class="meta-item"><span class="meta-label">Enrolled Cohort:</span> {cohort_size} Active Students</div>
      <div class="meta-item"><span class="meta-label">Support Tiers:</span> {tier_str}</div>
      <div class="meta-item"><span class="meta-label">Accreditation:</span> UN SDG 4.5 &amp; PO6 Assistive Special Education</div>
    </div>

    <div class="kpi-row">
      <div class="kpi-card">
        <div class="kpi-num">{cohort_size}</div>
        <div class="kpi-label">Enrolled Learners</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-num">{metrics.get("total_tasks", 0)}</div>
        <div class="kpi-label">Tasks Completed</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-num">{metrics.get("average_accuracy", 100)}%</div>
        <div class="kpi-label">Mean Accuracy</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-num">{metrics.get("average_latency", 2.0):.1f}s</div>
        <div class="kpi-label">Mean Latency</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-num">⭐ {metrics.get("total_stars", 0)}</div>
        <div class="kpi-label">Stars Awarded</div>
      </div>
    </div>

    <div class="sec-heading">Individualized Student Progress &amp; IEP Milestone Matrix</div>
    <table class="data-table">
      <thead>
        <tr>
          <th>Learner Name &amp; ID</th>
          <th>Username</th>
          <th>Tier</th>
          <th>Badge</th>
          <th>Tasks</th>
          <th>Accuracy</th>
          <th>Latency</th>
          <th>Mastery Status</th>
        </tr>
      </thead>
      <tbody>
        {students_html}
      </tbody>
    </table>

    <div class="sec-heading">Curricular Assistive Domain Competency &amp; Accuracy Overview</div>
    <table class="data-table">
      <thead>
        <tr>
          <th>Learning Domain</th>
          <th>Pedagogical Category</th>
          <th>Active Learners</th>
          <th>Trials Completed</th>
          <th>Mean Accuracy</th>
        </tr>
      </thead>
      <tbody>
        {domains_html}
      </tbody>
    </table>

    <div class="sec-heading">Formal Clinical Narrative &amp; Institutional Pedagogical Evaluation</div>
    <div class="clinical-narrative">
      <div class="narrative-item">
        <strong>1. Baseline Cognitive Support Tier &amp; Multimodal Scaffolding</strong>
        <p>{narrative.get('cohort_tier_analysis')}</p>
      </div>
      <div class="narrative-item">
        <strong>2. Cohort Task Completion Latency, Attention &amp; Sensory Engagement</strong>
        <p>{narrative.get('latency_engagement_analysis')}</p>
      </div>
      <div class="narrative-item">
        <strong>3. Curricular Domain Competency Progression &amp; Literacy/Numeracy Gains</strong>
        <p>{narrative.get('domain_gains_analysis')}</p>
      </div>
      <div class="narrative-item">
        <strong>4. Institutional Pedagogical Interventions &amp; Adaptive Accommodations</strong>
        <p>{narrative.get('recommended_interventions')}</p>
      </div>
    </div>

    <div class="sig-row">
      <div class="sig-box">
        <strong>Evaluated by Special Educator:</strong>
        <div class="sig-line"></div>
        <div style="margin-top: 6px;">Licensed Special Education Specialist / Case Manager</div>
        <div style="color: #64748B;">Date: {eval_date}</div>
      </div>
      <div class="sig-box">
        <strong>Institutional Approval &amp; Accreditation:</strong>
        <div class="sig-line"></div>
        <div style="margin-top: 6px;">Director of Special Pedagogy &amp; Clinical Oversight</div>
        <div style="color: #64748B;">{center_name}</div>
      </div>
    </div>
  </div>
</body>
</html>
"""
    return html
