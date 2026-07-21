"""Seeds the `universities` table with a realistic global catalog.

Run from the backend/ directory with the venv active:

    python -m scripts.seed_universities

Idempotent: re-running upserts by `id`, so it's safe to run again after
editing the data below.
"""

import asyncio
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select  # noqa: E402
from sqlalchemy.ext.asyncio import AsyncSession  # noqa: E402

from app.core.database import AsyncSessionLocal  # noqa: E402
from app.models.university import University  # noqa: E402

SELECTIVITY_BANDS = [
    (10, "Most Selective"),
    (25, "Highly Selective"),
    (50, "Selective"),
    (75, "Moderately Selective"),
    (101, "Less Selective"),
]

GRADIENT_PALETTE = [
    ("#0B1F3A", "#2F6FEB"),
    ("#1F4E79", "#00A0B0"),
    ("#3B2A1A", "#8C1515"),
    ("#002147", "#B08D57"),
    ("#00274D", "#7A1C1C"),
    ("#0B3D91", "#00A651"),
    ("#57068C", "#1A1A2E"),
    ("#003057", "#7B1E3A"),
    ("#2E2E38", "#C9A227"),
    ("#123456", "#E0A458"),
]


def slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return re.sub(r"-{2,}", "-", slug)


def selectivity_for(acceptance_rate: float) -> str:
    for threshold, label in SELECTIVITY_BANDS:
        if acceptance_rate < threshold:
            return label
    return "Less Selective"


def initials_for(name: str, short_name: str) -> str:
    source = short_name if len(short_name) <= 5 else name
    letters = "".join(word[0] for word in re.findall(r"[A-Za-z]+", source))
    return (letters[:4] or short_name[:4]).upper()


def build(
    *,
    name: str,
    short_name: str,
    country: str,
    city: str,
    national_ranking: int,
    world_ranking: int,
    acceptance_rate: float,
    min_gpa: float,
    sat_low: int,
    sat_high: int,
    act_min: int | None,
    act_max: int | None,
    ielts_min: float,
    toefl_min: int,
    tuition_per_year_usd: int,
    living_cost_per_year_usd: int,
    scholarship_available: bool,
    scholarship_coverage: str,
    application_deadline: str,
    decision_type: str,
    tags: list[str],
    description: str,
    requirements: list[dict],
    accept_rate_trend: list[dict],
    website: str,
    id_override: str | None = None,
) -> dict:
    slug = slugify(name)
    gradient_from, gradient_to = GRADIENT_PALETTE[national_ranking % len(GRADIENT_PALETTE)]
    return {
        "id": id_override or f"uni-{slug}",
        "slug": slug,
        "name": name,
        "short_name": short_name,
        "country": country,
        "city": city,
        "logo_initials": initials_for(name, short_name),
        "world_ranking": world_ranking,
        "national_ranking": national_ranking,
        "acceptance_rate": acceptance_rate,
        "selectivity_level": selectivity_for(acceptance_rate),
        "min_gpa": min_gpa,
        "sat_low": sat_low,
        "sat_high": sat_high,
        "act_min": act_min,
        "act_max": act_max,
        "ielts_min": ielts_min,
        "toefl_min": toefl_min,
        "tuition_per_year_usd": tuition_per_year_usd,
        "living_cost_per_year_usd": living_cost_per_year_usd,
        "scholarship_available": scholarship_available,
        "scholarship_coverage": scholarship_coverage,
        "application_deadline": application_deadline,
        "decision_type": decision_type,
        "tags": tags,
        "description": description,
        "requirements": requirements,
        "accept_rate_trend": accept_rate_trend,
        "gradient_from": gradient_from,
        "gradient_to": gradient_to,
        "website": website,
    }


def trend_for(current: float) -> list[dict]:
    """A plausible 4-year acceptance-rate trend ending at `current`."""
    step = max(0.4, current * 0.06)
    return [
        {"year": "2022", "rate": round(current + step * 2, 1)},
        {"year": "2023", "rate": round(current + step * 1.3, 1)},
        {"year": "2024", "rate": round(current + step * 0.6, 1)},
        {"year": "2025", "rate": round(current, 1)},
    ]


