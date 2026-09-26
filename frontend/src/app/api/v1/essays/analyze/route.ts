import { buildStudentContext, buildUniversityContext } from "@/lib/ai/context";
import { reviewEssay } from "@/lib/ai/essay-review";
import { assertAiAvailable } from "@/lib/ai/gemini";
import { consumeAiAllowance } from "@/lib/data/ai-usage";
import { createEssayReview } from "@/lib/data/essays";
import { universityExists } from "@/lib/data/universities";
import { HttpError, json, readJson, requireUser, route } from "@/lib/route";
import { essayAnalyzeSchema } from "@/lib/validation";

// A thorough review of a long essay can take the model a while.
export const maxDuration = 120;

/** Reviews an admissions essay with the AI and saves the result. */
export const POST = route(async (request) => {
  const user = await requireUser();
  const input = await readJson(request, essayAnalyzeSchema);

  if (input.university_id && !(await universityExists(input.university_id))) {
    throw new HttpError(422, "That university is not in the catalog.");
  }

  assertAiAvailable();
  await consumeAiAllowance(user.id, "essay_review");

  const [university, student] = await Promise.all([
    buildUniversityContext(input.university_id, input.program_id),
    input.include_profile_context ? buildStudentContext(user.id) : Promise.resolve(null),
  ]);

  const analysis = await reviewEssay({
    essayText: input.essay_text,
    promptText: input.prompt_text,
    university,
    student,
  });

  const review = await createEssayReview({
    userId: user.id,
    universityId: input.university_id,
    programId: input.program_id,
    title: input.title,
    promptText: input.prompt_text,
    essayText: input.essay_text,
    analysis,
  });

  return json(review, 201);
});
