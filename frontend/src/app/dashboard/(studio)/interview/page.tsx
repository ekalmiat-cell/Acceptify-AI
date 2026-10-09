import type { Metadata } from "next";

import { InterviewBank } from "@/components/dashboard/interview/interview-bank";
import { defineCopy } from "@/lib/i18n/core";
import { getLocale } from "@/lib/i18n/server";

const copy = defineCopy({
  en: {
    title: "Interview",
    description:
      "The questions admissions interviews keep asking, what interviewers listen for, and a timer to practise out loud.",
  },
  ru: {
    title: "Собеседование",
    description:
      "Вопросы, которые чаще всего задают на собеседованиях при поступлении, что в ответах хотят услышать, и таймер, чтобы тренироваться вслух.",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = copy[await getLocale()];
  return { title: t.title, description: t.description };
}

export default async function InterviewPage() {
  const t = copy[await getLocale()];
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-[1.65rem] leading-tight font-bold tracking-tight">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{t.description}</p>
      </div>
      <InterviewBank />
    </div>
  );
}
