import { deleteEssayReview, getEssayReview } from "@/lib/data/essays";
import { HttpError, json, noContent, parseUuid, requireUser, route } from "@/lib/route";

type Context = { params: Promise<{ essayId: string }> };

const NOT_FOUND = "Essay review not found.";

export const GET = route<Context>(async (_request, { params }) => {
  const user = await requireUser();
  const id = parseUuid((await params).essayId, NOT_FOUND);

  const review = await getEssayReview(user.id, id);
  if (!review) throw new HttpError(404, NOT_FOUND);
  return json(review);
});

/** Permanently deletes one of the user's own reviews. */
export const DELETE = route<Context>(async (_request, { params }) => {
  const user = await requireUser();
  const id = parseUuid((await params).essayId, NOT_FOUND);

  if (!(await deleteEssayReview(user.id, id))) throw new HttpError(404, NOT_FOUND);
  return noContent();
});
