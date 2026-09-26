import "server-only";

import { pgPool } from "@/lib/db";
import type { AcademicProfile, AchievementRecord } from "@/types/domain";

/**
 * A student's academic profile (one row per user) and self-reported
 * achievements (one row per achievement key they have filled in). Every
 * function takes the user id explicitly; callers get it from the session,
 * never from the request body.
 */

export const EMPTY_ACADEMIC_PROFILE: AcademicProfile = {
  gpa: null,
  satScore: null,
  actScore: null,
  ieltsScore: null,
  toeflScore: null,
  entScore: null,
  dreamUniversityId: null,
  dreamProgramId: null,
};

interface ProfileRow {
  gpa: number | null;
  sat_score: number | null;
  act_score: number | null;
  ielts_score: number | null;
  toefl_score: number | null;
  ent_score: number | null;
  dream_university_id: string | null;
  dream_program_id: string | null;
}

const PROFILE_COLUMNS =
  "gpa, sat_score, act_score, ielts_score, toefl_score, ent_score, dream_university_id, dream_program_id";

function toProfile(row: ProfileRow): AcademicProfile {
  return {
    gpa: row.gpa,
    satScore: row.sat_score,
    actScore: row.act_score,
    ieltsScore: row.ielts_score,
    toeflScore: row.toefl_score,
    entScore: row.ent_score,
    dreamUniversityId: row.dream_university_id,
    dreamProgramId: row.dream_program_id,
  };
}

export async function getAcademicProfile(userId: string): Promise<AcademicProfile> {
  const result = await pgPool.query<ProfileRow>(
    `SELECT ${PROFILE_COLUMNS} FROM student_profiles WHERE user_id = $1`,
    [userId],
  );
  return result.rows[0] ? toProfile(result.rows[0]) : EMPTY_ACADEMIC_PROFILE;
}

export async function saveAcademicProfile(
  userId: string,
  profile: AcademicProfile,
): Promise<AcademicProfile> {
  const result = await pgPool.query<ProfileRow>(
    `INSERT INTO student_profiles (
       user_id, gpa, sat_score, act_score, ielts_score, toefl_score, ent_score,
       dream_university_id, dream_program_id
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (user_id) DO UPDATE SET
       gpa = EXCLUDED.gpa,
       sat_score = EXCLUDED.sat_score,
       act_score = EXCLUDED.act_score,
       ielts_score = EXCLUDED.ielts_score,
       toefl_score = EXCLUDED.toefl_score,
       ent_score = EXCLUDED.ent_score,
       dream_university_id = EXCLUDED.dream_university_id,
       dream_program_id = EXCLUDED.dream_program_id,
       updated_at = now()
     RETURNING ${PROFILE_COLUMNS}`,
    [
      userId,
      profile.gpa,
      profile.satScore,
      profile.actScore,
      profile.ieltsScore,
      profile.toeflScore,
      profile.entScore,
      profile.dreamUniversityId,
      profile.dreamProgramId,
    ],
  );
  return toProfile(result.rows[0]);
}

interface AchievementRow {
  key: string;
  achieved: boolean;
  value: string | null;
  level: string | null;
}

/** Only the achievements the user has recorded; the catalog fills in the rest. */
export async function listAchievements(userId: string): Promise<AchievementRecord[]> {
  const result = await pgPool.query<AchievementRow>(
    "SELECT key, achieved, value, level FROM achievements WHERE user_id = $1",
    [userId],
  );
  return result.rows;
}

export async function saveAchievement(
  userId: string,
  key: string,
  record: Omit<AchievementRecord, "key">,
): Promise<AchievementRecord> {
  const result = await pgPool.query<AchievementRow>(
    `INSERT INTO achievements (user_id, key, achieved, value, level)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, key) DO UPDATE SET
       achieved = EXCLUDED.achieved,
       value = EXCLUDED.value,
       level = EXCLUDED.level,
       updated_at = now()
     RETURNING key, achieved, value, level`,
    [userId, key, record.achieved, record.value, record.level],
  );
  return result.rows[0];
}
