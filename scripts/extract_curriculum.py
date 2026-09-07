#!/usr/bin/env python3
"""
Extract and normalise the IMPACT curriculum workbook into typed JSON for the LMS.

Source: Data RAW/IMPACT curriculum resources and projects.xlsx
Output: src/data/projects.json, src/data/resources.json, src/data/people.json

The workbook is a living planning document, so this script is deliberately
conservative: it preserves the original wording in `sourceTitle`, applies only
unambiguous spelling fixes, and records every normalisation it makes so the
team can audit what the LMS changed.
"""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
WORKBOOK = ROOT / "Data RAW" / "IMPACT curriculum resources and projects.xlsx"
OUT = ROOT / "src" / "data"

# --- The six IMPACT strands ------------------------------------------------
# The handbook names the sixth strand "Technologies"; the workbook says
# "Technology". The handbook is the published definition, so it wins.
STRANDS = ["Imagination", "Movement", "Planet", "Action", "Character", "Technologies"]
STRAND_LOOKUP = {s.lower(): s for s in STRANDS}
STRAND_LOOKUP["movment"] = "Movement"  # recurring typo in the workbook
STRAND_LOOKUP["technology"] = "Technologies"  # workbook spelling

# Unambiguous spelling fixes. Original text is always kept in `sourceTitle`.
SPELLING = {
    "study a tehatre tradition": "Study a theatre tradition",
    "Desining yearbook": "Designing the yearbook",
    "Writing a pyschology column for teenagers on a local magazine or newspaper":
        "Writing a psychology column for teenagers in a local magazine or newspaper",
    "community service et Tertianum": "Community service at Tertianum",
    "Short movie , lore of school": "Short movie: the lore of the school",
    "Experimental testing and dynamic research dependent on a 2 cylinder nitro engine.":
        "Experimental testing and dynamic research on a 2-cylinder nitro engine",
    "a better, new TEDx - high school": "A better, new TEDx for high school",
    "MUN": "Model United Nations (MUN)",
    "TEDx": "TEDx",
    "AI Bot school": "AI bot for the school",
    "3D printing for noisy chairs": "3D printing for noisy chairs",
    "instrument lesson ( student teach students )":
        "Instrument lessons (students teaching students)",
    "How globalisation impacts the planet": "How globalisation impacts the planet",
    "Phone usage measurement app": "Phone usage measurement app",
}

# People whose names appear with different spellings / casing across the sheets.
PERSON_FIXES = {"josue": "Josue", "matthias": "Matthias", "remy": "Rémy"}
# Entries in the point-person column that are not an individual.
NOT_A_PERSON = {"all of you :)", "all of you", "everyone"}


def clean(value) -> str:
    if value is None:
        return ""
    return re.sub(r"\s+", " ", str(value).replace(" ", " ")).strip()


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-").lower()
    return re.sub(r"-{2,}", "-", text)


def sentence_case(text: str) -> str:
    """Capitalise the first letter only, leaving existing capitals alone."""
    if not text:
        return text
    if text[0].isupper():
        return text
    return text[0].upper() + text[1:]


def parse_people(raw: str) -> tuple[list[str], str]:
    """Split a point-person cell into names. Returns (names, leftover note)."""
    if not raw:
        return [], ""
    note = ""
    # "Leo (and Christoph)" -> both are point people
    inner = re.findall(r"\(([^)]*)\)", raw)
    body = re.sub(r"\([^)]*\)", " ", raw)
    for chunk in inner:
        chunk = re.sub(r"^\s*and\s+", "", chunk, flags=re.I)
        body += " & " + chunk
    parts = [p.strip(" .") for p in re.split(r"[,&/]| and ", body) if p.strip(" .")]
    names: list[str] = []
    for part in parts:
        key = part.lower().strip()
        if key in NOT_A_PERSON:
            note = "Open to the whole team"
            continue
        part = PERSON_FIXES.get(key, part)
        part = part[:1].upper() + part[1:]
        if part not in names:
            names.append(part)
    return names, note


def read_rows(ws) -> list[list[str]]:
    rows = []
    for row in ws.iter_rows(values_only=True):
        rows.append([clean(v) for v in row])
    return rows


