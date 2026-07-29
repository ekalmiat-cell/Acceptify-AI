/** The fixed list of fields a student can declare as their intended program
 * on the "Choose Your Intended Field of Study" step. Each value doubles as
 * `Program.field` in the backend once resolved into a real Program row —
 * see `lib/programs-client.ts`'s `resolveProgram`. */
export const FIELDS_OF_STUDY = [
  "Computer Science",
  "Data Science & AI",
  "Engineering",
  "Business Administration",
  "Economics & Finance",
  "Medicine",
  "Dentistry",
  "Pharmacy",
  "Law",
  "International Relations",
  "Political Science",
  "Psychology",
  "Biology",
  "Chemistry",
  "Physics",
  "Mathematics",
  "Environmental Science",
  "Architecture",
  "Journalism",
  "Marketing",
  "Accounting",
  "Education",
  "Arts & Design",
  "Music",
  "Hospitality & Tourism",
  "Agriculture",
  "Aviation",
  "Other",
] as const;

export type FieldOfStudy = (typeof FIELDS_OF_STUDY)[number];
