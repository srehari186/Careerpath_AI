"""Generate an attractive, professionally styled DOCX from SRS.md.
Run: python scripts/generate_srs_docx.py
Output: SRS_CareerPath_AI_v1.0.docx (project root). SRS.md stays the source of truth.
"""
import re
from pathlib import Path
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.section import WD_SECTION
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

BASE = Path(__file__).resolve().parent.parent
SRC = BASE / "SRS.md"
OUT = BASE / "SRS_CareerPath_AI_v1.0.docx"

INDIGO = RGBColor(0x4F, 0x46, 0xE5)
DARK = RGBColor(0x1E, 0x1B, 0x4B)
SLATE = RGBColor(0x47, 0x55, 0x69)
FUCHSIA = RGBColor(0xD9, 0x46, 0xEF)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
HDR_FILL = "4F46E5"
BAND_FILL = "EEF2FF"
CALLOUT_FILL = "EEF2FF"
CODE_FILL = "F1F5F9"


def set_font(run, name="Calibri", size=None, color=None, bold=None, italic=None):
    run.font.name = name
    r = run._element
    rPr = r.get_or_add_rPr()
    for tag in ("w:rFonts",):
        el = rPr.find(qn(tag))
        if el is None:
            el = OxmlElement(tag)
            rPr.append(el)
        el.set(qn("w:ascii"), name)
        el.set(qn("w:hAnsi"), name)
    if size is not None:
        run.font.size = Pt(size)
    if color is not None:
        run.font.color.rgb = color
    if bold is not None:
        run.font.bold = bold
    if italic is not None:
        run.font.italic = italic


def shade_cell(cell, fill):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:fill"), fill)
    tcPr.append(shd)


def add_rich_text(par, text, base_size=10.5, base_color=None, base_bold=False):
    """Render **bold** inline markers."""
    parts = re.split(r"(\*\*.+?\*\*)", text)
    for part in parts:
        if not part:
            continue
        if part.startswith("**") and part.endswith("**") and len(part) > 4:
            r = par.add_run(part[2:-2])
            set_font(r, size=base_size, color=base_color, bold=True)
        else:
            # strip stray single asterisks used as bullets already handled outside
            clean = part.replace("`", "")
            r = par.add_run(clean)
            set_font(r, size=base_size, color=base_color, bold=base_bold)
    return par


def style_table(table, col_widths=None):
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = True
    # header row
    for cell in table.rows[0].cells:
        shade_cell(cell, HDR_FILL)
        for p in cell.paragraphs:
            for r in p.runs:
                set_font(r, size=10, color=WHITE, bold=True)
    # banded body rows
    for i, row in enumerate(table.rows[1:], start=1):
        if i % 2 == 0:
            for cell in row.cells:
                shade_cell(cell, BAND_FILL)
        for cell in row.cells:
            for p in cell.paragraphs:
                for r in p.runs:
                    if r.font.size is None:
                        set_font(r, size=10)
    # borders
    tbl = table._tbl
    tblPr = tbl.tblPr
    borders = OxmlElement("w:tblBorders")
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        el = OxmlElement(f"w:{edge}")
        el.set(qn("w:val"), "single")
        el.set(qn("w:sz"), "4")
        el.set(qn("w:color"), "C7D2FE")
        borders.append(el)
    tblPr.append(borders)
    if col_widths:
        for row in table.rows:
            for idx, w in enumerate(col_widths):
                if idx < len(row.cells):
                    row.cells[idx].width = Cm(w)


def add_callout(doc, lines):
    t = doc.add_table(rows=1, cols=1)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = t.cell(0, 0)
    shade_cell(cell, CALLOUT_FILL)
    # left accent border via cell shading + first paragraph bar char
    for ln in lines:
        p = cell.add_paragraph() if cell.paragraphs[0].text else cell.paragraphs[0]
        add_rich_text(p, "▌ " + ln.strip("> ").strip(), base_size=10, base_color=DARK)
    # table borders subtle
    tbl = t._tbl
    tblPr = tbl.tblPr
    borders = OxmlElement("w:tblBorders")
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        el = OxmlElement(f"w:{edge}")
        el.set(qn("w:val"), "single")
        el.set(qn("w:sz"), "6" if edge == "left" else "2")
        el.set(qn("w:color"), "4F46E5" if edge == "left" else "C7D2FE")
        borders.append(el)
    tblPr.append(borders)
    doc.add_paragraph().paragraph_format.space_after = Pt(2)


def add_page_number(par):
    r = par.add_run()
    for tag, val in (("w:fldChar", "begin"),):
        el = OxmlElement(tag); el.set(qn(tag), val); r._element.append(el)
    r2 = par.add_run()
    el = OxmlElement("w:instrText"); el.set(qn("xml:space"), "preserve"); el.text = "PAGE"
    r2._element.append(el)
    r3 = par.add_run()
    el = OxmlElement("w:fldChar"); el.set(qn("w:fldChar"), "end"); r3._element.append(el)
    for run in (r, r2, r3):
        set_font(run, size=9, color=SLATE)


