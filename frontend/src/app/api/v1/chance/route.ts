import { estimateChance } from "@/lib/ai/chance";
import { isAdminUser } from "@/lib/admin";
import { getLocale } from "@/lib/i18n/server";
import { json, readJson, requireUser, route } from "@/lib/route";
import { chanceRequestSchema } from "@/lib/validation";

export const maxDuration = 60;

/**
 * The AI estimate of the student's chance at one university. Answers from the
 * cache whenever the same question was asked before; otherwise asks the model
 * (counted against the daily allowance), and falls back to the formula, saying
 * so in `notice`, when it cannot.
 */
export const POST = route(async (request) => {
  const user = await requireUser();
  const input = await readJson(request, chanceRequestSchema);

  const result = await estimateChance({
    userId: user.id,
    admin: isAdminUser(user),
    universityId: input.universityId,
    programId: input.programId,
    locale: await getLocale(),
    cacheOnly: input.cacheOnly,
  });
  return json(result);
});
