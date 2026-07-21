import type { Metadata } from "next";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { ProfileHeaderCard } from "@/components/profile/profile-header-card";
import { AchievementCard } from "@/components/profile/achievement-card";
import { AcademicProfileForm } from "@/components/profile/academic-profile-form";
import { DreamUniversitySelect } from "@/components/profile/dream-university-select";
import { getAcademicProfile, getAchievementRecords } from "@/lib/profile-server";
import { getUniversities } from "@/lib/universities-server";
import { computeProfileCompleteness, resolveAchievements } from "@/lib/profile";
import type { AchievementCatalogItem } from "@/types/domain";

export const metadata: Metadata = {
  title: "Profile",
};

const groups: { id: AchievementCatalogItem["group"]; description: string }[] = [
  { id: "Credentials", description: "Research, publications, and community impact" },
  { id: "Competitions", description: "Olympiads, hackathons, and competitive builds" },
  { id: "Activities", description: "Leadership and extracurricular involvement" },
  { id: "Talents", description: "Athletics and creative pursuits" },
];

export default async function ProfilePage() {
  const [session, academic, records, universities] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    getAcademicProfile(),
    getAchievementRecords(),
    getUniversities(),
  ]);
  const user = session?.user;
  const achievements = resolveAchievements(records);
  const completeness = computeProfileCompleteness(academic, achievements);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          The full picture we use to compute your admission predictions.
        </p>
      </div>

      <ProfileHeaderCard
        name={user?.name ?? "Your name"}
        email={user?.email ?? ""}
        createdAt={user?.createdAt ? new Date(user.createdAt) : undefined}
        profileCompleteness={completeness}
      />

      <AcademicProfileForm profile={academic} />

      <DreamUniversitySelect profile={academic} universities={universities} />

      {groups.map((group) => {
        const items = achievements.filter((a) => a.group === group.id);
        if (items.length === 0) return null;
        return (
          <section key={group.id} className="flex flex-col gap-4">
            <div>
              <h2 className="font-heading text-lg font-semibold text-foreground">{group.id}</h2>
              <p className="text-sm text-muted-foreground">{group.description}</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {items.map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
