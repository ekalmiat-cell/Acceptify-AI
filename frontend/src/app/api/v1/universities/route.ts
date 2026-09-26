import { getUniversities } from "@/lib/data/universities";
import { json, route } from "@/lib/route";

/** The public university catalog. Reference data, so no sign-in required. */
export const GET = route(async () => json(await getUniversities()));