def extract_projects(wb) -> tuple[list[dict], list[dict]]:
    rows = read_rows(wb["Log"])[1:]  # drop header
    projects: list[dict] = []
    normalisations: list[dict] = []
    seen: dict[str, int] = {}

    for index, row in enumerate(rows, start=2):
        source_title = row[0] if row else ""
        if not source_title:
            continue

        raw_strand = row[2] if len(row) > 2 else ""
        strand = STRAND_LOOKUP.get(raw_strand.lower(), "") if raw_strand else ""
        if raw_strand and not strand:
            normalisations.append(
                {"row": index, "field": "strand", "from": raw_strand, "to": "(unrecognised)"}
            )
        elif raw_strand and raw_strand != strand:
            normalisations.append(
                {"row": index, "field": "strand", "from": raw_strand, "to": strand}
            )

        title = SPELLING.get(source_title, sentence_case(source_title))
        if title != source_title:
            normalisations.append(
                {"row": index, "field": "title", "from": source_title, "to": title}
            )

        # `point person` sits in col D, but a few rows put the name in the
        # "Name 1" column (col G) instead.
        person_cell = row[3] if len(row) > 3 else ""
        if not person_cell and len(row) > 6:
            person_cell = row[6]
        people, person_note = parse_people(person_cell)

        base = slugify(f"{strand or 'open'}-{title}")
        seen[base] = seen.get(base, 0) + 1
        slug = base if seen[base] == 1 else f"{base}-{seen[base]}"

        notes = [n for n in [clean(row[5]) if len(row) > 5 else "", person_note] if n]

        projects.append(
            {
                "slug": slug,
                "title": title,
                "sourceTitle": source_title,
                # The workbook records one strand per project, so that is the
                # lead strand. The handbook expects projects to span several —
                # students choose the full set in their proposal rather than
                # having one guessed for them here.
                "strand": strand or None,
                "strands": [strand] if strand else [],
                "leads": people,
                "description": clean(row[4]) if len(row) > 4 else "",
                "notes": " · ".join(notes),
                "origin": "workbook",
                "projectType": None,
                "sourceRow": index,
            }
        )

    projects.extend(KICKOFF_PROJECTS)
    return projects, normalisations


# --- Kickoff projects from The IMPACT Handbook, section 9 -------------------
# Illustrative, not prescriptive. Strand sets and internal/external types are
# exactly as printed; these are the only projects with a real multi-strand
# assignment, because they are the only ones the handbook assigns.
KICKOFF_PROJECTS = [
    {
        "slug": "kickoff-voices-of-tomorrow",
        "title": "Student-led podcast: Voices of Tomorrow",
        "sourceTitle": "PROJECT EXAMPLE 1 – STUDENT-LED PODCAST: VOICES OF TOMORROW",
        "strand": "Imagination",
        "strands": ["Imagination", "Action", "Character", "Technologies"],
        "leads": [],
        "description": (
            "A student team conceptualises, produces and publishes a podcast featuring "
            "interviews with young changemakers, entrepreneurs or activists. Students manage "
            "research, outreach, recording, editing and distribution, while reflecting on "
            "communication, ethics and audience responsibility."
        ),
        "notes": "Develops storytelling, collaboration, discipline and public engagement.",
        "origin": "handbook",
        "projectType": "external",
        "sourceRow": 0,
    },
    {
        "slug": "kickoff-sustainable-materials",
        "title": "Sustainable materials research initiative",
        "sourceTitle": "PROJECT EXAMPLE 2 – SUSTAINABLE MATERIALS RESEARCH INITIATIVE",
        "strand": "Planet",
        "strands": ["Planet", "Technologies", "Action"],
        "leads": [],
        "description": (
            "Students research biodegradable materials and prototype small-scale applications. "
            "The project involves experimentation, documentation, and presentation of findings "
            "to external audiences such as exhibitions or sustainability forums."
        ),
        "notes": "Emphasises scientific rigour, systems thinking and responsible innovation.",
        "origin": "handbook",
        "projectType": "internal-to-external",
        "sourceRow": 0,
    },
    {
        "slug": "kickoff-wellbeing-campaign",
        "title": "School-wide wellbeing campaign",
        "sourceTitle": "PROJECT EXAMPLE 3 – SCHOOL-WIDE WELLBEING CAMPAIGN",
        "strand": "Character",
        "strands": ["Character", "Movement", "Action"],
        "leads": [],
        "description": (
            "A campaign contributing to the life of the school through storytelling, "
            "performance, media or artistic production, shared publicly."
        ),
        "notes": "Emphasises communication, creativity and audience engagement.",
        "origin": "handbook",
        "projectType": "external",
        "sourceRow": 0,
    },
    {
        "slug": "kickoff-digital-heritage-archive",
        "title": "Digital heritage archive",
        "sourceTitle": "PROJECT EXAMPLE 4 – DIGITAL HERITAGE ARCHIVE",
        "strand": "Technologies",
        "strands": ["Technologies", "Imagination", "Planet", "Action"],
        "leads": [],
        "description": (
            "Students collaborate to create a digital archive preserving local history or "
            "cultural narratives. The project blends research, technology and storytelling, "
            "often in partnership with community organisations."
        ),
        "notes": "",
        "origin": "handbook",
        "projectType": "external",
        "sourceRow": 0,
    },
    {
        "slug": "kickoff-ai-study-support",
        "title": "AI study support tool",
        "sourceTitle": "PROJECT EXAMPLE 5 – AI STUDY SUPPORT TOOL",
        "strand": "Technologies",
        "strands": ["Technologies", "Character", "Action"],
        "leads": [],
        "description": (
            "Students design a digital tool to support peer learning and wellbeing, accompanied "
            "by reflection on data ethics and responsible AI use."
        ),
        "notes": "",
        "origin": "handbook",
        "projectType": "internal",
        "sourceRow": 0,
    },
]


