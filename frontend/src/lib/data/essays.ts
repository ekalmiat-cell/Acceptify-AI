import "server-only";

import { pgPool } from "@/lib/db";
import type {
  EssayAnalysisResult,
  EssayReviewRead,
  EssayReviewSummaryRead,
} from "@/types/essay";

/** Saved AI essay reviews. Every query is scoped to the owning user. */

interface EssayRow {
  id: string;
  user_id: string;
  university_id: string | null;
  program_id: string | null;
  title: string;
  prompt_text: string | null;
  word_count: number;
  essay_snippet: string;
  essay_text: string;
  analysis_result: EssayAnalysisResult;
  overall_score: number;
  created_at: Date;
  updated_at: Date;
}

const SUMMARY_COLUMNS =
  "id, university_id, program_id, title, prompt_text, word_count, essay_snippet, overall_score, created_at";
const FULL_COLUMNS = `${SUMMARY_COLUMNS}, user_id, essay_text, analysis_result, updated_at`;

function toSummary(row: EssayRow): EssayReviewSummaryRead {
  return {
    id: String(row.id),
    university_id: row.university_id,
    program_id: row.program_id,
    title: row.title,
    prompt_text: row.prompt_text,
    word_count: row.word_count,
    essay_snippet: row.essay_snippet,
    overall_score: row.overall_score,
    created_at: row.created_at.toISOString(),
  };
}

function toReview(row: EssayRow): EssayReviewRead {
  return {
    ...toSummary(row),
    user_id: row.user_id,
    essay_text: row.essay_text,
    analysis_result: row.analysis_result,
    updated_at: row.updated_at.toISOString(),
  };
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

const SNIPPET_LENGTH = 280;

export function makeSnippet(text: string): string {
  return text.length > SNIPPET_LENGTH ? `${text.slice(0, SNIPPET_LENGTH)}...` : text;
}

export async function createEssayReview(input: {
  userId: string;
  universityId: string | null;
  programId: string | null;
  title: string;
  promptText: string | null;
  essayText: string;
  analysis: EssayAnalysisResult;
}): Promise<EssayReviewRead> {
  const result = await pgPool.query<EssayRow>(
    `INSERT INTO essay_reviews (
       user_id, university_id, program_id, title, prompt_text, word_count,
       essay_snippet, essay_text, analysis_result, overall_score
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING ${FULL_COLUMNS}`,
    [
      input.userId,
      input.universityId,
      input.programId,
      input.title,
      input.promptText,
      countWords(input.essayText),
      makeSnippet(input.essayText),
      input.essayText,
      JSON.stringify(input.analysis),
      input.analysis.overall_score,
    ],
  );
  return toReview(result.rows[0]);
}

export async function listEssayReviews(userId: string): Promise<EssayReviewSummaryRead[]> {
  const result = await pgPool.query<EssayRow>(
    `SELECT ${SUMMARY_COLUMNS} FROM essay_reviews
     WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId],
  );
  return result.rows.map(toSummary);
}

export async function getEssayReview(userId: string, id: string): Promise<EssayReviewRead | null> {
  const result = await pgPool.query<EssayRow>(
    `SELECT ${FULL_COLUMNS} FROM essay_reviews WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  return result.rows[0] ? toReview(result.rows[0]) : null;
}

/** Permanently deletes a review. Returns false when there was nothing to delete. */
export async function deleteEssayReview(userId: string, id: string): Promise<boolean> {
  const result = await pgPool.query("DELETE FROM essay_reviews WHERE id = $1 AND user_id = $2", [
    id,
    userId,
  ]);
  return (result.rowCount ?? 0) > 0;
}