def generic_requirements(country: str) -> list[dict]:
    by_country = {
        "United States": [
            {"label": "Common App / Coalition essays", "value": "1 personal essay + supplements"},
            {"label": "Letters of recommendation", "value": "1-2 teachers + 1 counselor"},
            {"label": "Standardized testing", "value": "SAT or ACT, test-optional at many"},
            {"label": "Interview", "value": "Optional, alumni-led"},
        ],
        "United Kingdom": [
            {"label": "Personal statement", "value": "UCAS, ~4,000 characters"},
            {"label": "Predicted grades", "value": "A-Level / IB predictions"},
            {"label": "Letters of recommendation", "value": "1 academic reference"},
            {"label": "Interview", "value": "Course-dependent"},
        ],
        "Kazakhstan": [
            {"label": "National exam (ENT/UNT) score", "value": "Strong composite score"},
            {"label": "University entrance exam", "value": "Subject-specific, if applicable"},
            {"label": "Personal statement", "value": "1 essay"},
            {"label": "Interview", "value": "Program-dependent"},
        ],
        "China": [
            {"label": "Gaokao or international equivalent", "value": "Score-dependent by program"},
            {"label": "HSK Chinese proficiency", "value": "Required for Chinese-taught programs"},
            {"label": "Personal statement", "value": "1 essay"},
            {"label": "Interview", "value": "Program-dependent"},
        ],
        "Germany": [
            {"label": "Abitur or equivalent", "value": "Secondary school leaving certificate"},
            {"label": "Language proficiency", "value": "German (DSH/TestDaF) or English track"},
            {"label": "Motivation letter", "value": "1 essay"},
            {"label": "Interview", "value": "Program-dependent"},
        ],
        "Italy": [
            {"label": "Secondary school diploma", "value": "13 years of schooling required"},
            {"label": "Admissions test (TOLC or similar)", "value": "Required for most programs"},
            {"label": "Language proficiency", "value": "Italian or English track" },
            {"label": "Interview", "value": "Not typically required"},
        ],
        "Singapore": [
            {"label": "Personal statement", "value": "1 essay + activity summary"},
            {"label": "Letters of recommendation", "value": "1-2 recommenders"},
            {"label": "Standardized testing", "value": "SAT/ACT or A-Level/IB accepted"},
            {"label": "Interview", "value": "Program-dependent"},
        ],
        "Japan": [
            {"label": "EJU or equivalent exam", "value": "Required for most national universities"},
            {"label": "Personal statement", "value": "1-2 essays"},
            {"label": "Letters of recommendation", "value": "1-2 academic references"},
            {"label": "Interview", "value": "Common for English-taught programs"},
        ],
        "South Korea": [
            {"label": "CSAT or international equivalent", "value": "Score-dependent by program"},
            {"label": "Personal statement", "value": "1-2 essays"},
            {"label": "Letters of recommendation", "value": "1-2 academic references"},
            {"label": "Interview", "value": "Common for competitive programs"},
        ],
    }
    return by_country.get(country, by_country["United States"])


def generic_description(name: str, country: str) -> str:
    return f"{name} is a leading research university in {country}, recognized for strong academics and an active student community."


# ---------------------------------------------------------------------------
# Country generation parameters: (base_world_rank, world_rank_step,
# base_acceptance, acceptance_step, base_gpa, gpa_floor, sat_low_base,
# sat_high_base, sat_step, ielts, toefl, act_min, act_max, tuition, living,
# currency note baked into scholarship text, deadline, decision type)
# ---------------------------------------------------------------------------


def generate_country(
    country: str,
    entries: list[tuple[str, str]],
    *,
    world_base: int,
    world_step: float,
    acc_base: float,
    acc_step: float,
    gpa_base: float,
    gpa_floor: float,
    sat_low_base: int,
    sat_high_base: int,
    sat_step: int,
    ielts: float,
    toefl: int,
    act_min: int | None,
    act_max: int | None,
    tuition: int,
    living: int,
    deadline: str,
    decision_type: str,
    tags: list[str],
    skip_ids: set[str] | None = None,
) -> list[dict]:
    skip_ids = skip_ids or set()
    rows = []
    rank = 0
    for name, city in entries:
        rank += 1
        candidate_id = f"uni-{slugify(name)}"
        if candidate_id in skip_ids:
            continue
        acceptance = round(min(96, acc_base + acc_step * (rank - 1)), 1)
        gpa = round(max(gpa_floor, gpa_base - 0.012 * (rank - 1)), 2)
        sat_low = max(950, sat_low_base - sat_step * (rank - 1))
        sat_high = max(sat_low + 90, sat_high_base - sat_step * (rank - 1))
        world_rank = round(world_base + world_step * (rank - 1))
        short_name = name if len(name) <= 18 else "".join(w[0] for w in name.split())[:5].upper()
        rows.append(
            build(
                name=name,
                short_name=short_name,
                country=country,
                city=city,
                national_ranking=rank,
                world_ranking=world_rank,
                acceptance_rate=acceptance,
                min_gpa=gpa,
                sat_low=int(sat_low),
                sat_high=int(sat_high),
                act_min=act_min,
                act_max=act_max,
                ielts_min=ielts,
                toefl_min=toefl,
                tuition_per_year_usd=tuition,
                living_cost_per_year_usd=living,
                scholarship_available=True,
                scholarship_coverage="Merit and need-based aid available for competitive applicants",
                application_deadline=deadline,
                decision_type=decision_type,
                tags=tags,
                description=generic_description(name, country),
                requirements=generic_requirements(country),
                accept_rate_trend=trend_for(acceptance),
                website=f"https://www.{slugify(name).replace('-', '')[:20]}.edu",
            )
        )
    return rows


# ---------------------------------------------------------------------------
# Featured universities — rich, hand-authored data already live in the
# frontend catalog today. Carried over verbatim so existing predictions and
# dream-university selections keep resolving to the same rows.
# ---------------------------------------------------------------------------