# Resources that are the same practice recorded twice under different names.
RESOURCE_ALIASES = {
    "harkness": "circle-solutions-harkness",
    "art journals": "art-journaling",
    "definition of done": "success-criteria-def-of-done",
    "problem framing": "problem-framing",
    "systems mapping": "systems-mapping",
    "plan - do - reflect": "plan-act-reflect-new-name-coming",
    "david perkins def of learning": "david-perkins-def-of-learning",
}

# Editorial grouping of the practice library. The `corePractice` flag below is
# taken from the workbook's own "current priority" column, not from this map.
CATEGORIES = {
    "Project method": [
        "pitch", "kanban", "plan-act-reflect-new-name-coming", "eduscrum",
        "agile classroom", "design thinking", "a3-work-method", "kaizen",
        "project-work-time", "demo-prep", "demo-run-thgroughs", "retrospective",
        "brainstorming-projects", "ideation", "dragon-s-den-pitch",
        "business-model-canvas", "problem-framing", "6-hats-exercise",
    ],
    "Thinking & inquiry": [
        "ask-a-further-question", "david-perkins-def-of-learning", "project-zero",
        "systems-mapping", "complex-adaptive-systems", "single-and-double-loop-learning",
        "iterative-learning", "feedback-loops", "simulation-in-teaching-and-learning",
        "exeter-math-hungarian-math", "krashen-monitor-model",
    ],
    "Assessment & feedback": [
        "success-criteria-def-of-done", "stanford-d-lab-feedback", "portfolios",
        "smart-goals", "coaching-sessions",
    ],
    "Character & culture": [
        "circle-solutions-harkness", "grit", "flow", "the-power-of-yet", "bildung",
        "janusz-korczak", "53-leaders", "theatre-in-education-tie",
        "duolingo-five-central-pillars", "stanford-life-design",
    ],
    "Studio & making": [
        "art-journaling", "filmmaking-assistance", "movie-writers",
        "mattias-s-card-games", "impact-agora", "learning-circus-tzbz",
    ],
    "Logistics & rhythm": [
        "pomodoro", "flipped-classroom", "off-campus-visits", "visit-escape-room",
        "ad-to-do", "fundraise-a-dog-park",
    ],
}
CATEGORY_OF = {slug: cat for cat, slugs in CATEGORIES.items() for slug in slugs}


