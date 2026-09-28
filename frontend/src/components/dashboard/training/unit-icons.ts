import { Eye, Lightbulb, Mic, Scissors, Zap, type LucideIcon } from "lucide-react";

import type { UnitKey } from "@/lib/training/drills";

export const UNIT_ICON: Record<UnitKey, LucideIcon> = {
  hook: Zap,
  specificity: Eye,
  reflection: Lightbulb,
  voice: Mic,
  concise: Scissors,
};