FEATURED: list[dict] = [
    build(
        name="Massachusetts Institute of Technology", short_name="MIT", country="United States",
        city="Cambridge, MA", national_ranking=1, world_ranking=1, acceptance_rate=4,
        min_gpa=3.9, sat_low=1520, sat_high=1580, act_min=34, act_max=36, ielts_min=7.0, toefl_min=100,
        tuition_per_year_usd=59750, living_cost_per_year_usd=21900, scholarship_available=True,
        scholarship_coverage="Up to 100% need-based aid", application_deadline="Jan 1, 2027",
        decision_type="Regular Decision", tags=["STEM", "Ivy-tier", "Research"],
        description="A private research university renowned for engineering, computer science, and a hands-on, problem-first culture.",
        requirements=[
            {"label": "Common App essays", "value": "5 short responses"},
            {"label": "Letters of recommendation", "value": "2 teachers + 1 counselor"},
            {"label": "Standardized testing", "value": "SAT/ACT optional, encouraged"},
            {"label": "Interview", "value": "Optional, alumni-led"},
        ],
        accept_rate_trend=[{"year": "2022", "rate": 6.7}, {"year": "2023", "rate": 4.8}, {"year": "2024", "rate": 4.5}, {"year": "2025", "rate": 4.0}],
        website="https://www.mit.edu", id_override="uni-mit",
    ),
    build(
        name="Stanford University", short_name="Stanford", country="United States", city="Stanford, CA",
        national_ranking=2, world_ranking=3, acceptance_rate=4, min_gpa=3.9, sat_low=1500, sat_high=1570,
        act_min=33, act_max=35, ielts_min=7.0, toefl_min=100, tuition_per_year_usd=61731, living_cost_per_year_usd=21322,
        scholarship_available=True, scholarship_coverage="Full tuition under $150k family income",
        application_deadline="Jan 5, 2027", decision_type="Regular Decision",
        tags=["STEM", "Entrepreneurship", "Ivy-tier"],
        description="A private research university in Silicon Valley known for entrepreneurship, interdisciplinary research, and a sprawling, sun-lit campus.",
        requirements=[
            {"label": "Common App essays", "value": "1 long + 3 short"},
            {"label": "Letters of recommendation", "value": "2 teachers + 1 counselor"},
            {"label": "Standardized testing", "value": "SAT/ACT optional"},
            {"label": "Interview", "value": "Optional, alumni-led"},
        ],
        accept_rate_trend=[{"year": "2022", "rate": 5.2}, {"year": "2023", "rate": 4.3}, {"year": "2024", "rate": 3.9}, {"year": "2025", "rate": 3.6}],
        website="https://www.stanford.edu", id_override="uni-stanford",
    ),
    build(
        name="University of California, Berkeley", short_name="UC Berkeley", country="United States", city="Berkeley, CA",
        national_ranking=3, world_ranking=10, acceptance_rate=11, min_gpa=3.8, sat_low=1360, sat_high=1530,
        act_min=29, act_max=35, ielts_min=7.0, toefl_min=90, tuition_per_year_usd=48465, living_cost_per_year_usd=20200,
        scholarship_available=True, scholarship_coverage="Merit + need-based, varies by state residency",
        application_deadline="Nov 30, 2026", decision_type="Regular Decision", tags=["Public", "STEM", "Large campus"],
        description="A top public research university with deep strength across engineering, business, and the sciences.",
        requirements=[
            {"label": "UC application essays", "value": "4 personal insight questions"},
            {"label": "Letters of recommendation", "value": "Not required"},
            {"label": "Standardized testing", "value": "Not considered"},
            {"label": "Interview", "value": "Not offered"},
        ],
        accept_rate_trend=[{"year": "2022", "rate": 14.5}, {"year": "2023", "rate": 11.6}, {"year": "2024", "rate": 11.2}, {"year": "2025", "rate": 10.5}],
        website="https://www.berkeley.edu", id_override="uni-berkeley",
    ),
    build(
        name="University of Toronto", short_name="U of T", country="Canada", city="Toronto, ON",
        national_ranking=1, world_ranking=21, acceptance_rate=43, min_gpa=3.6, sat_low=1290, sat_high=1490,
        act_min=None, act_max=None, ielts_min=6.5, toefl_min=100, tuition_per_year_usd=45000, living_cost_per_year_usd=15000,
        scholarship_available=True, scholarship_coverage="Lester B. Pearson International (full ride, limited)",
        application_deadline="Jan 15, 2027", decision_type="Rolling", tags=["Public", "Research", "Co-op friendly"],
        description="Canada's top-ranked university, with a huge, research-intensive campus in the heart of downtown Toronto.",
        requirements=[
            {"label": "Supplementary essays", "value": "Program-specific, 2-3 questions"},
            {"label": "Letters of recommendation", "value": "Not typically required"},
            {"label": "Standardized testing", "value": "Not required for most programs"},
            {"label": "Interview", "value": "Program-dependent"},
        ],
        accept_rate_trend=[{"year": "2022", "rate": 40.0}, {"year": "2023", "rate": 42.0}, {"year": "2024", "rate": 43.0}, {"year": "2025", "rate": 43.0}],
        website="https://www.utoronto.ca", id_override="uni-toronto",
    ),
    build(
        name="University of Oxford", short_name="Oxford", country="United Kingdom", city="Oxford, England",
        national_ranking=1, world_ranking=2, acceptance_rate=13, min_gpa=3.8, sat_low=1450, sat_high=1560,
        act_min=32, act_max=35, ielts_min=7.0, toefl_min=100, tuition_per_year_usd=42000, living_cost_per_year_usd=16000,
        scholarship_available=True, scholarship_coverage="Reach Oxford & Clarendon scholarships",
        application_deadline="Oct 15, 2026", decision_type="Early Action", tags=["Collegiate", "Research", "Tutorial system"],
        description="The oldest university in the English-speaking world, teaching through a distinctive one-to-one and small-group tutorial system.",
        requirements=[
            {"label": "Personal statement", "value": "UCAS, ~4,000 characters"},
            {"label": "Admissions test", "value": "Course-dependent (e.g. MAT, TSA)"},
            {"label": "Letters of recommendation", "value": "1 academic reference"},
            {"label": "Interview", "value": "Required for shortlisted candidates"},
        ],
        accept_rate_trend=[{"year": "2022", "rate": 15.0}, {"year": "2023", "rate": 14.0}, {"year": "2024", "rate": 13.5}, {"year": "2025", "rate": 13.0}],
        website="https://www.ox.ac.uk", id_override="uni-oxford",
    ),
    build(
        name="University of Cambridge", short_name="Cambridge", country="United Kingdom", city="Cambridge, England",
        national_ranking=2, world_ranking=5, acceptance_rate=18, min_gpa=3.8, sat_low=1450, sat_high=1560,
        act_min=32, act_max=35, ielts_min=7.5, toefl_min=110, tuition_per_year_usd=43000, living_cost_per_year_usd=16000,
        scholarship_available=True, scholarship_coverage="Cambridge Trust international scholarships",
        application_deadline="Oct 15, 2026", decision_type="Early Action", tags=["Collegiate", "Research", "STEM"],
        description="A collegiate research university with an 800-year history and outsized strength in mathematics and the natural sciences.",
        requirements=[
            {"label": "Personal statement", "value": "UCAS, ~4,000 characters"},
            {"label": "Admissions test", "value": "Course-dependent (e.g. ENGAA, NSAA)"},
            {"label": "Letters of recommendation", "value": "1 academic reference"},
            {"label": "Interview", "value": "Required for shortlisted candidates"},
        ],
        accept_rate_trend=[{"year": "2022", "rate": 21.0}, {"year": "2023", "rate": 19.0}, {"year": "2024", "rate": 18.5}, {"year": "2025", "rate": 17.6}],
        website="https://www.cam.ac.uk", id_override="uni-cambridge",
    ),
    build(
        name="National University of Singapore", short_name="NUS", country="Singapore", city="Singapore",
        national_ranking=1, world_ranking=8, acceptance_rate=22, min_gpa=3.7, sat_low=1420, sat_high=1550,
        act_min=31, act_max=34, ielts_min=6.5, toefl_min=92, tuition_per_year_usd=29000, living_cost_per_year_usd=10000,
        scholarship_available=True, scholarship_coverage="ASEAN & Global Undergraduate Scholarship",
        application_deadline="Mar 1, 2027", decision_type="Regular Decision", tags=["STEM", "Public", "Asia's top-ranked"],
        description="Asia's leading research university, combining rigorous STEM programs with a highly international student body.",
        requirements=[
            {"label": "Personal statement", "value": "1 essay + activity summary"},
            {"label": "Letters of recommendation", "value": "1-2 recommenders"},
            {"label": "Standardized testing", "value": "SAT/ACT recommended"},
            {"label": "Interview", "value": "Program-dependent"},
        ],
        accept_rate_trend=[{"year": "2022", "rate": 25.0}, {"year": "2023", "rate": 23.5}, {"year": "2024", "rate": 22.8}, {"year": "2025", "rate": 22.0}],
        website="https://www.nus.edu.sg", id_override="uni-nus",
    ),
    build(
        name="ETH Zurich", short_name="ETH Zurich", country="Switzerland", city="Zurich",
        national_ranking=1, world_ranking=7, acceptance_rate=27, min_gpa=3.7, sat_low=1400, sat_high=1540,
        act_min=30, act_max=34, ielts_min=7.0, toefl_min=100, tuition_per_year_usd=1500, living_cost_per_year_usd=19000,
        scholarship_available=True, scholarship_coverage="Excellence Scholarship & Opportunity Programme",
        application_deadline="Apr 30, 2027", decision_type="Regular Decision", tags=["STEM", "Public", "Low tuition"],
        description="A world-leading public STEM university with famously low tuition and a rigorous, math-heavy curriculum.",
        requirements=[
            {"label": "Entrance examination", "value": "Required unless exempt"},
            {"label": "Letters of recommendation", "value": "Not typically required"},
            {"label": "Language proficiency", "value": "German or English track"},
            {"label": "Interview", "value": "Not offered"},
        ],
        accept_rate_trend=[{"year": "2022", "rate": 30.0}, {"year": "2023", "rate": 28.5}, {"year": "2024", "rate": 27.6}, {"year": "2025", "rate": 27.0}],
        website="https://ethz.ch", id_override="uni-eth",
    ),
    build(
        name="University of Melbourne", short_name="Melbourne", country="Australia", city="Melbourne, VIC",
        national_ranking=1, world_ranking=14, acceptance_rate=38, min_gpa=3.5, sat_low=1250, sat_high=1460,
        act_min=27, act_max=32, ielts_min=6.5, toefl_min=79, tuition_per_year_usd=35000, living_cost_per_year_usd=18000,
        scholarship_available=True, scholarship_coverage="Melbourne Global Excellence Scholarship",
        application_deadline="Dec 15, 2026", decision_type="Rolling", tags=["Public", "Research", "Broad-based first year"],
        description="Australia's top-ranked university, known for its flexible Melbourne Model of broad undergraduate degrees.",
        requirements=[
            {"label": "Personal statement", "value": "Program-specific, 1 essay"},
            {"label": "Letters of recommendation", "value": "Not required"},
            {"label": "Standardized testing", "value": "Not required"},
            {"label": "Interview", "value": "Not offered"},
        ],
        accept_rate_trend=[{"year": "2022", "rate": 42.0}, {"year": "2023", "rate": 40.0}, {"year": "2024", "rate": 38.5}, {"year": "2025", "rate": 37.5}],
        website="https://www.unimelb.edu.au", id_override="uni-melbourne",
    ),
    build(
        name="Nazarbayev University", short_name="NU", country="Kazakhstan", city="Astana",
        national_ranking=1, world_ranking=531, acceptance_rate=12, min_gpa=3.4, sat_low=1150, sat_high=1400,
        act_min=25, act_max=30, ielts_min=6.0, toefl_min=80, tuition_per_year_usd=0, living_cost_per_year_usd=4500,
        scholarship_available=True, scholarship_coverage="Full state-funded tuition + stipend for all admits",
        application_deadline="Jun 1, 2027", decision_type="Regular Decision", tags=["Fully-funded", "STEM", "English-taught"],
        description="Kazakhstan's flagship autonomous research university, delivering fully English-taught programs built with top global partner universities.",
        requirements=[
            {"label": "UNT / national exam score", "value": "Strong composite score"},
            {"label": "NU-administered test", "value": "SAT-style entrance exam"},
            {"label": "Personal statement", "value": "1 essay"},
            {"label": "Interview", "value": "Required for some schools"},
        ],
        accept_rate_trend=[{"year": "2022", "rate": 15.0}, {"year": "2023", "rate": 13.5}, {"year": "2024", "rate": 12.8}, {"year": "2025", "rate": 12.0}],
        website="https://nu.edu.kz", id_override="uni-nu",
    ),
    build(
        name="New York University", short_name="NYU", country="United States", city="New York, NY",
        national_ranking=4, world_ranking=25, acceptance_rate=8, min_gpa=3.7, sat_low=1430, sat_high=1560,
        act_min=32, act_max=35, ielts_min=7.0, toefl_min=100, tuition_per_year_usd=62000, living_cost_per_year_usd=25000,
        scholarship_available=True, scholarship_coverage="Merit scholarships, limited need-based for intl.",
        application_deadline="Jan 5, 2027", decision_type="Regular Decision", tags=["Urban campus", "Business", "Arts"],
        description="A sprawling urban research university woven into New York City, with standout business, arts, and film programs.",
        requirements=[
            {"label": "Common App essays", "value": "1 long + supplement"},
            {"label": "Letters of recommendation", "value": "1 counselor + 1 teacher"},
            {"label": "Standardized testing", "value": "Test-flexible"},
            {"label": "Interview", "value": "Not offered"},
        ],
        accept_rate_trend=[{"year": "2022", "rate": 12.8}, {"year": "2023", "rate": 9.9}, {"year": "2024", "rate": 8.4}, {"year": "2025", "rate": 7.7}],
        website="https://www.nyu.edu", id_override="uni-nyu",
    ),
    build(
        name="The University of Tokyo", short_name="UTokyo", country="Japan", city="Tokyo",
        national_ranking=1, world_ranking=28, acceptance_rate=34, min_gpa=3.5, sat_low=1350, sat_high=1520,
        act_min=29, act_max=33, ielts_min=6.5, toefl_min=90, tuition_per_year_usd=5500, living_cost_per_year_usd=12000,
        scholarship_available=True, scholarship_coverage="MEXT scholarship for international students",
        application_deadline="Nov 20, 2026", decision_type="Regular Decision", tags=["Public", "Research", "Low tuition"],
        description="Japan's most prestigious university, offering an increasing number of fully English-taught undergraduate programs.",
        requirements=[
            {"label": "PEAK program essays", "value": "2 essays + activities"},
            {"label": "Letters of recommendation", "value": "2 academic references"},
            {"label": "Standardized testing", "value": "SAT/IB/A-level accepted"},
            {"label": "Interview", "value": "Online interview round"},
        ],
        accept_rate_trend=[{"year": "2022", "rate": 38.0}, {"year": "2023", "rate": 36.0}, {"year": "2024", "rate": 35.0}, {"year": "2025", "rate": 34.0}],
        website="https://www.u-tokyo.ac.jp", id_override="uni-utokyo",
    ),
]