def extract_resources(wb) -> tuple[list[dict], list[dict]]:
    rows = read_rows(wb["Resources"])[1:]
    resources: dict[str, dict] = {}
    normalisations: list[dict] = []

    for index, row in enumerate(rows, start=2):
        source_title = row[0] if row else ""
        if not source_title:
            continue

        note = clean(row[5]) if len(row) > 5 else ""
        person_cell = row[3] if len(row) > 3 else ""

        # One row smuggled a whole tab-separated record into a single cell.
        if "\t" in source_title:
            parts = [p.strip() for p in source_title.split("\t")]
            source_title = parts[0]
            trailing = [p for p in parts[1:] if p and p.lower() != "resource"]
            if trailing:
                note = " · ".join([n for n in [note] + trailing if n])
                person_cell = person_cell or trailing[-1].split(" - ")[0]
            normalisations.append(
                {"row": index, "field": "title", "from": "tab-separated cell", "to": source_title}
            )

        title = sentence_case(source_title)
        slug = RESOURCE_ALIASES.get(source_title.lower(), slugify(source_title))

        url = ""
        match = re.search(r"https?://\S+", note)
        if match:
            url = match.group(0)
            note = note.replace(url, "").strip(" ·-")

        people, _ = parse_people(person_cell)
        # "current priority" == 1 marks the practices being rolled out first.
        core = (clean(row[1]) if len(row) > 1 else "").startswith("1")
        # The strand column in this sheet is mostly a stray "0.0".
        raw_strand = clean(row[2]) if len(row) > 2 else ""
        strand = STRAND_LOOKUP.get(raw_strand.lower(), "") if raw_strand else ""
        focus = raw_strand if raw_strand and not strand and raw_strand != "0.0" else ""

        if slug in resources:
            existing = resources[slug]
            existing["corePractice"] = existing["corePractice"] or core
            existing["url"] = existing["url"] or url
            for name in people:
                if name not in existing["leads"]:
                    existing["leads"].append(name)
            if note and note not in existing["notes"]:
                existing["notes"] = " · ".join(filter(None, [existing["notes"], note]))
            if source_title not in existing["alsoListedAs"]:
                existing["alsoListedAs"].append(source_title)
            normalisations.append(
                {"row": index, "field": "duplicate", "from": source_title, "to": existing["title"]}
            )
            continue

        resources[slug] = {
            "slug": slug,
            "title": title,
            "sourceTitle": source_title,
            "category": CATEGORY_OF.get(slug, "Reading & references"),
            "strand": strand or None,
            "focus": focus,
            "leads": people,
            "corePractice": core,
            "notes": note,
            "url": url,
            "alsoListedAs": [],
            "origin": "workbook",
            "author": "",
            "year": "",
            "citation": "",
            "href": "",
            "sourceRow": index,
        }

    ordered = DOCUMENTS + list(resources.values()) + CITATIONS
    return ordered, normalisations


def _document(**kwargs):
    """A resource that came from a published document rather than the workbook."""
    base = {
        "sourceTitle": kwargs.get("title", ""),
        "strand": None,
        "focus": "",
        "leads": [],
        "corePractice": False,
        "notes": "",
        "url": "",
        "alsoListedAs": [],
        "origin": "handbook",
        "author": "",
        "year": "",
        "citation": "",
        "href": "",
        "sourceRow": 0,
    }
    base.update(kwargs)
    return base


# --- Documentation ---------------------------------------------------------
# The documents the programme actually runs on. Listing them means anyone can
# see where a piece of content came from, rather than guessing.
DOCUMENTS = [
    _document(
        slug="impact-handbook",
        title="The IMPACT Handbook, Vol. 1",
        category="Documentation",
        author="Eastwood Montreux",
        year="v8",
        href="/handbook",
        notes=(
            "The published description of the programme, in eleven sections: the rationale, "
            "the strands, the four-stage journey, coaching and governance, measurement, "
            "progression across grades, external impact, kickoff projects, and outcomes. "
            "Where this and the planning workbook disagree, the handbook is authoritative — "
            "it is what the school has published."
        ),
    ),
    _document(
        slug="impact-planning-workbook",
        title="IMPACT curriculum planning workbook",
        category="Documentation",
        author="The IMPACT team",
        notes=(
            "The living spreadsheet the team adds to: project ideas, practices to try, and who "
            "has taken ownership of what. Every project and practice on this platform is "
            "generated from it, so editing the workbook and re-running the extractor is how "
            "the menu changes."
        ),
    ),
    _document(
        slug="logo-standards-artwork-sheet",
        title="Logo Standards / Artwork Sheet",
        category="Documentation",
        author="Ciara Jenkins",
        year="1 December 2025",
        notes=(
            "The brand source: logo configurations, approved colour usage, and the full primary "
            "and secondary palettes. Every colour on this platform comes from it — nothing is "
            "invented, and nothing should be added without amending the sheet first."
        ),
    ),
]

