import { listEssayReviews } from "@/lib/data/essays";
import { json, requireUser, route } from "@/lib/route";

/** The signed-in user's essay reviews, newest first. */
export const GET = route(async () => {
  const user = await requireUser();
  return json(await listEssayReviews(user.id));
});