FEATURED_IDS = {row["id"] for row in FEATURED}

# ---------------------------------------------------------------------------
# Bulk country catalogs — real, named institutions with formula-estimated
# stats (explicitly allowed per spec where exact figures aren't sourced).
# ---------------------------------------------------------------------------

US_REST = [
    ("Harvard University", "Cambridge, MA"), ("Princeton University", "Princeton, NJ"),
    ("Yale University", "New Haven, CT"), ("Columbia University", "New York, NY"),
    ("University of Chicago", "Chicago, IL"), ("University of Pennsylvania", "Philadelphia, PA"),
    ("Duke University", "Durham, NC"), ("Johns Hopkins University", "Baltimore, MD"),
    ("Northwestern University", "Evanston, IL"), ("Brown University", "Providence, RI"),
    ("Cornell University", "Ithaca, NY"), ("University of California, Los Angeles", "Los Angeles, CA"),
    ("Rice University", "Houston, TX"), ("Vanderbilt University", "Nashville, TN"),
    ("University of Notre Dame", "Notre Dame, IN"), ("University of Michigan", "Ann Arbor, MI"),
    ("Georgetown University", "Washington, DC"), ("Carnegie Mellon University", "Pittsburgh, PA"),
    ("University of Virginia", "Charlottesville, VA"), ("University of North Carolina at Chapel Hill", "Chapel Hill, NC"),
    ("University of Southern California", "Los Angeles, CA"), ("University of Texas at Austin", "Austin, TX"),
    ("University of California, San Diego", "San Diego, CA"), ("University of California, Davis", "Davis, CA"),
    ("University of California, Irvine", "Irvine, CA"), ("University of California, Santa Barbara", "Santa Barbara, CA"),
    ("University of Wisconsin-Madison", "Madison, WI"), ("University of Illinois Urbana-Champaign", "Urbana, IL"),
    ("Georgia Institute of Technology", "Atlanta, GA"), ("Purdue University", "West Lafayette, IN"),
    ("Ohio State University", "Columbus, OH"), ("Penn State University", "University Park, PA"),
    ("University of Washington", "Seattle, WA"), ("University of Florida", "Gainesville, FL"),
    ("Boston University", "Boston, MA"), ("Boston College", "Chestnut Hill, MA"),
    ("Tufts University", "Medford, MA"), ("University of Rochester", "Rochester, NY"),
    ("Case Western Reserve University", "Cleveland, OH"), ("Wake Forest University", "Winston-Salem, NC"),
    ("University of Miami", "Coral Gables, FL"), ("Northeastern University", "Boston, MA"),
    ("Rensselaer Polytechnic Institute", "Troy, NY"), ("University of Maryland", "College Park, MD"),
    ("University of Minnesota", "Minneapolis, MN"), ("Michigan State University", "East Lansing, MI"),
    ("University of Pittsburgh", "Pittsburgh, PA"), ("Indiana University Bloomington", "Bloomington, IN"),
    ("University of Iowa", "Iowa City, IA"), ("University of Colorado Boulder", "Boulder, CO"),
    ("Arizona State University", "Tempe, AZ"), ("University of Arizona", "Tucson, AZ"),
    ("Texas A&M University", "College Station, TX"), ("Virginia Tech", "Blacksburg, VA"),
    ("University of Georgia", "Athens, GA"), ("Florida State University", "Tallahassee, FL"),
    ("University of Utah", "Salt Lake City, UT"), ("University of Oregon", "Eugene, OR"),
]

