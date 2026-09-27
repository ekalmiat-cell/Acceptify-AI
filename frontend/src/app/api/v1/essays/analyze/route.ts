import { buildStudentContext, buildUniversityContext } from "@/lib/ai/context";
import { reviewEssay, type PreviousDraft } from "@/lib/ai/essay-review";
import { assertAiAvailable } from "@/lib/ai/gemini";
import { withAiErrorLog } from "@/lib/data/ai-errors";
import { consumeAiAllowance } from "@/lib/data/ai-usage";
import { createEssayReview, getEssayReview } from "@/lib/data/essays";
import { universityExists } from "@/lib/data/universities";
import { HttpError, json, readJson, requireUser, route } from "@/lib/route";
import { essayAnalyzeSchema } from "@/lib/validation";
import { isReviewV2 } from "@/types/essay";

// A thorough review of a long essay can take the model a while.
export const maxDuration = 120;

/** Reviews an admissions essay with the AI and saves the result. */
export const POST = route(async (request) =>
  withAiErrorLog("essay_review", async () => {
    const user = await requireUser();
    const input = await readJson(request, essayAnalyzeSchema);

    if (input.university_id && !(await universityExists(input.university_id))) {
      throw new HttpError(422, "That university is not in the catalog.");
    }

    // A revision is compared with the student's own previous draft — looked
    // up by owner, so another user's review id finds nothing.
    let previous: PreviousDraft | null = null;
    if (input.parent_id) {
      const parent = await getEssayReview(user.id, input.parent_id);
      if (!parent) throw new HttpError(404, "The previous draft was not found.");
      const analysis = parent.analysis_result;
      previous = {
        text: parent.essay_text,
        score: parent.overall_score,
        stillToFix: isReviewV2(analysis)
          ? analysis.path_to_90.map((step) => step.change)
          : analysis.weaknesses.slice(0, 4),
      };
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
      previous,
      language: input.feedback_language,
    });

    const review = await createEssayReview({
      userId: user.id,
      universityId: input.university_id,
      programId: input.program_id,
      title: input.title,
      promptText: input.prompt_text,
      essayText: input.essay_text,
      analysis,
      parentId: input.parent_id,
    });

    return json(review, 201);
  }),
);
