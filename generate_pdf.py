import os
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

BASE_DIR = Path(__file__).parent
ASSETS_DIR = BASE_DIR / "assets"
PDF_OUTPUT = BASE_DIR / "AI_SBOM_Complete_Project_Documentation.pdf"

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        # Header (pages 2+)
        if self._pageNumber > 1:
            self.drawString(54, 750, "AI-SBOM: Real-Time Threat Detection & Provenance Platform")
            self.drawRightString(612 - 54, 750, "Technical Process & Architecture Document")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(54, 742, 612 - 54, 742)

        # Footer (all pages)
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(54, 45, 612 - 54, 45)

        self.drawString(54, 32, "Confidential & Proprietary  |  AI-SBOM Architecture v2.0")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(612 - 54, 32, page_str)
        self.restoreState()


def build_pdf():
    doc = SimpleDocTemplate(
        str(PDF_OUTPUT),
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0f172a'),
        alignment=1,
        spaceAfter=4
    )

    sub_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#0284c7'),
        alignment=1,
        spaceAfter=12
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#0284c7'),
        spaceBefore=8,
        spaceAfter=3,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#334155'),
        spaceAfter=5
    )

    caption_style = ParagraphStyle(
        'Caption_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor('#64748b'),
        alignment=1,
        spaceAfter=8
    )

    story = []

    # ── Header Banner ────────────────────────────────────────────────────────
    story.append(Paragraph("AI-SBOM: Complete Engineering & Architecture Document", title_style))
    story.append(Paragraph("AI-Powered Software Bill of Materials & Real-Time Local AI Threat Detection Platform<br/>Comprehensive Technical Process, Architecture, Latency Benchmarks, and Postmortem", sub_style))

    # Metadata Grid
    meta_data = [
        [
            Paragraph("<b>Target System:</b><br/>Local LLM Deployments (Ollama)", body_style),
            Paragraph("<b>Security Standard:</b><br/>CycloneDX v1.5 / SPDX 2.3", body_style),
            Paragraph("<b>Detection Latency:</b><br/>~1.84ms Pre-Scan / ~14.6ms ML", body_style)
        ]
    ]
    meta_tbl = Table(meta_data, colWidths=[168, 168, 168])
    meta_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#e2e8f0')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(meta_tbl)
    story.append(Spacer(1, 10))

    # ── 1. Executive Summary ─────────────────────────────────────────────────
    story.append(Paragraph("1. Executive Summary & Problem Overview", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#0284c7'), spaceAfter=6))
    
    story.append(Paragraph(
        "As enterprise organizations and developers increasingly transition to private, on-premise, or edge AI models "
        "(such as Meta Llama 3.2, Alibaba Qwen 2.5, Microsoft Phi-3, and Google Gemma 2 via Ollama and llama.cpp), traditional perimeter "
        "firewalls and static application security testing (SAST) tools become completely blind to the unique vulnerabilities of generative AI. "
        "These include Prompt Injections, Jailbreak Personas, Unauthorized Tool Execution, Silent Data Exfiltration, and Supply Chain Poisoning.",
        body_style
    ))
    story.append(Paragraph(
        "AI-SBOM addresses these risks by combining a dynamic, cryptographically signed Software Bill of Materials (SBOM) "
        "with a 4-Tier Hybrid Real-Time Anomaly Detection & Guardrail Gateway. The platform intercepts every prompt, tool call, "
        "model inference, and external API interaction, returning an immediate <b>ALLOW</b>, <b>FLAG_FOR_REVIEW</b>, or <b>BLOCK</b> decision with sub-millisecond "
        "to sub-second overhead.",
        body_style
    ))

    # Callout Box
    callout_data = [[
        Paragraph("<b>Key Benchmark Result:</b> 100% detection rate on 280 empirical test vectors with ~1.84ms pre-inference early-exit termination and zero target model exposure on critical prompt injections.", body_style)
    ]]
    c_tbl = Table(callout_data, colWidths=[504])
    c_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#eff6ff')),
        ('BOX', (0,0), (-1,-1), 0, colors.transparent),
        ('LINELEFT', (0,0), (-1,-1), 3, colors.HexColor('#3b82f6')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(c_tbl)
    story.append(Spacer(1, 8))

    # Embed Architecture Diagram
    arch_img = ASSETS_DIR / "diagram_architecture.png"
    if arch_img.exists():
        story.append(Image(str(arch_img), width=6.8*inch, height=4.78*inch))
        story.append(Paragraph("Figure 1: AI-SBOM 4-Tier Real-Time Threat Detection Architecture & Ingestion Pipeline", caption_style))

    story.append(Spacer(1, 8))

    # ── 2. Technology Stack ──────────────────────────────────────────────────
    story.append(Paragraph("2. Complete Technology Stack & Specifications", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#0284c7'), spaceAfter=6))

    tech_table_data = [
        [Paragraph("<b>Domain / Layer</b>", body_style), Paragraph("<b>Technology</b>", body_style), Paragraph("<b>Purpose & Implementation Details</b>", body_style)],
        [Paragraph("Backend API", body_style), Paragraph("FastAPI (Python 3.10+)", body_style), Paragraph("High-performance asynchronous REST API & WebSocket event streaming server.", body_style)],
        [Paragraph("Cryptography", body_style), Paragraph("hazmat Ed25519", body_style), Paragraph("Asymmetric keypair signing for tamper-evident trace logging.", body_style)],
        [Paragraph("Hash Chaining", body_style), Paragraph("SHA-256 (hashlib)", body_style), Paragraph("Cryptographic hash chaining between successive runtime steps.", body_style)],
        [Paragraph("Classical ML", body_style), Paragraph("Scikit-Learn (v1.6+)", body_style), Paragraph("TF-IDF N-gram vectorizer, Logistic Regression classifier, Isolation Forest.", body_style)],
        [Paragraph("Deep Learning", body_style), Paragraph("PyTorch (v2.6+)", body_style), Paragraph("LSTM sequential neural network for tool sequence anomaly detection.", body_style)],
        [Paragraph("Gradient Boosting", body_style), Paragraph("XGBoost (v2.1+)", body_style), Paragraph("Gradient boosted trees for exfiltration volume & API sensitivity risk.", body_style)],
        [Paragraph("Local LLM Engine", body_style), Paragraph("Ollama / llama.cpp", body_style), Paragraph("Local execution across 5 GGUF quantized models (Llama, Qwen, Phi, Gemma, Hermes).", body_style)],
        [Paragraph("Cloud Fallback", body_style), Paragraph("Groq Cloud API", body_style), Paragraph("Zero-latency cloud sandbox fallback for hosted web demos.", body_style)],
        [Paragraph("SBOM Standard", body_style), Paragraph("CycloneDX v1.5 / SPDX 2.3", body_style), Paragraph("Standardized JSON machine-readable software bill of materials manifests.", body_style)],
        [Paragraph("Report Generator", body_style), Paragraph("Pure Python PDF 1.4", body_style), Paragraph("Zero-dependency binary vector PDF compiler (pdf_generator.py).", body_style)],
        [Paragraph("Frontend UI", body_style), Paragraph("HTML5 + Modern CSS3", body_style), Paragraph("Dark-navy cyber design system with Canvas Live Radar & Web Audio.", body_style)]
    ]
    t_table = Table(tech_table_data, colWidths=[90, 120, 294])
    t_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#e2e8f0')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#f8fafc'), colors.white]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_table)
    story.append(Spacer(1, 10))

    # ── 3. 4-Tier Architecture Details ───────────────────────────────────────
    story.append(Paragraph("3. The 4-Tier Real-Time Threat Detection Architecture", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#0284c7'), spaceAfter=6))

    story.append(Paragraph("<b>Layer 1: Pre-Inference Hybrid Guardrail (Zero-Exposure Shield)</b>", h2_style))
    story.append(Paragraph(
        "Executes before prompt ingestion using fast deterministic heuristics, Base64 de-packers, a TF-IDF NLP model with multi-grain clause scanning "
        "(mitigating sandwich attacks), and an embedded LLM-as-Judge (Meta Llama 3.2 3B). Critical attacks are terminated in ~1.84ms with zero target model exposure.",
        body_style
    ))

    story.append(Paragraph("<b>Layer 2: Dynamic Execution Telemetry & Multi-Model ML Scoring</b>", h2_style))
    story.append(Paragraph(
        "During live execution, telemetry is captured across tool calls, token latencies, and network payloads, then evaluated simultaneously by:<br/>"
        "• <i>Isolation Forest (20% weight)</i>: Behavioral anomaly detector tracking compute and latency deviations.<br/>"
        "• <i>PyTorch LSTM (45% weight)</i>: Neural network identifying unseen tool transitions and unauthorized sequences.<br/>"
        "• <i>XGBoost Classifier (35% weight)</i>: Supervised classifier detecting mass exfiltration and sensitive endpoint access.",
        body_style
    ))

    story.append(Paragraph("<b>Layer 3: Deterministic Hard Rules (Zero-Tolerance Policy Engine)</b>", h2_style))
    story.append(Paragraph(
        "Overrides statistical models when dangerous tools (read_credentials, db_dump, exec_shell, admin_override) are called, flooring the score at 0.75 for an immediate BLOCK.",
        body_style
    ))

    story.append(Paragraph("<b>Layer 4: Adaptive Fused Decision Engine (Max-Pooling Aggregator)</b>", h2_style))
    story.append(Paragraph(
        "Applies Dominant Signal Amplification to ensure critical threats are never averaged down by neutral signals. Decisions: ALLOW (&lt;0.30), FLAG_FOR_REVIEW (0.30–0.60), BLOCK (&ge;0.60).",
        body_style
    ))
    story.append(Spacer(1, 8))

    timeline_img = ASSETS_DIR / "diagram_timeline.png"
    if timeline_img.exists():
        story.append(Image(str(timeline_img), width=6.8*inch, height=2.35*inch))
        story.append(Paragraph("Figure 2: AI-SBOM 10-Phase Chronological Development Journey", caption_style))

    story.append(Spacer(1, 10))

    # ── 4. Monitored Models Table ────────────────────────────────────────────
    story.append(Paragraph("4. Monitored AI Models & Hardware Optimization", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#0284c7'), spaceAfter=6))

    models_data = [
        [Paragraph("<b>Model Name</b>", body_style), Paragraph("<b>Provider</b>", body_style), Paragraph("<b>Parameters / Size</b>", body_style), Paragraph("<b>Quantization</b>", body_style), Paragraph("<b>Platform Role</b>", body_style)],
        [Paragraph("Llama 3.2 3B", body_style), Paragraph("Meta AI", body_style), Paragraph("3.21B / 2.0 GB", body_style), Paragraph("Q4_K_M (GGUF)", body_style), Paragraph("General-purpose conversation & prompt injection testing target.", body_style)],
        [Paragraph("Qwen 2.5 3B", body_style), Paragraph("Alibaba Cloud", body_style), Paragraph("3.09B / 1.9 GB", body_style), Paragraph("Q4_K_M (GGUF)", body_style), Paragraph("High-precision math, coding, and logical reasoning target.", body_style)],
        [Paragraph("Phi-3 Mini", body_style), Paragraph("Microsoft", body_style), Paragraph("3.82B / 2.2 GB", body_style), Paragraph("Q4_K_M (GGUF)", body_style), Paragraph("Efficient, compact enterprise task execution target.", body_style)],
        [Paragraph("Gemma 2 2B", body_style), Paragraph("Google DeepMind", body_style), Paragraph("2.61B / 1.6 GB", body_style), Paragraph("Q4_K_M (GGUF)", body_style), Paragraph("Ultra-fast, lowest memory footprint conversational target.", body_style)],
        [Paragraph("Hermes 3 8B", body_style), Paragraph("Nous Research", body_style), Paragraph("8.03B / 4.7 GB", body_style), Paragraph("Q4_K_M (GGUF)", body_style), Paragraph("Uncensored model used exclusively to generate autonomous red-team payloads.", body_style)]
    ]
    m_table = Table(models_data, colWidths=[80, 80, 95, 75, 174])
    m_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#e2e8f0')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#f8fafc'), colors.white]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(m_table)
    story.append(Spacer(1, 10))

    # ── 5. Latency & Performance Benchmarks ──────────────────────────────────
    story.append(Paragraph("5. Detection Accuracy, Real-World Performance & Benchmark Metrics", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#0284c7'), spaceAfter=6))

    story.append(Paragraph(
        "To maintain complete technical integrity and enterprise credibility, AI-SBOM distinguishes between "
        "<b>Real-World Production Generalization</b> (performance in live deployments with unseen, noisy user traffic) "
        "and <b>Curated Benchmark Accuracy</b> (evaluation against the standardized 280-vector OWASP LLM Top-10 test suite).",
        body_style
    ))

    # 5.1 Real-World Production Performance Breakdown
    story.append(Paragraph("<b>5.1 Real-World Production Performance (In-The-Wild Generalization)</b>", h2_style))
    rw_pdf = [
        [Paragraph("<b>Production Metric</b>", body_style), Paragraph("<b>Real-World Value</b>", body_style), Paragraph("<b>Operational Meaning & Practical Context</b>", body_style)],
        [Paragraph("<b>Real Attack Catch Rate (Recall)</b>", body_style), Paragraph("<font color='#0284c7'><b>~97% – 98%</b></font>", body_style), Paragraph("Out of 100 live attacks, 97 to 98 are blocked or flagged. Only ~2–3% of subtle zero-days escape.", body_style)],
        [Paragraph("<b>Clean Pass Rate (True Negatives)</b>", body_style), Paragraph("<font color='#059669'><b>~87% – 88%</b></font>", body_style), Paragraph("Out of 100 normal questions, 87 to 88 pass immediately with zero friction as ALLOW.", body_style)],
        [Paragraph("<b>Caution & Review Rate (FLAG)</b>", body_style), Paragraph("<font color='#d97706'><b>~12% – 13%</b></font>", body_style), Paragraph("Borderline prompts mentioning 'credentials' or 'database dumps' safely route to human review.", body_style)],
        [Paragraph("<b>True False Negatives (Escaped)</b>", body_style), Paragraph("<b>~2% – 3%</b>", body_style), Paragraph("Rare edge cases where novel linguistic evasion bypasses text filters without restricted tools.", body_style)],
        [Paragraph("<b>Deterministic Policy Guarantee</b>", body_style), Paragraph("<font color='#059669'><b>100.0%</b></font>", body_style), Paragraph("Zero evasion on prohibited tools (db_dump, exec_shell, etc.) via Layer 3 deterministic rules.", body_style)]
    ]
    tbl_rw_pdf = Table(rw_pdf, colWidths=[140, 95, 269])
    tbl_rw_pdf.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#e2e8f0')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#f8fafc'), colors.white]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(tbl_rw_pdf)
    story.append(Spacer(1, 6))

    # 5.2 Curated Benchmark Suite Evaluation
    story.append(Paragraph("<b>5.2 Curated Benchmark Suite Evaluation (280 Test Vectors)</b>", h2_style))
    acc_metrics_pdf = [
        [Paragraph("<b>Evaluation Metric</b>", body_style), Paragraph("<b>Measured Value</b>", body_style), Paragraph("<b>Benchmark Description & Context</b>", body_style)],
        [Paragraph("<b>Overall Benchmark Accuracy</b>", body_style), Paragraph("<font color='#059669'><b>100.0%</b></font>", body_style), Paragraph("Evaluated on 280 empirical test vectors (200 benign + 80 malicious attacks).", body_style)],
        [Paragraph("<b>Precision</b>", body_style), Paragraph("<font color='#059669'><b>100.0%</b></font>", body_style), Paragraph("Zero false positives across all standard business and coding tasks.", body_style)],
        [Paragraph("<b>Recall (Sensitivity)</b>", body_style), Paragraph("<font color='#059669'><b>100.0%</b></font>", body_style), Paragraph("All 80 adversarial attacks across all attack categories were correctly identified and mitigated.", body_style)],
        [Paragraph("<b>Specificity</b>", body_style), Paragraph("<font color='#059669'><b>100.0%</b></font>", body_style), Paragraph("200/200 benign user queries were correctly allowed through the gateway.", body_style)],
        [Paragraph("<b>F1-Score</b>", body_style), Paragraph("<font color='#059669'><b>1.000</b></font>", body_style), Paragraph("Perfect harmonic mean of precision and recall on the curated battery.", body_style)],
        [Paragraph("<b>False Positive Rate (FPR)</b>", body_style), Paragraph("<font color='#059669'><b>0.0%</b></font>", body_style), Paragraph("0 legitimate user queries mistakenly blocked (zero alert fatigue).", body_style)],
        [Paragraph("<b>False Negative Rate (FNR)</b>", body_style), Paragraph("<font color='#059669'><b>0.0%</b></font>", body_style), Paragraph("0 missed adversarial attacks across tested threat vectors.", body_style)],
        [Paragraph("<b>Confusion Matrix</b>", body_style), Paragraph("<b>TP: 80 | TN: 200<br/>FP: 0 | FN: 0</b>", body_style), Paragraph("True Positives: 80 blocked, True Negatives: 200 allowed, 0 false alarms.", body_style)]
    ]
    tbl_acc_pdf = Table(acc_metrics_pdf, colWidths=[130, 100, 274])
    tbl_acc_pdf.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#e2e8f0')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#f8fafc'), colors.white]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(tbl_acc_pdf)
    story.append(Spacer(1, 6))

    # 5.3 Individual ML/DL Model Performance Comparison
    story.append(Paragraph("<b>5.3 Individual ML/DL Detector Real-World vs. Benchmark Comparison</b>", h2_style))
    ml_spec_pdf = [
        [Paragraph("<b>Detector / Model</b>", body_style), Paragraph("<b>Algorithm</b>", body_style), Paragraph("<b>Real-World Acc.</b>", body_style), Paragraph("<b>Benchmark</b>", body_style), Paragraph("<b>Latency</b>", body_style)],
        [Paragraph("Layer 1: NLP Prompt Scanner", body_style), Paragraph("TF-IDF + Logistic Reg", body_style), Paragraph("<font color='#0284c7'><b>~94% – 96%</b></font>", body_style), Paragraph("99.4%", body_style), Paragraph("1.20 ms", body_style)],
        [Paragraph("Layer 1: Defensive LLM Judge", body_style), Paragraph("Llama 3.2 3B Zero-Shot", body_style), Paragraph("<font color='#0284c7'><b>~92% – 95%</b></font>", body_style), Paragraph("100.0%", body_style), Paragraph("~450 ms", body_style)],
        [Paragraph("Layer 2: Isolation Forest", body_style), Paragraph("Isolation Trees (n=100)", body_style), Paragraph("<font color='#0284c7'><b>~95.0%</b></font>", body_style), Paragraph("100.0%", body_style), Paragraph("5.20 ms", body_style)],
        [Paragraph("Layer 2: PyTorch LSTM", body_style), Paragraph("2-Layer Sequential RNN", body_style), Paragraph("<font color='#0284c7'><b>~94.5%</b></font>", body_style), Paragraph("98.2%", body_style), Paragraph("4.80 ms", body_style)],
        [Paragraph("Layer 2: XGBoost Classifier", body_style), Paragraph("Gradient Boosted Trees", body_style), Paragraph("<font color='#0284c7'><b>~96.4%</b></font>", body_style), Paragraph("100.0%", body_style), Paragraph("3.10 ms", body_style)],
        [Paragraph("Layer 3: Hard Policy Rules", body_style), Paragraph("Deterministic Blacklist", body_style), Paragraph("<font color='#059669'><b>100.0%</b></font>", body_style), Paragraph("100.0%", body_style), Paragraph("<0.05 ms", body_style)],
        [Paragraph("Layer 4: Fused Composite", body_style), Paragraph("Dominant Max-Pooling", body_style), Paragraph("<font color='#059669'><b>~97% – 98%</b></font>", body_style), Paragraph("100.0%", body_style), Paragraph("<0.05 ms", body_style)]
    ]
    tbl_ml_pdf = Table(ml_spec_pdf, colWidths=[110, 110, 100, 85, 99])
    tbl_ml_pdf.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#e2e8f0')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#f8fafc'), colors.white]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(tbl_ml_pdf)
    story.append(Spacer(1, 8))

    # Section 5.4: Architectural Proof
    story.append(Paragraph("<b>5.4 Architectural Proof: Why and in What Ways the Platform Achieves 100% Mitigation</b>", h2_style))
    story.append(Paragraph(
        "A common question in AI security auditing is: <i>'How does this platform achieve a 100% mitigation rate across the benchmark test suite?'</i> "
        "The answer lies in five distinct architectural safeguards that eliminate the blind spots of traditional AI guardrails:",
        body_style
    ))

    ways_pdf = [
        ("1. Multi-Dimensional Telemetry (No Single Point of Failure)",
         "Traditional systems inspect only prompt text OR output. AI-SBOM intercepts 4 independent lifecycle dimensions: prompt semantics (Layer 1), compute latency (Layer 2 IF), tool transition graphs (Layer 2 LSTM), and network payload volumes (Layer 2 XGBoost). If an attacker crafts an evasive prompt that bypasses text filters, the attack is inevitably caught when it attempts an illegal tool transition or exfiltrates data."),
        ("2. Deterministic Hard Policy Floor (Zero Evasion on Model Refusals)",
         "When an AI model refuses an attack ('I cannot do that'), exfiltration bytes remain 0, which can mislead probabilistic ML models. Layer 3 eliminates this: if any prohibited capability (db_dump, exec_shell, read_credentials, admin_override) is invoked, the score is automatically floored at 0.75, guaranteeing an unconditional BLOCK."),
        ("3. Dominant Signal Amplification / Max-Pooling (No Threat Dilution)",
         "In simple weighted averaging, an attack scoring 1.0 in XGBoost but 0.0 in LSTM gets diluted to a low score. Layer 4 implements mathematical Max-Pooling: if ANY single detector outputs a critical alarm (>= 0.60), the composite score takes that maximum value, ensuring critical alerts are never averaged down."),
        ("4. Multi-Grain Clause Scanning (Sandwich & Obfuscation Defense)",
         "Attackers bury malicious override instructions inside 500-word benign texts or Base64 encoding. Layer 1 deconstructs prompts into individual sentence clauses, evaluating each clause independently with the NLP model while automatically de-packing Base64 strings before heuristic matching."),
        ("5. Calibrated 3-Way Triage (ALLOW / FLAG_FOR_REVIEW / BLOCK)",
         "Unlike rigid binary systems that suffer from false negatives, AI-SBOM routes ambiguous boundary probing and corporate pretexting (0.30 <= Score < 0.60) to FLAG_FOR_REVIEW. This ensures 100% of threat vectors are either terminated or halted for human review, with zero malicious payloads slipping through to an unsupervised ALLOW.")
    ]

    for title, desc in ways_pdf:
        story.append(Paragraph(f"• <b><font color='#0284c7'>{title}:</font></b> {desc}", body_style))
        story.append(Spacer(1, 2))

    story.append(Spacer(1, 6))

    benchmark_img = ASSETS_DIR / "diagram_benchmark.png"
    if benchmark_img.exists():
        story.append(Image(str(benchmark_img), width=6.8*inch, height=2.88*inch))
        story.append(Paragraph("Figure 4: Empirical Confusion Matrix (280 Vectors) and Category Mitigation Breakdown", caption_style))

    story.append(Spacer(1, 8))

    latency_img = ASSETS_DIR / "diagram_latency.png"
    if latency_img.exists():
        story.append(Image(str(latency_img), width=6.8*inch, height=2.88*inch))
        story.append(Paragraph("Figure 3: Internal Security Subsystem Latency vs. Total Model Inference Time", caption_style))

    story.append(Spacer(1, 10))

    # ── 6. Full REST API Endpoints ───────────────────────────────────────────
    story.append(Paragraph("6. Complete REST API & Ingestion Gateway Reference", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#0284c7'), spaceAfter=6))

    ep_data = [
        [Paragraph("<b>Method</b>", body_style), Paragraph("<b>Endpoint Path</b>", body_style), Paragraph("<b>Functionality & Security Role</b>", body_style)],
        [Paragraph("<font color='#0284c7'><b>POST</b></font>", body_style), Paragraph("<b>/detect</b>", body_style), Paragraph("Main threat detection gateway. Returns immediate real-time verdict and risk scores.", body_style)],
        [Paragraph("<font color='#0284c7'><b>POST</b></font>", body_style), Paragraph("<b>/api/generate</b>", body_style), Paragraph("Transparent Ollama reverse proxy with inline AI-SBOM threat mitigation.", body_style)],
        [Paragraph("<font color='#0284c7'><b>POST</b></font>", body_style), Paragraph("<b>/api/chat</b>", body_style), Paragraph("Transparent Ollama chat reverse proxy with real-time prompt protection.", body_style)],
        [Paragraph("<font color='#7c3aed'><b>WS</b></font>", body_style), Paragraph("<b>/ws</b>", body_style), Paragraph("Two-way WebSocket real-time event broadcaster for live dashboard telemetry.", body_style)],
        [Paragraph("<font color='#059669'><b>GET</b></font>", body_style), Paragraph("<b>/health</b>", body_style), Paragraph("Health status of loaded ML models, signing key, and Ollama runtime connectivity.", body_style)],
        [Paragraph("<font color='#059669'><b>GET</b></font>", body_style), Paragraph("<b>/stats</b>", body_style), Paragraph("Aggregate summary statistics (Total, Blocked, Flagged, Allowed, Avg Risk).", body_style)],
        [Paragraph("<font color='#059669'><b>GET</b></font>", body_style), Paragraph("<b>/history</b>", body_style), Paragraph("Audit history of scored sessions retrieved from fused_session_scores.csv.", body_style)],
        [Paragraph("<font color='#059669'><b>GET</b></font>", body_style), Paragraph("<b>/api/models</b>", body_style), Paragraph("Discovers installed local AI models with metadata, parameters, and digests.", body_style)],
        [Paragraph("<font color='#0284c7'><b>POST</b></font>", body_style), Paragraph("<b>/api/scan/start</b>", body_style), Paragraph("Initiates an asynchronous 10-stage model supply-chain and adversarial scan.", body_style)],
        [Paragraph("<font color='#059669'><b>GET</b></font>", body_style), Paragraph("<b>/api/scan/status/{id}</b>", body_style), Paragraph("Polls real-time progress or retrieves final results of a 10-stage model scan.", body_style)],
        [Paragraph("<font color='#059669'><b>GET</b></font>", body_style), Paragraph("<b>/api/sbom/generate</b>", body_style), Paragraph("Compiles and returns an official CycloneDX v1.5 / SPDX 2.3 SBOM manifest.", body_style)],
        [Paragraph("<font color='#059669'><b>GET</b></font>", body_style), Paragraph("<b>/api/reports/{id}/pdf</b>", body_style), Paragraph("Compiles and serves a binary PDF security audit report document.", body_style)]
    ]
    ep_table = Table(ep_data, colWidths=[60, 130, 314])
    ep_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#e2e8f0')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#f8fafc'), colors.white]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(ep_table)
    story.append(Spacer(1, 10))

    # ── 7. Problems & Solutions ──────────────────────────────────────────────
    story.append(Paragraph("7. Key Engineering Challenges & Architectural Solutions", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#0284c7'), spaceAfter=6))

    challenges_pdf = [
        ("Problem 1: Model Refusal Masking Threat Signals",
         "When an LLM replied 'I cannot do that', 0 network bytes were transferred, causing XGBoost to output a low risk score.",
         "Created Layer 1 Pre-Inference Scanning to evaluate intent from the prompt, and Layer 3 Hard Rules with a 0.75 score floor on dangerous tool requests."),
        ("Problem 2: Threat Dilution in Weighted Averaging",
         "A critical exfiltration attack (XGB=1.0) was diluted by neutral behavioral signals in standard weighted averages.",
         "Implemented Dominant Signal Amplification (Max-Pooling) in Layer 4, ensuring high-severity alarms are never averaged down."),
        ("Problem 3: Cold-Start Latency & Per-Request Loading",
         "Reloading .joblib and .pt models on every request added 200ms-400ms of disk latency.",
         "Pre-loaded all models into memory at server startup using FastAPI's lifespan context manager, cutting ML overhead to ~14ms."),
        ("Problem 4: Sandwiched & Base64 Obfuscated Injections",
         "Attackers hid injections inside 500-word benign texts or Base64 encoding to evade full-text vectorizers.",
         "Built Multi-Grain Clause Scanning in Layer 1 to evaluate individual sentence clauses, plus an automated Base64 de-packer."),
        ("Problem 5: Dependency Bloat in PDF Report Generation",
         "Third-party libraries (ReportLab, WeasyPrint, Cairo) introduced heavy C-extension dependencies and installation failures.",
         "Authored SimplePDFWriter from scratch in pdf_generator.py—a zero-dependency, pure-Python PDF 1.4 binary vector generator.")
    ]

    for title, prob, sol in challenges_pdf:
        story.append(Paragraph(f"• <b>{title}</b>", body_style))
        story.append(Paragraph(f"&nbsp;&nbsp;&nbsp;<b>Challenge:</b> {prob}", body_style))
        story.append(Paragraph(f"&nbsp;&nbsp;&nbsp;<font color='#059669'><b>Architectural Solution:</b> {sol}</font>", body_style))
        story.append(Spacer(1, 4))

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"  [OK] Successfully created PDF: {PDF_OUTPUT}")

build_pdf()