UK_REST = [
    ("Imperial College London", "London"), ("University College London", "London"),
    ("London School of Economics", "London"), ("University of Edinburgh", "Edinburgh, Scotland"),
    ("University of Manchester", "Manchester"), ("King's College London", "London"),
    ("University of Bristol", "Bristol"), ("University of Warwick", "Coventry"),
    ("University of Glasgow", "Glasgow, Scotland"), ("Durham University", "Durham"),
    ("University of Southampton", "Southampton"), ("University of Birmingham", "Birmingham"),
    ("University of Sheffield", "Sheffield"), ("University of Leeds", "Leeds"),
    ("University of St Andrews", "St Andrews, Scotland"), ("University of Nottingham", "Nottingham"),
    ("Queen Mary University of London", "London"), ("University of York", "York"),
    ("Lancaster University", "Lancaster"), ("University of Exeter", "Exeter"),
    ("Cardiff University", "Cardiff, Wales"), ("Newcastle University", "Newcastle upon Tyne"),
    ("University of Liverpool", "Liverpool"), ("Queen's University Belfast", "Belfast, Northern Ireland"),
    ("University of Bath", "Bath"), ("University of Leicester", "Leicester"),
    ("Loughborough University", "Loughborough"), ("University of Sussex", "Brighton"),
    ("University of Reading", "Reading"), ("University of Aberdeen", "Aberdeen, Scotland"),
    ("Heriot-Watt University", "Edinburgh, Scotland"), ("University of Dundee", "Dundee, Scotland"),
    ("Royal Holloway, University of London", "Egham"), ("City, University of London", "London"),
    ("University of East Anglia", "Norwich"), ("University of Surrey", "Guildford"),
    ("Aston University", "Birmingham"), ("University of Strathclyde", "Glasgow, Scotland"),
    ("Swansea University", "Swansea, Wales"), ("University of Kent", "Canterbury"),
]

