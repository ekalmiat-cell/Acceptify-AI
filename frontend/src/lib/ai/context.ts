import "server-only";

import { getProgram } from "@/lib/data/programs";
import { listPredictions } from "@/lib/data/predictions";
import { getAcademicProfile, listAchievements } from "@/lib/data/profile";
import { getUniversities } from "@/lib/data/universities";
import type { StudentContext, UniversityContext } from "@/lib/ai/essay-review";

/**
 * What the AI features are told about the student and their target. Built
 * from the database, and never containing anything that identifies the
 * person — no name, email or user id is ever sent to the model.
 */

export async function buildUniversityContext(
  universityId: string | null,
  programId: string | null,
): Promise<UniversityContext | null> {
  if (!universityId) return null;

  const university = (await getUniversities()).find((u) => u.id === universityId);
  if (!university) return null;

  const program = programId ? await getProgram(programId) : null;
  return {
    name: university.name,
    programName: program && program.universityId === universityId ? program.name : null,
    selectivityLevel: university.selectivityLevel,
    tags: university.tags,
  };
}

export async function buildStudentContext(userId: string): Promise<StudentContext | null> {
  const [profile, achievements] = await Promise.all([
    getAcademicProfile(userId),
    listAchievements(userId),
  ]);

  const program = profile.dreamProgramId ? await getProgram(profile.dreamProgramId) : null;
  const achieved = achievements.filter((a) => a.achieved).map((a) => a.key);

  if (!program && achieved.length === 0) return null;
  return { field: program?.field ?? null, achievements: achieved.slice(0, 10) };
}

/** A plain-text summary of the student for the copilot's system prompt. */
export async function buildCopilotContext(userId: string): Promise<string> {
  const [profile, achievements, predictions, universities] = await Promise.all([
    getAcademicProfile(userId),
    listAchievements(userId),
    listPredictions(userId),
    getUniversities(),
  ]);
  const nameOf = (id: string) => universities.find((u) => u.id === id)?.name ?? id;

  const parts: string[] = [];

  const scores = [
    profile.gpa !== null && `GPA: ${profile.gpa}`,
    profile.satScore !== null && `SAT: ${profile.satScore}`,
    profile.actScore !== null && `ACT: ${profile.actScore}`,
    profile.ieltsScore !== null && `IELTS: ${profile.ieltsScore}`,
    profile.toeflScore !== null && `TOEFL: ${profile.toeflScore}`,
    profile.entScore !== null && `ENT: ${profile.entScore}`,
  ].filter(Boolean);
  if (scores.length) parts.push(`Academic Scores: ${scores.join(", ")}`);

  if (profile.dreamUniversityId) {
    const dream = universities.find((u) => u.id === profile.dreamUniversityId);
    if (dream) parts.push(`Dream University: ${dream.name} (${dream.country})`);
  }

  if (profile.dreamProgramId) {
    const program = await getProgram(profile.dreamProgramId);
    if (program) parts.push(`Intended Field of Study: ${program.field}`);
  }

  const achieved = achievements.filter((a) => a.achieved).map((a) => a.key);
  if (achieved.length) parts.push(`Recorded Achievements: ${achieved.slice(0, 12).join(", ")}`);

  if (predictions.length) {
    const recent = predictions
      .slice(0, 5)
      .map((p) => `${nameOf(p.universityId)} (Fit Score: ${p.matchScore}%, Category: ${p.category})`);
    parts.push(`Recent University Analyses: ${recent.join("; ")}`);
  }

  return parts.length ? parts.join("\n") : "No profile data filled yet.";
}
