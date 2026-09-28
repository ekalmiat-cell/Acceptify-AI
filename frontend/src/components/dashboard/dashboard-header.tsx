"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Mail, MessageSquareText, Send } from "lucide-react";
import { Fragment } from "react";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { siteConfig } from "@/config/site";
import { defineCopy } from "@/lib/i18n/core";
import { useCopy } from "@/lib/i18n/client";

const copy = defineCopy({
  en: {
    segments: {
      dashboard: "Overview",
      universities: "Universities",
      analysis: "Analysis",
      essays: "Essay Studio",
      training: "Training",
      portfolio: "Portfolio",
      profile: "Profile",
      methodology: "Methodology",
      "field-of-study": "Field of study",
      admin: "Admin",
      settings: "Settings",
    } as Record<string, string>,
    drill: "Drill",
    yourSentence: "Your sentence",
    notifications: "Notifications",
    noNotifications: "No notifications yet",
    freePlan: "Free plan",
    feedback: "Feedback",
    feedbackTitle: "Found a bug or have an idea?",
    feedbackNote: "Acceptify is in beta — every message is read by the founder and helps decide what to fix next.",
  },
  ru: {
    segments: {
      dashboard: "Обзор",
      universities: "Университеты",
      analysis: "Анализ",
      essays: "Эссе-студия",
      training: "Тренировка",
      portfolio: "Портфолио",
      profile: "Профиль",
      methodology: "Методология",
      "field-of-study": "Направление",
      admin: "Админка",
      settings: "Настройки",
    },
    drill: "Упражнение",
    yourSentence: "Твоё предложение",
    notifications: "Уведомления",
    noNotifications: "Уведомлений пока нет",
    freePlan: "Бесплатный план",
    feedback: "Отзыв",
    feedbackTitle: "Есть ошибка или идея?",
    feedbackNote: "Acceptify в бете — каждое сообщение читает основатель, и оно помогает решить, что чинить дальше.",
  },
});

export function DashboardHeader() {
  const t = useCopy(copy);
  const pathname = usePathname() ?? "";
  const segments = pathname.split("/").filter(Boolean);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-md">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mr-1 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {segments.map((segment, index) => {
            const href = "/" + segments.slice(0, index + 1).join("/");
            const isLast = index === segments.length - 1;
            const label =
              t.segments[segment] ??
              // Training drills have ids, not names; one from the student's own essay says so.
              (segments[index - 1] === "training" ? (segment.startsWith("own-") ? t.yourSentence : t.drill) : null) ??
              segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

            return (
              <Fragment key={href}>
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink render={<Link href={href} />}>
                      {label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-1">
        <FeedbackMenu />
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-sm" className="relative" />}
          >
            <Bell />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{t.notifications}</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              {t.noNotifications}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        <Badge variant="outline" className="hidden sm:inline-flex">
          {t.freePlan}
        </Badge>
      </div>
    </header>
  );
}

/**
 * The beta's feedback channel: a direct line to the person building
 * Acceptify, reachable from every dashboard page.
 */
function FeedbackMenu() {
  const t = useCopy(copy);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="gap-1.5" />}>
        <MessageSquareText />
        <span className="hidden sm:inline">{t.feedback}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t.feedbackTitle}</DropdownMenuLabel>
          <p className="px-1.5 pb-2 text-xs text-muted-foreground">{t.feedbackNote}</p>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={<a href={siteConfig.contact.telegramUrl} target="_blank" rel="noreferrer" />}
        >
          <Send />
          Telegram {siteConfig.contact.telegram}
        </DropdownMenuItem>
        <DropdownMenuItem
          render={<a href={`mailto:${siteConfig.contact.email}?subject=Acceptify%20feedback`} />}
        >
          <Mail />
          {siteConfig.contact.email}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
