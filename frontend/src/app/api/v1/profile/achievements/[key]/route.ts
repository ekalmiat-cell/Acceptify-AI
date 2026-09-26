import { saveAchievement } from "@/lib/data/profile";
import { HttpError, json, readJson, requireUser, route } from "@/lib/route";
import { achievementSchema, isAchievementKey } from "@/lib/validation";

export const PUT = route<{ params: Promise<{ key: string }> }>(async (request, { params }) => {
  const user = await requireUser();
  const { key } = await params;

  if (!isAchievementKey(key)) {
    throw new HttpError(404, "Unknown achievement.");
  }

  const record = await readJson(request, achievementSchema);
  return json(await saveAchievement(user.id, key, record));
});
