import { getAcademicProfile, saveAcademicProfile } from "@/lib/data/profile";
import { universityExists } from "@/lib/data/universities";
import { HttpError, json, readJson, requireUser, route } from "@/lib/route";
import { academicProfileSchema } from "@/lib/validation";

export const GET = route(async () => {
  const user = await requireUser();
  return json(await getAcademicProfile(user.id));
});

export const PUT = route(async (request) => {
  const user = await requireUser();
  const profile = await readJson(request, academicProfileSchema);

  if (profile.dreamUniversityId && !(await universityExists(profile.dreamUniversityId))) {
    throw new HttpError(422, "That university is not in the catalog.");
  }

  return json(await saveAcademicProfile(user.id, profile));
});
