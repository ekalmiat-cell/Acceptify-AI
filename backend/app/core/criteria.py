"""The canonical set of admission-criterion keys an EvaluationWeight row can
score against. Shared by the Program evaluation-profile schemas/endpoints and
mirrored 1:1 in the frontend (`frontend/src/lib/criteria.ts`) — both sides
must stay in sync since criterion keys are also used as achievement keys
(see `app/models/achievement.py`).
"""

ACADEMIC_CRITERIA: list[str] = ["gpa", "sat", "act", "ielts", "toefl", "ent"]

ACHIEVEMENT_CRITERIA: list[str] = [
    "ap",
    "ib",
    "aLevel",
    "honors",
    "research",
    "publications",
    "olympiads",
    "hackathons",
    "startup",
    "business",
    "leadership",
    "mun",
    "debate",
    "communityService",
    "sports",
    "music",
    "arts",
    "awards",
    "recommendationLetters",
    "personalEssay",
]

ALL_CRITERIA: list[str] = [*ACADEMIC_CRITERIA, *ACHIEVEMENT_CRITERIA]

# Seed weights for a newly-created evaluation profile (e.g. the first time a
# student picks a field of study for a university that has no admin-curated
# profile yet). Deliberately approximates the platform's old fixed weights
# (40/25/15/20 academic/activities/leadership/achievements split) so scores
# don't jump when a profile is auto-created — admins can then tune it per
# program from there. Never read by the scoring engine directly; only used
# to populate EvaluationWeight rows at creation time.
DEFAULT_WEIGHTS: dict[str, float] = {
    "gpa": 10,
    "sat": 9,
    "act": 7,
    "ielts": 5,
    "toefl": 4,
    "ent": 5,
    "ap": 2,
    "ib": 2,
    "aLevel": 1,
    "honors": 2,
    "research": 3,
    "publications": 2,
    "olympiads": 7,
    "hackathons": 6,
    "startup": 6,
    "business": 6,
    "leadership": 4,
    "mun": 3,
    "debate": 3,
    "communityService": 3,
    "sports": 2,
    "music": 2,
    "arts": 2,
    "awards": 2,
    "recommendationLetters": 2,
    "personalEssay": 3,
}