KAZAKHSTAN_REST = [
    ("Al-Farabi Kazakh National University", "Almaty"), ("L.N. Gumilyov Eurasian National University", "Astana"),
    ("Satbayev University", "Almaty"), ("KBTU (Kazakh-British Technical University)", "Almaty"),
    ("SDU University", "Kaskelen"), ("KIMEP University", "Almaty"),
    ("Kazakh National Medical University", "Almaty"), ("Kazakh National Agrarian Research University", "Almaty"),
    ("Abai Kazakh National Pedagogical University", "Almaty"), ("International Information Technology University", "Almaty"),
    ("Karaganda Medical University", "Karaganda"), ("Abylkas Saginov Karaganda Technical University", "Karaganda"),
    ("M. Auezov South Kazakhstan University", "Shymkent"), ("West Kazakhstan Marat Ospanov Medical University", "Aktobe"),
    ("S. Seifullin Kazakh Agrotechnical University", "Astana"), ("Turan University", "Almaty"),
    ("Almaty Technological University", "Almaty"), ("Ablai Khan University of International Relations and World Languages", "Almaty"),
    ("S. Toraighyrov Pavlodar State University", "Pavlodar"), ("D. Serikbayev East Kazakhstan Technical University", "Oskemen"),
]

CHINA_LIST = [
    ("Tsinghua University", "Beijing"), ("Peking University", "Beijing"), ("Fudan University", "Shanghai"),
    ("Shanghai Jiao Tong University", "Shanghai"), ("Zhejiang University", "Hangzhou"),
    ("University of Science and Technology of China", "Hefei"), ("Nanjing University", "Nanjing"),
    ("Wuhan University", "Wuhan"), ("Sun Yat-sen University", "Guangzhou"),
    ("Harbin Institute of Technology", "Harbin"), ("Xi'an Jiaotong University", "Xi'an"),
    ("Beihang University", "Beijing"), ("Tongji University", "Shanghai"),
    ("Renmin University of China", "Beijing"), ("Nankai University", "Tianjin"),
    ("Central South University", "Changsha"), ("Sichuan University", "Chengdu"),
    ("Huazhong University of Science and Technology", "Wuhan"), ("Southeast University", "Nanjing"),
    ("Xiamen University", "Xiamen"),
]

