"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { achievementIconMap } from "@/components/profile/achievement-icon-map";
import { upsertAchievement } from "@/lib/profile-client";
import type { ResolvedAchievement } from "@/types/domain";
import { describeApiError } from "@/lib/api-error";

function parseEntries(value: string | null): string[] {
  return (value ?? "").split("\n").map((line) => line.trim()).filter(Boolean);
}

export function AchievementCard({ achievement }: { achievement: ResolvedAchievement }) {
  const router = useRouter();
  const Icon = achievementIconMap[achievement.icon];
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<string[]>(() => parseEntries(achievement.value));
  const [draft, setDraft] = useState("");
  const [level, setLevel] = useState(achievement.level ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const cardEntries = parseEntries(achievement.value);

  function addEntry() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setEntries((prev) => [...prev, trimmed]);
    setDraft("");
  }

  function removeEntry(index: number) {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await upsertAchievement(achievement.id, {
        achieved: entries.length > 0,
        value: entries.length > 0 ? entries.join("\n") : null,
        level: level.trim() || null,
      });
      toast.success(`${achievement.label} updated`);
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(describeApiError(error, "Could not update this achievement."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setEntries(parseEntries(achievement.value));
          setDraft("");
          setLevel(achievement.level ?? "");
        }
      }}
    >
      <DialogTrigger
        render={
          <button
            type="button"
            className={cn(
              "flex flex-col gap-3 rounded-2xl border p-4 text-left transition-colors hover:border-primary/30",
              achievement.achieved
                ? "border-border bg-card"
                : "border-dashed border-border bg-muted/30"
            )}
          />
        }
      >
        <div className="flex items-start justify-between gap-2">
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg",
              achievement.achieved ? "bg-brand/10 text-brand" : "bg-muted text-muted-foreground"
            )}
          >
            {Icon ? <Icon className="size-4.5" /> : null}
          </span>
          {achievement.level ? (
            <Badge variant="outline" className="shrink-0">
              {achievement.level}
            </Badge>
          ) : null}
        </div>

        <div>
          <p className="text-sm font-medium text-foreground">{achievement.label}</p>
          {cardEntries.length > 0 ? (
            <ul className="mt-0.5 flex flex-col gap-0.5 text-sm text-muted-foreground">
              {cardEntries.slice(0, 2).map((entry, i) => (
                <li key={i} className="truncate">
                  {i + 1}. {entry}
                </li>
              ))}
              {cardEntries.length > 2 ? (
                <li className="text-xs text-muted-foreground/70">
                  +{cardEntries.length - 2} more
                </li>
              ) : null}
            </ul>
          ) : (
            <p className="mt-0.5 text-sm text-muted-foreground/70 italic">Not started</p>
          )}
        </div>

        <Progress value={achievement.progress} className="mt-auto">
          <ProgressTrack>
            <ProgressIndicator className={achievement.achieved ? "bg-gradient-brand" : ""} />
          </ProgressTrack>
        </Progress>

        <p className="text-xs leading-relaxed text-muted-foreground">
          {achievement.description}
        </p>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{achievement.label}</DialogTitle>
          <DialogDescription>{achievement.description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="grid gap-2">
            <Label>Entries</Label>
            {entries.length > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {entries.map((entry, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-1.5 text-sm"
                  >
                    <span className="min-w-0 truncate">
                      {i + 1}. {entry}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeEntry(i)}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label="Remove entry"
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">Nothing added yet.</p>
            )}

            <div className="flex gap-2">
              <Input
                placeholder="e.g. Republican medal, Math olympiad"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addEntry();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addEntry} disabled={!draft.trim()}>
                <Plus />
                Add
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`${achievement.id}-level`}>Level (optional)</Label>
            <Input
              id={`${achievement.id}-level`}
              placeholder="e.g. National"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
