import { z } from "zod";

import { achievementCatalog } from "@/data/achievement-catalog";
import { ALL_CRITERIA } from "@/lib/criteria";

/**
 * Request-body schemas for the `/api/v1/*` routes. Ranges mirror the inputs
 * on the profile form, so anything the UI can send is accepted and anything
 * outside it is rejected with a message naming the field.
 */

const optionalScore = (min: number, max: number) =>
  z.number().min(min).max(max).nullable().optional().transform((value) => value ?? null);

const optionalInteger = (min: number, max: number) =>
  z.number().int().min(min).max(max).nullable().optional().transform((value) => value ?? null);

const optionalId = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .nullable()
  .optional()
  .transform((value) => value ?? null);

export const academicProfileSchema = z.object({
  gpa: optionalScore(0, 4),
  satScore: optionalInteger(400, 1600),
  actScore: optionalInteger(1, 36),
  ieltsScore: optionalScore(0, 9),
  toeflScore: optionalInteger(0, 120),
  entScore: optionalInteger(0, 140),
  dreamUniversityId: optionalId,
  dreamProgramId: optionalId,
});

const ACHIEVEMENT_KEYS = new Set(achievementCatalog.map((item) => item.id));

export function isAchievementKey(key: string): boolean {
  return ACHIEVEMENT_KEYS.has(key);
}

export const achievementSchema = z.object({
  achieved: z.boolean(),
  value: z.string().trim().max(500).nullable().optional().transform((v) => v || null),
  level: z.string().trim().max(100).nullable().optional().transform((v) => v || null),
});

export const predictionSchema = z.object({
  universityId: z.string().trim().min(1).max(200),
  matchScore: z.number().int().min(0).max(100),
  category: z.enum(["safe", "target", "reach"]),
  status: z.enum(["Saved", "Applied", "Considering", "Analyzed"]).default("Analyzed"),
});

export const outcomeSchema = z.object({
  outcome: z.enum(["admitted", "rejected", "waitlisted", "withdrawn"]),
});

const programName = z.string().trim().min(1).max(200);
const optionalText = (max: number) =>
  z.string().trim().max(max).nullable().optional().transform((v) => (v === undefined ? undefined : v || null));

export const programCreateSchema = z.object({
  universityId: z.string().trim().min(1).max(200),
  name: programName,
  field: programName,
  parentProgramId: optionalText(200),
  description: optionalText(5000),
});

export const programUpdateSchema = z.object({
  name: programName.optional(),
  field: programName.optional(),
  parentProgramId: optionalText(200),
  description: optionalText(5000),
});

const CRITERIA = new Set<string>(ALL_CRITERIA);

export const evaluationProfileSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: optionalText(5000),
  isActive: z.boolean().optional(),
  weights: z
    .array(
      z.object({
        criterionKey: z.string().refine((key) => CRITERIA.has(key), "Unknown criterion key"),
        weight: z.number().min(0).max(100),
      }),
    )
    .refine(
      (weights) => new Set(weights.map((w) => w.criterionKey)).size === weights.length,
      "Each criterion may appear only once",
    )
    .optional(),
});

export const MIN_ESSAY_WORDS = 25;

export const essayAnalyzeSchema = z.object({
  title: z.string().trim().max(200).optional().transform((v) => v || "Untitled Essay"),
  essay_text: z
    .string()
    .trim()
    .max(25_000, "The essay is too long (maximum 25,000 characters).")
    .refine(
      (text) => text.split(/\s+/).filter(Boolean).length >= MIN_ESSAY_WORDS,
      `The essay is too short for a meaningful review (minimum ${MIN_ESSAY_WORDS} words).`,
    ),
  university_id: optionalId,
  program_id: optionalId,
  prompt_text: z.string().trim().max(2000).nullable().optional().transform((v) => v || null),
  include_profile_context: z.boolean().default(true),
  /** The review of the previous draft, when this is a revision. */
  parent_id: z.uuid().nullable().optional().transform((v) => v ?? null),
  feedback_language: z.enum(["en", "ru"]).default("en"),
});

export const copilotChatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().trim().min(1).max(8000),
      }),
    )
    .min(1)
    .max(50),
  include_context: z.boolean().default(true),
});

const drillId = z.string().trim().min(1).max(80);

export const trainingCompleteSchema = z.object({
  drill_id: drillId,
});

export const drillFeedbackSchema = z.object({
  drill_id: drillId,
  answer: z.string().trim().min(3, "Write your attempt first.").max(2000),
});
