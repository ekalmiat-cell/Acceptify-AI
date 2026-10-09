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
import { groupName } from "@/lib/catalog-copy";
import { defineCopy } from "@/lib/i18n/core";
import { getLocale } from "@/lib/i18n/server";

const copy = defineCopy({
  en: {
    title: "Profile",
    subtitle: "The full picture we use to compute your admission predictions.",
    yourName: "Your name",
    groups: {
      Credentials: "Research, publications, and community impact",
      Competitions: "Olympiads, hackathons, and competitive builds",
      Activities: "Leadership and extracurricular involvement",
      Talents: "Athletics and creative pursuits",
    } as Record<string, string>,
  },
  ru: {
    title: "Профиль",
    subtitle: "Полная картина, по которой мы считаем твои прогнозы поступления.",
    yourName: "Твоё имя",
    groups: {
      Credentials: "Исследования, публикации и общественный вклад",
      Competitions: "Олимпиады, хакатоны и соревнования",
      Activities: "Лидерство и внеучебная жизнь",
      Talents: "Спорт и творчество",
    },
  },
});

export async function generateMetadata(): Promise<Metadata> {
  return { title: copy[await getLocale()].title };
}

const groups: AchievementCatalogItem["group"][] = ["Credentials", "Competitions", "Activities", "Talents"];

export default async function ProfilePage() {
  const [session, academic, records, universities, locale] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    getAcademicProfile(),
    getAchievementRecords(),
    getUniversities(),
    getLocale(),
  ]);
  const t = copy[locale];
  const user = session?.user;
  const achievements = resolveAchievements(records);
  const completeness = computeProfileCompleteness(academic, achievements);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      <ProfileHeaderCard
        name={user?.name ?? t.yourName}
        email={user?.email ?? ""}
        createdAt={user?.createdAt ? new Date(user.createdAt) : undefined}
        profileCompleteness={completeness}
      />

      <AcademicProfileForm profile={academic} />

      <DreamUniversitySelect profile={academic} universities={universities} />

      {groups.map((group) => {
        const items = achievements.filter((a) => a.group === group);
        if (items.length === 0) return null;
        return (
          <section key={group} className="flex flex-col gap-4">
            <div>
              <h2 className="font-heading text-lg font-semibold text-foreground">{groupName(group, locale)}</h2>
              <p className="text-sm text-muted-foreground">{t.groups[group]}</p>
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
