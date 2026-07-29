import type { AchievementCatalogItem } from "@/types/domain";

/**
 * Static definitions of the achievement types a student can record on their
 * profile. This is reference/config data (what an "Olympiad medal" entry
 * means), not per-user data — actual per-user records live in Postgres and
 * are fetched via `lib/profile-server.ts`.
 *
 * GPA, SAT, ACT, IELTS, TOEFL, and ENT aren't listed here: they're editable
 * directly on the academic profile form and feed the match prediction
 * engine as academic criteria instead of achievements.
 *
 * Every `id` here doubles as a criterion key in `lib/criteria.ts` — an
 * evaluation profile's per-program weight for e.g. "hackathons" is looked
 * up by this same string.
 */
export const achievementCatalog: AchievementCatalogItem[] = [
  {
    id: "ap",
    label: "AP Courses",
    group: "Credentials",
    icon: "BookOpen",
    description: "Advanced Placement exams taken and scored.",
  },
  {
    id: "ib",
    label: "IB Diploma",
    group: "Credentials",
    icon: "BookOpen",
    description: "International Baccalaureate diploma or coursework.",
  },
  {
    id: "aLevel",
    label: "A-Level",
    group: "Credentials",
    icon: "BookOpen",
    description: "GCE A-Level subjects and grades.",
  },
  {
    id: "honors",
    label: "Honors Courses",
    group: "Credentials",
    icon: "GraduationCap",
    description: "Honors-track or advanced coursework beyond the standard curriculum.",
  },
  {
    id: "research",
    label: "Research Experience",
    group: "Credentials",
    icon: "Microscope",
    description: "Independent or mentored research with a public output.",
  },
  {
    id: "publications",
    label: "Publications",
    group: "Credentials",
    icon: "FileText",
    description: "Papers, articles, or other published academic work.",
  },
  {
    id: "awards",
    label: "Awards",
    group: "Credentials",
    icon: "Award",
    description: "Academic or extracurricular awards and honors.",
  },
  {
    id: "recommendationLetters",
    label: "Recommendation Letters",
    group: "Credentials",
    icon: "Mail",
    description: "Strong letters of recommendation ready to submit.",
  },
  {
    id: "personalEssay",
    label: "Personal Essay",
    group: "Credentials",
    icon: "PenLine",
    description: "A polished personal statement or application essay.",
  },
  {
    id: "communityService",
    label: "Community Service",
    group: "Activities",
    icon: "HeartHandshake",
    description: "Sustained volunteer or community service work.",
  },
  {
    id: "olympiads",
    label: "Olympiads",
    group: "Competitions",
    icon: "Trophy",
    description: "Subject olympiads in Math, Physics, or other disciplines.",
  },
  {
    id: "hackathons",
    label: "Hackathons",
    group: "Competitions",
    icon: "Code2",
    description: "Team-based coding competitions and builds.",
  },
  {
    id: "startup",
    label: "Startup Competitions",
    group: "Competitions",
    icon: "Rocket",
    description: "Pitch competitions and startup accelerator programs.",
  },
  {
    id: "business",
    label: "Business Competitions",
    group: "Competitions",
    icon: "Briefcase",
    description: "Case competitions, business plan contests, trading games.",
  },
  {
    id: "leadership",
    label: "Leadership",
    group: "Activities",
    icon: "Users",
    description: "Formal leadership roles in clubs, councils, or projects.",
  },
  {
    id: "mun",
    label: "MUN",
    group: "Activities",
    icon: "Globe2",
    description: "Model United Nations conferences attended and awards won.",
  },
  {
    id: "debate",
    label: "Debate",
    group: "Activities",
    icon: "MessagesSquare",
    description: "Competitive debate leagues (e.g. WSDC, BP format).",
  },
  {
    id: "sports",
    label: "Sports",
    group: "Talents",
    icon: "Dumbbell",
    description: "Competitive athletics, team or individual.",
  },
  {
    id: "music",
    label: "Music",
    group: "Talents",
    icon: "Music",
    description: "Formal music training, certifications, or performances.",
  },
  {
    id: "arts",
    label: "Arts",
    group: "Talents",
    icon: "Palette",
    description: "Visual arts portfolio, exhibitions, or design work.",
  },
];
