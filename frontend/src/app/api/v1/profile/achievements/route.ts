import { listAchievements } from "@/lib/data/profile";
import { json, requireUser, route } from "@/lib/route";

export const GET = route(async () => {
  const user = await requireUser();
  return json(await listAchievements(user.id));
});
