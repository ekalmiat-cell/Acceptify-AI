import { getOutcomeSummary } from "@/lib/data/predictions";
import { json, requireUser, route } from "@/lib/route";

/** Platform-wide calibration counts — nothing that identifies anyone. */
export const GET = route(async () => {
  await requireUser();
  return json(await getOutcomeSummary());
});