GERMANY_LIST = [
    ("Technical University of Munich", "Munich"), ("LMU Munich", "Munich"),
    ("Heidelberg University", "Heidelberg"), ("Humboldt University of Berlin", "Berlin"),
    ("Free University of Berlin", "Berlin"), ("RWTH Aachen University", "Aachen"),
    ("University of Tübingen", "Tübingen"), ("Karlsruhe Institute of Technology", "Karlsruhe"),
    ("University of Freiburg", "Freiburg"), ("University of Bonn", "Bonn"),
    ("University of Göttingen", "Göttingen"), ("University of Hamburg", "Hamburg"),
    ("TU Berlin", "Berlin"), ("University of Cologne", "Cologne"),
    ("University of Münster", "Münster"), ("Goethe University Frankfurt", "Frankfurt"),
    ("University of Stuttgart", "Stuttgart"), ("TU Dresden", "Dresden"),
    ("University of Erlangen-Nuremberg", "Erlangen"), ("University of Mannheim", "Mannheim"),
]

ITALY_LIST = [
    ("University of Bologna", "Bologna"), ("Sapienza University of Rome", "Rome"),
    ("Politecnico di Milano", "Milan"), ("University of Padua", "Padua"),
    ("University of Milan", "Milan"), ("Politecnico di Torino", "Turin"),
    ("University of Florence", "Florence"), ("University of Pisa", "Pisa"),
    ("University of Naples Federico II", "Naples"), ("University of Turin", "Turin"),
    ("Bocconi University", "Milan"), ("University of Trento", "Trento"),
    ("University of Rome Tor Vergata", "Rome"), ("University of Genoa", "Genoa"),
    ("University of Bari Aldo Moro", "Bari"), ("University of Verona", "Verona"),
    ("University of Pavia", "Pavia"), ("University of Siena", "Siena"),
    ("Sant'Anna School of Advanced Studies", "Pisa"), ("Scuola Normale Superiore di Pisa", "Pisa"),
]

SINGAPORE_REST = [
    ("Nanyang Technological University", "Singapore"), ("Singapore Management University", "Singapore"),
    ("Singapore University of Technology and Design", "Singapore"), ("Singapore Institute of Technology", "Singapore"),
    ("Singapore University of Social Sciences", "Singapore"),
]

JAPAN_REST = [
    ("Kyoto University", "Kyoto"), ("Osaka University", "Osaka"), ("Tohoku University", "Sendai"),
    ("Tokyo Institute of Technology", "Tokyo"), ("Nagoya University", "Nagoya"),
    ("Kyushu University", "Fukuoka"), ("Hokkaido University", "Sapporo"),
    ("Waseda University", "Tokyo"), ("Keio University", "Tokyo"),
    ("University of Tsukuba", "Tsukuba"), ("Hiroshima University", "Higashihiroshima"),
    ("Kobe University", "Kobe"), ("Chiba University", "Chiba"),
    ("Tokyo Medical and Dental University", "Tokyo"), ("Osaka Metropolitan University", "Osaka"),
    ("Yokohama National University", "Yokohama"), ("Nagoya Institute of Technology", "Nagoya"),
    ("Ritsumeikan University", "Kyoto"), ("Sophia University", "Tokyo"),
]

SOUTH_KOREA_LIST = [
    ("Seoul National University", "Seoul"), ("KAIST", "Daejeon"), ("Yonsei University", "Seoul"),
    ("Korea University", "Seoul"), ("POSTECH", "Pohang"), ("Sungkyunkwan University", "Seoul"),
    ("Hanyang University", "Seoul"), ("Kyung Hee University", "Seoul"), ("Sogang University", "Seoul"),
    ("Ewha Womans University", "Seoul"), ("Chung-Ang University", "Seoul"),
    ("Ulsan National Institute of Science and Technology", "Ulsan"),
    ("Gwangju Institute of Science and Technology", "Gwangju"), ("Pusan National University", "Busan"),
    ("Kyungpook National University", "Daegu"), ("Chonnam National University", "Gwangju"),
    ("Ajou University", "Suwon"), ("Konkuk University", "Seoul"), ("Dongguk University", "Seoul"),
    ("Hongik University", "Seoul"), ("Inha University", "Incheon"), ("Sejong University", "Seoul"),
    ("Sookmyung Women's University", "Seoul"), ("Kookmin University", "Seoul"), ("Hallym University", "Chuncheon"),
]


