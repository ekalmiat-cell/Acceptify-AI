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
import { revalidateReferenceData } from "@/lib/reference-actions";

export function AdminProgramList({
  university,
  programs,
}: {
  university: University;
  programs: Program[];
}) {
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
      toast.success(`${name} added to ${university.shortName}`);
      setName("");
      setField("");
      await revalidateReferenceData();
      router.refresh();
    } catch (error) {
      toast.error(describeApiError(error, "Could not create this program."));
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDelete(programId: string, programName: string) {
    setDeletingId(programId);
    try {
      await deleteProgram(programId);
      toast.success(`${programName} removed`);
      await revalidateReferenceData();
      router.refresh();
    } catch (error) {
      toast.error(describeApiError(error, "Could not delete this program."));
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
          All universities
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
          {university.name} — Programs
        </h1>
        <p className="text-sm text-muted-foreground">
          Each program has its own evaluation profile — the weights that decide how a student&apos;s
          profile is scored for admission chance.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add a program</CardTitle>
          <CardDescription>Creates a new Program with a default-weighted evaluation profile.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="program-name">Program name</Label>
            <Input
              id="program-name"
              placeholder="e.g. Computer Science"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid flex-1 gap-2">
            <Label>Field of study</Label>
            <Select value={field} onValueChange={(v) => setField(v as string)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a field" />
              </SelectTrigger>
              <SelectContent>
                {FIELDS_OF_STUDY.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCreate} disabled={!name.trim() || !field || isCreating}>
            {isCreating ? <Loader2 className="animate-spin" /> : <Plus />}
            Add program
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Programs ({programs.length})</CardTitle>
          <CardDescription>Click a program to edit its evaluation weights.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {programs.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No programs yet — add one above, or one will be created automatically the first time a
              student picks this field of study for {university.shortName}.
            </p>
          ) : (
            programs.map((program) => (
              <div
                key={program.id}
                className="group flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted"
              >
                <Link href={`/dashboard/admin/${university.id}/${program.id}`} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{program.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{program.field}</p>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  disabled={deletingId === program.id}
                  onClick={() => handleDelete(program.id, program.name)}
                  aria-label={`Delete ${program.name}`}
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
