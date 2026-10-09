"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FIELDS_OF_STUDY } from "@/lib/fields-of-study";
import { createProgram, deleteProgram } from "@/lib/programs-client";
import type { Program, University } from "@/types/domain";
import { describeApiError } from "@/lib/api-error";
import { fieldName } from "@/lib/catalog-copy";
import { defineCopy } from "@/lib/i18n/core";
import { useLocale } from "@/lib/i18n/client";

const copy = defineCopy({
  en: {
    added: (name: string, university: string) => `${name} added to ${university}`,
    createFailed: "Could not create this program.",
    removed: (name: string) => `${name} removed`,
    deleteFailed: "Could not delete this program.",
    all: "All universities",
    programs: (university: string) => `${university} — Programs`,
    intro: "Each program has its own evaluation profile — the weights that decide how a student's profile is scored into a fit score.",
    addTitle: "Add a program",
    addNote: "Creates a new Program with a default-weighted evaluation profile.",
    name: "Program name",
    namePlaceholder: "e.g. Computer Science",
    field: "Field of study",
    chooseField: "Choose a field",
    add: "Add program",
    list: (n: number) => `Programs (${n})`,
    listNote: "Click a program to edit its evaluation weights.",
    empty: (university: string) =>
      `No programs yet — add one above, or one will be created automatically the first time a student picks this field of study for ${university}.`,
    delete: (name: string) => `Delete ${name}`,
  },
  ru: {
    added: (name: string, university: string) => `Программа «${name}» добавлена в ${university}`,
    createFailed: "Не удалось создать программу.",
    removed: (name: string) => `Программа «${name}» удалена`,
    deleteFailed: "Не удалось удалить программу.",
    all: "Все университеты",
    programs: (university: string) => `${university} — программы`,
    intro: "У каждой программы свой профиль оценки — веса, по которым профиль ученика превращается в балл соответствия.",
    addTitle: "Добавить программу",
    addNote: "Создаёт новую программу с профилем оценки по умолчанию.",
    name: "Название программы",
    namePlaceholder: "например, Computer Science",
    field: "Направление",
    chooseField: "Выбери направление",
    add: "Добавить",
    list: (n: number) => `Программы (${n})`,
    listNote: "Нажми на программу, чтобы изменить её веса.",
    empty: (university: string) =>
      `Программ пока нет — добавь выше, или программа создастся автоматически, когда ученик впервые выберет это направление в ${university}.`,
    delete: (name: string) => `Удалить ${name}`,
  },
});

export function AdminProgramList({
  university,
  programs,
}: {
  university: University;
  programs: Program[];
}) {
  const locale = useLocale();
  const t = copy[locale];
  const router = useRouter();
  const [name, setName] = useState("");
  const [field, setField] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleCreate() {
    if (!name.trim() || !field) return;
    setIsCreating(true);
    try {
      await createProgram({ universityId: university.id, name: name.trim(), field });
      toast.success(t.added(name, university.shortName));
      setName("");
      setField("");
      router.refresh();
    } catch (error) {
      toast.error(describeApiError(error, t.createFailed));
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDelete(programId: string, programName: string) {
    setDeletingId(programId);
    try {
      await deleteProgram(programId);
      toast.success(t.removed(programName));
      router.refresh();
    } catch (error) {
      toast.error(describeApiError(error, t.deleteFailed));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/dashboard/admin"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-3.5" />
          {t.all}
        </Link>
        <h1 className="mt-2 font-display text-[1.65rem] leading-tight font-bold tracking-tight">
          {t.programs(university.name)}
        </h1>
        <p className="text-sm text-muted-foreground">{t.intro}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.addTitle}</CardTitle>
          <CardDescription>{t.addNote}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="program-name">{t.name}</Label>
            <Input
              id="program-name"
              placeholder={t.namePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid flex-1 gap-2">
            <Label>{t.field}</Label>
            <Select value={field} onValueChange={(v) => setField(v as string)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t.chooseField}>
                  {(value: string) => (value ? fieldName(value, locale) : t.chooseField)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {FIELDS_OF_STUDY.map((f) => (
                  <SelectItem key={f} value={f}>
                    {fieldName(f, locale)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCreate} disabled={!name.trim() || !field || isCreating}>
            {isCreating ? <Loader2 className="animate-spin" /> : <Plus />}
            {t.add}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.list(programs.length)}</CardTitle>
          <CardDescription>{t.listNote}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {programs.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t.empty(university.shortName)}</p>
          ) : (
            programs.map((program) => (
              <div
                key={program.id}
                className="group flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted"
              >
                <Link href={`/dashboard/admin/${university.id}/${program.id}`} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{program.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{fieldName(program.field, locale)}</p>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  disabled={deletingId === program.id}
                  onClick={() => handleDelete(program.id, program.name)}
                  aria-label={t.delete(program.name)}
                >
                  {deletingId === program.id ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </Button>
                <Link href={`/dashboard/admin/${university.id}/${program.id}`} className="shrink-0">
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