def build_bulk() -> list[dict]:
    rows: list[dict] = []

    rows += generate_country(
        "United States", US_REST, world_base=2, world_step=3.2, acc_base=4.0, acc_step=1.15,
        gpa_base=3.9, gpa_floor=3.35, sat_low_base=1560, sat_high_base=1610, sat_step=6,
        ielts=6.5, toefl=90, act_min=27, act_max=34, tuition=48000, living=18000,
        deadline="Jan 1, 2027", decision_type="Regular Decision", tags=["Research", "STEM", "Broad programs"],
        skip_ids=FEATURED_IDS,
    )
    rows += generate_country(
        "United Kingdom", UK_REST, world_base=8, world_step=6.5, acc_base=10.0, acc_step=1.8,
        gpa_base=3.75, gpa_floor=3.2, sat_low_base=1420, sat_high_base=1540, sat_step=8,
        ielts=6.5, toefl=88, act_min=28, act_max=33, tuition=32000, living=15000,
        deadline="Jan 25, 2027", decision_type="Rolling", tags=["Research", "UCAS", "Collegiate"],
        skip_ids=FEATURED_IDS,
    )
    rows += generate_country(
        "Kazakhstan", KAZAKHSTAN_REST, world_base=650, world_step=45, acc_base=25.0, acc_step=3.2,
        gpa_base=3.35, gpa_floor=2.8, sat_low_base=1050, sat_high_base=1280, sat_step=8,
        ielts=5.5, toefl=70, act_min=19, act_max=25, tuition=1800, living=3500,
        deadline="Jul 1, 2027", decision_type="Regular Decision", tags=["Public", "National exam (ENT)"],
        skip_ids=FEATURED_IDS,
    )
    rows += generate_country(
        "China", CHINA_LIST, world_base=15, world_step=8.5, acc_base=8.0, acc_step=1.6,
        gpa_base=3.8, gpa_floor=3.3, sat_low_base=1450, sat_high_base=1560, sat_step=8,
        ielts=6.5, toefl=90, act_min=29, act_max=34, tuition=6000, living=8000,
        deadline="Mar 1, 2027", decision_type="Regular Decision", tags=["Research", "Gaokao track"],
        skip_ids=FEATURED_IDS,
    )
    rows += generate_country(
        "Germany", GERMANY_LIST, world_base=28, world_step=8.0, acc_base=14.0, acc_step=2.4,
        gpa_base=3.6, gpa_floor=3.1, sat_low_base=1330, sat_high_base=1480, sat_step=8,
        ielts=6.5, toefl=88, act_min=27, act_max=32, tuition=1500, living=11000,
        deadline="Jul 15, 2027", decision_type="Rolling", tags=["Public", "Low tuition"],
        skip_ids=FEATURED_IDS,
    )
    rows += generate_country(
        "Italy", ITALY_LIST, world_base=160, world_step=18.0, acc_base=30.0, acc_step=2.6,
        gpa_base=3.4, gpa_floor=2.9, sat_low_base=1200, sat_high_base=1400, sat_step=8,
        ielts=6.0, toefl=80, act_min=24, act_max=29, tuition=3500, living=10000,
        deadline="Aug 1, 2027", decision_type="Rolling", tags=["Public", "TOLC admissions test"],
        skip_ids=FEATURED_IDS,
    )
    rows += generate_country(
        "Singapore", SINGAPORE_REST, world_base=11, world_step=15.0, acc_base=20.0, acc_step=3.0,
        gpa_base=3.7, gpa_floor=3.4, sat_low_base=1380, sat_high_base=1520, sat_step=10,
        ielts=6.5, toefl=90, act_min=30, act_max=34, tuition=27000, living=10000,
        deadline="Mar 1, 2027", decision_type="Regular Decision", tags=["STEM", "Public"],
        skip_ids=FEATURED_IDS,
    )
    rows += generate_country(
        "Japan", JAPAN_REST, world_base=48, world_step=10.0, acc_base=30.0, acc_step=2.6,
        gpa_base=3.5, gpa_floor=3.1, sat_low_base=1300, sat_high_base=1470, sat_step=8,
        ielts=6.0, toefl=80, act_min=25, act_max=30, tuition=6000, living=11000,
        deadline="Nov 20, 2026", decision_type="Regular Decision", tags=["Public", "EJU track"],
        skip_ids=FEATURED_IDS,
    )
    rows += generate_country(
        "South Korea", SOUTH_KOREA_LIST, world_base=32, world_step=9.0, acc_base=18.0, acc_step=2.4,
        gpa_base=3.65, gpa_floor=3.2, sat_low_base=1380, sat_high_base=1510, sat_step=8,
        ielts=6.0, toefl=85, act_min=27, act_max=32, tuition=8000, living=9500,
        deadline="Sep 15, 2027", decision_type="Rolling", tags=["Research", "CSAT track"],
        skip_ids=FEATURED_IDS,
    )

    return rows


async def seed() -> None:
    all_rows = FEATURED + build_bulk()
    seen_ids: set[str] = set()
    deduped = []
    for row in all_rows:
        if row["id"] in seen_ids:
            continue
        seen_ids.add(row["id"])
        deduped.append(row)

    session: AsyncSession
    async with AsyncSessionLocal() as session:
        existing_ids = set((await session.scalars(select(University.id))).all())

        inserted = 0
        updated = 0
        for row in deduped:
            if row["id"] in existing_ids:
                await session.merge(University(**row))
                updated += 1
            else:
                session.add(University(**row))
                inserted += 1

        await session.commit()

    by_country: dict[str, int] = {}
    for row in deduped:
        by_country[row["country"]] = by_country.get(row["country"], 0) + 1

    print(f"Seed complete: {inserted} inserted, {updated} updated, {len(deduped)} total rows.")
    for country, count in sorted(by_country.items(), key=lambda kv: -kv[1]):
        print(f"  {country}: {count}")


if __name__ == "__main__":
    asyncio.run(seed())