def build():
    lines = SRC.read_text(encoding="utf-8").splitlines()
    doc = Document()

    # ---- page setup: A4, 2cm margins ----
    for section in doc.sections:
        section.page_width = Cm(21.0)
        section.page_height = Cm(29.7)
        section.left_margin = section.right_margin = Cm(2.0)
        section.top_margin = section.bottom_margin = Cm(2.0)

    # ---- base styles ----
    normal = doc.styles["Normal"]
    normal.font.name = "Calibri"
    normal.font.size = Pt(10.5)
    normal.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
    for hname, size, color in [("Heading 1", 17, INDIGO), ("Heading 2", 13.5, DARK), ("Heading 3", 11.5, INDIGO)]:
        st = doc.styles[hname]
        st.font.name = "Calibri"
        st.font.size = Pt(size)
        st.font.bold = True
        st.font.color.rgb = color
        st.paragraph_format.space_before = Pt(14 if "1" in hname else 10)
        st.paragraph_format.space_after = Pt(4)
        st.paragraph_format.keep_with_next = True

    # ---- header / footer ----
    header = doc.sections[0].header
    hp = header.paragraphs[0]
    hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r = hp.add_run("CareerPath AI  ·  SRS v1.0")
    set_font(r, size=8.5, color=SLATE, italic=True)
    footer = doc.sections[0].footer
    fp = footer.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = fp.add_run("CareerPath AI — Software Requirements Specification  ·  Page ")
    set_font(r, size=9, color=SLATE)
    add_page_number(fp)

    # ================= COVER PAGE =================
    for _ in range(3):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(2)
    badge = doc.add_paragraph()
    badge.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = badge.add_run("  EMP-04  ·  HACKATHON PROJECT  ")
    set_font(r, size=10, color=WHITE, bold=True)
    shading = OxmlElement("w:shd")
    shading.set(qn("w:val"), "clear"); shading.set(qn("w:fill"), "4F46E5")
    badge.paragraph_format.space_after = Pt(10)

    t1 = doc.add_paragraph(); t1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = t1.add_run("CareerPath AI")
    set_font(r, size=40, color=INDIGO, bold=True)
    t2 = doc.add_paragraph(); t2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = t2.add_run("Career Pathway Knowledge Explorer")
    set_font(r, size=18, color=DARK)
    t3 = doc.add_paragraph(); t3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = t3.add_run("Software Requirements Specification")
    set_font(r, size=14, color=SLATE, italic=True)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)
    meta = doc.add_table(rows=1, cols=2)
    meta_data = [("Version", "1.0.0 — Baseline"), ("Date", "15 September 2026"),
                 ("Standard", "IEEE 830-style"), ("Status", "Approved for prototype build"),
                 ("Authors", "Hackathon Team (EMP-04)"), ("Source of truth", "SRS.md in repo root")]
    hdr = meta.rows[0].cells
    hdr[0].text, hdr[1].text = "Field", "Detail"
    for k, v in meta_data:
        row = meta.add_row().cells
        row[0].text, row[1].text = k, v
        for c in row:
            for p in c.paragraphs:
                for run in p.runs:
                    set_font(run, size=10)
    style_table(meta, col_widths=[5.5, 10.5])

    doc.add_paragraph().paragraph_format.space_after = Pt(4)
    vh = doc.add_paragraph()
    r = vh.add_run("Version history")
    set_font(r, size=12, color=DARK, bold=True)
    vt = doc.add_table(rows=1, cols=3)
    vt.rows[0].cells[0].text, vt.rows[0].cells[1].text, vt.rows[0].cells[2].text = "Version", "Date", "Change"
    for v, d, c in [("1.0", "2026-09-15", "Initial baseline — mirrors working prototype + measured metrics")]:
        row = vt.add_row().cells
        row[0].text, row[1].text, row[2].text = v, d, c
        for cc in row:
            for p in cc.paragraphs:
                for run in p.runs:
                    set_font(run, size=10)
    style_table(vt)

    doc.add_page_break()

    # ---- collect H1 sections for a printed Contents ----
    h1s = []
    for ln in lines:
        m = re.match(r"^##\s+(.+)", ln)
        if m:
            h1s.append(m.group(1).strip())
    ch = doc.add_heading("Contents", level=1)
    for h in h1s:
        if h.startswith("CareerPath AI"):
            continue  # subtitle line, not a section
        p = doc.add_paragraph(style="List Bullet")
        p.clear()
        add_rich_text(p, h, base_size=10.5)
    doc.add_page_break()

    # ================= BODY =================
    i = 0
    h1_num = 0
    list_num = 0
    in_code = False
    code_buf = []
    callout_buf = []
    table_buf = []

    def flush_table():
        if not table_buf:
            return
        rows = [[c.strip() for c in re.split(r"(?<!\\)\|", r.strip().strip("|"))] for r in table_buf]
        # drop separator row
        rows = [r for r in rows if not all(re.match(r"^:?-{2,}:?$", c) for c in r)]
        if rows:
            t = doc.add_table(rows=len(rows), cols=len(rows[0]))
            for ri, row in enumerate(rows):
                for ci in range(len(rows[0])):
                    cell = t.cell(ri, ci)
                    cell.text = ""
                    p = cell.paragraphs[0]
                    add_rich_text(p, row[ci] if ci < len(row) else "", base_size=9.5,
                                  base_color=WHITE if ri == 0 else None, base_bold=(ri == 0))
            # widen ID column when present
            if rows[0] and re.search(r"requirement|endpoint|term|field|class|version", rows[0][0], re.I):
                style_table(t)
            else:
                style_table(t)
        table_buf.clear()

    def flush_code():
        if not code_buf:
            return
        for cl in code_buf:
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            pf = p.paragraph_format
            r = p.add_run(cl if cl else " ")
            set_font(r, name="Consolas", size=9, color=DARK)
            # light shading on paragraph
            pPr = p._p.get_or_add_pPr()
            shd = OxmlElement("w:shd")
            shd.set(qn("w:val"), "clear"); shd.set(qn("w:fill"), CODE_FILL)
            pPr.append(shd)
        doc.add_paragraph().paragraph_format.space_after = Pt(2)
        code_buf.clear()

    def flush_callout():
        if not callout_buf:
            return
        add_callout(doc, callout_buf)
        callout_buf.clear()

    while i < len(lines):
        ln = lines[i]
        # code fences
        if ln.strip().startswith("```"):
            if in_code:
                in_code = False
                flush_code()
            else:
                flush_table(); flush_callout()
                in_code = True
            i += 1
            continue
        if in_code:
            code_buf.append(ln)
            i += 1
            continue
        # tables
        if ln.strip().startswith("|"):
            flush_callout()
            table_buf.append(ln)
            i += 1
            continue
        else:
            flush_table()
        # callouts
        if ln.strip().startswith(">"):
            callout_buf.append(ln)
            i += 1
            continue
        else:
            flush_callout()
        # headings
        m1 = re.match(r"^#\s+(.+)", ln)
        m2 = re.match(r"^##\s+(.+)", ln)
        m3 = re.match(r"^###\s+(.+)", ln)
        m4 = re.match(r"^####\s+(.+)", ln)
        if m1:
            # doc title already sits on the cover — skip it entirely
            i += 1
            continue
        if m2:
            title = m2.group(1).strip()
            if title.startswith("CareerPath AI"):
                i += 1
                continue  # subtitle line already on cover
            h1_num += 1
            doc.add_heading(title, level=1)  # titles carry their own numbers
            i += 1
            continue
        if m3:
            doc.add_heading(m3.group(1).strip(), level=2)
            i += 1
            continue
        if m4:
            doc.add_heading(m4.group(1).strip(), level=3)
            i += 1
            continue
        if re.match(r"^---+\s*$", ln):
            p = doc.add_paragraph()
            pPr = p._p.get_or_add_pPr()
            pbdr = OxmlElement("w:pBdr")
            b = OxmlElement("w:bottom")
            b.set(qn("w:val"), "single"); b.set(qn("w:sz"), "6"); b.set(qn("w:color"), "C7D2FE")
            pbdr.append(b); pPr.append(pbdr)
            i += 1
            continue
        # bullets
        mb = re.match(r"^(\s*)[-*]\s+(.+)", ln)
        mn = re.match(r"^(\s*)\d+[.)]\s+(.+)", ln)
        if mb:
            p = doc.add_paragraph(style="List Bullet")
            p.clear()
            add_rich_text(p, mb.group(2), base_size=10.5)
            i += 1
            continue
        if mn:
            p = doc.add_paragraph(style="List Number")
            p.clear()
            add_rich_text(p, mn.group(2), base_size=10.5)
            i += 1
            continue
        if not ln.strip():
            i += 1
            continue
        p = doc.add_paragraph()
        add_rich_text(p, ln.strip(), base_size=10.5)
        i += 1

    flush_table(); flush_code(); flush_callout()

    # ---- core properties ----
    core = doc.core_properties
    core.title = "CareerPath AI — Software Requirements Specification v1.0"
    core.subject = "EMP-04 Career Pathway Knowledge Explorer"
    core.keywords = "SRS, career, RAG, ML, FastAPI, React"
    core.comments = "Generated from SRS.md — source of truth"

    doc.save(OUT)
    print(f"Saved -> {OUT} ({OUT.stat().st_size/1024:.1f} KB)")


if __name__ == "__main__":
    build()
