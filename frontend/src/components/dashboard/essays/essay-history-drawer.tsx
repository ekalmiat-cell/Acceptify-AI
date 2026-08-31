"use client";

import { useState } from "react";
import { Clock, Trash2, FileText, Sparkles, ChevronRight } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { EssayReviewSummaryRead } from "@/types/essay";

interface EssayHistoryDrawerProps {
  history: EssayReviewSummaryRead[];
  onSelectReview: (id: string) => void;
  onDeleteReview: (id: string) => void;
  isDeletingId?: string | null;
}

export function EssayHistoryDrawer({
  history,
  onSelectReview,
  onDeleteReview,
  isDeletingId,
}: EssayHistoryDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="outline" size="sm" className="gap-1.5" />}>
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span>Review History ({history.length})</span>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-6">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            Previous Essay Reviews
          </SheetTitle>
          <SheetDescription className="text-xs">
            Revisit past AI evaluations and track your draft revisions.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground space-y-2">
              <Sparkles className="h-8 w-8 mx-auto text-muted-foreground/50" />
              <p className="text-sm font-medium">No previous reviews yet</p>
              <p className="text-xs">Your analyzed essays will appear here automatically.</p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-xl border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div
                    onClick={() => {
                      onSelectReview(item.id);
                      setOpen(false);
                    }}
                    className="cursor-pointer flex-1 space-y-1"
                  >
                    <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {item.title || "Untitled Essay"}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {item.essay_snippet}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-xs font-bold ${
                        item.overall_score >= 80
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-400"
                          : item.overall_score >= 65
                          ? "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/50 dark:text-blue-400"
                          : "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/50 dark:text-amber-400"
                      }`}
                    >
                      {item.overall_score}/100
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>{item.word_count} words</span>
                    <span>•</span>
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteReview(item.id)}
                      disabled={isDeletingId === item.id}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onSelectReview(item.id);
                        setOpen(false);
                      }}
                      className="h-7 px-2 text-xs gap-1 font-medium text-primary hover:text-primary"
                    >
                      <span>View</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
