import type { MatchCategory } from "@/types/domain";

export type ChanceConfidence = "low" | "medium" | "high";

/**
 * An admission-chance estimate for one student at one university. `source`
 * says where the number came from: the model ("ai"), or the plain formula
 * ("math") when the model was unavailable or there was too little to ask it.
 * Either way the number is an estimate, and the UI says so.
 */
export interface ChanceEstimate {
  universityId: string;
  /** Whole percent, 1–97. */
  probability: number;
  category: MatchCategory;
  confidence: ChanceConfidence;
  /** What raises the chances, in the interface language. */
  positives: string[];
  /** What lowers them. */
  negatives: string[];
  summary: string;
  source: "ai" | "math";
  /** The formula's own view, shown next to the AI's as a reference. */
  math: { fit: number; probability: number };
  /** True when calibration moved the model's number into a believable range. */
  adjusted: boolean;
  generatedAt: string;
}