# --- Evidence base ---------------------------------------------------------
# The research the handbook grounds the programme in. Cited exactly as printed,
# so a coach can go and read the source rather than take it on trust.
CITATIONS = [
    _document(
        slug="how-people-learn",
        title="How People Learn: Brain, Mind, Experience, and School",
        category="Evidence base",
        author="John D. Bransford et al., National Research Council",
        year="2000",
        citation="Bransford et al. (2000), National Research Council",
        notes=(
            "Deep understanding develops when learners actively construct knowledge through "
            "experience, reflection and application — the finding the whole programme rests on."
        ),
    ),
    _document(
        slug="making-learning-whole",
        title="Making Learning Whole",
        category="Evidence base",
        author="David Perkins, Harvard Graduate School of Education",
        year="2009",
        citation="Perkins (2009)",
        notes=(
            "Knowledge transfers most effectively through \u201cwhole game\u201d learning: applying skills in "
            "real-world simulations that mirror authentic performance."
        ),
    ),
    _document(
        slug="mathematical-mindsets",
        title="Mathematical Mindsets",
        category="Evidence base",
        author="Jo Boaler, Stanford Graduate School of Education",
        year="2016",
        citation="Boaler (2016)",
        notes=(
            "Project-based, applied learning environments significantly improve conceptual "
            "retention and problem-solving capacity compared with rote instruction."
        ),
    ),
    _document(
        slug="grit-duckworth",
        title="Grit: The Power of Passion and Perseverance",
        category="Evidence base",
        author="Angela Duckworth",
        year="2016",
        citation="Duckworth (2016); Duckworth et al. (2007), Journal of Personality and Social Psychology",
        notes=(
            "Sustained engagement in meaningful, challenging projects predicts long-term "
            "achievement more strongly than IQ alone."
        ),
    ),
    _document(
        slug="goal-setting-locke-latham",
        title="Building a Practically Useful Theory of Goal Setting and Task Motivation",
        category="Evidence base",
        author="Edwin Locke and Gary Latham",
        year="2002",
        citation="Locke & Latham (2002)",
        notes=(
            "Specific, challenging goals significantly improve focus, persistence and "
            "performance. The reason IMPACT goals are SMART rather than aspirational."
        ),
    ),
    _document(
        slug="kolb-experiential-learning",
        title="Experiential Learning Theory",
        category="Evidence base",
        author="David Kolb",
        year="1984",
        citation="Kolb (1984)",
        notes=(
            "Learning is strengthened through cycles of action and reflection, improving both "
            "retention and transfer — the basis of the Plan \u2013 Act \u2013 Reflect cycle."
        ),
    ),
    _document(
        slug="freeman-active-learning",
        title="Active learning increases student performance",
        category="Evidence base",
        author="Freeman et al., PNAS",
        year="2014",
        citation="Freeman et al. (2014), PNAS",
        notes="Active learning significantly increases performance compared with traditional instruction.",
    ),
    _document(
        slug="transfer-perkins-salomon",
        title="Research on transfer of learning",
        category="Evidence base",
        author="David Perkins and Gavriel Salomon",
        year="1988; 1992",
        citation="Perkins & Salomon (1988; 1992)",
        notes=(
            "Knowledge transfers more effectively when applied across contexts rather than "
            "learned in isolation."
        ),
    ),
    _document(
        slug="boix-mansilla-interdisciplinary",
        title="Interdisciplinary understanding",
        category="Evidence base",
        author="Veronica Boix Mansilla, Harvard",
        year="2003",
        citation="Boix Mansilla (2003)",
        notes=(
            "Complex problem-solving requires integration across disciplines — why projects are "
            "expected to span several strands."
        ),
    ),
]


def build_people(projects, resources) -> list[dict]:
    people: dict[str, dict] = {}
    for project in projects:
        for name in project["leads"]:
            entry = people.setdefault(name, {"name": name, "slug": slugify(name), "projects": [], "resources": []})
            entry["projects"].append(project["slug"])
    for resource in resources:
        for name in resource["leads"]:
            entry = people.setdefault(name, {"name": name, "slug": slugify(name), "projects": [], "resources": []})
            entry["resources"].append(resource["slug"])
    return sorted(people.values(), key=lambda p: p["name"])


def main() -> None:
    wb = openpyxl.load_workbook(WORKBOOK, data_only=True)
    projects, project_norms = extract_projects(wb)
    resources, resource_norms = extract_resources(wb)
    people = build_people(projects, resources)

    OUT.mkdir(parents=True, exist_ok=True)
    for name, payload in [
        ("projects", projects),
        ("resources", resources),
        ("people", people),
        ("normalisations", {"projects": project_norms, "resources": resource_norms}),
    ]:
        (OUT / f"{name}.json").write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")

    unassigned = [p["title"] for p in projects if not p["strand"]]
    print(f"projects        {len(projects):>3}  ({sum(1 for p in projects if p['origin'] == 'handbook')} from the handbook)")
    print(f"  unassigned    {len(unassigned):>3}  {unassigned}")
    print(f"resources       {len(resources):>3}  ({sum(1 for r in resources if r['corePractice'])} core, {sum(1 for r in resources if r['origin'] == 'handbook')} from documents)")
    print(f"people          {len(people):>3}")
    print(f"normalisations  {len(project_norms) + len(resource_norms):>3}")
    for strand in STRANDS:
        print(f"  {strand:<12} {sum(1 for p in projects if p['strand'] == strand):>3}")


if __name__ == "__main__":
    main()
