import { describe, expect, it } from "vitest";
import type { EssayAnalysisResult, EssayReviewRead } from "@/types/essay";

describe("AI Essay Reviewer Data Structures & Validation", () => {
  it("correctly models a complete structured essay analysis result", () => {
    const mockResult: EssayAnalysisResult = {
      overall_score: 86,
      headline_verdict: "Strong authentic voice with compelling technical storytelling.",
      category_scores: {
        structure: 85,
        storytelling: 90,
        voice_and_authenticity: 92,
        clarity_and_flow: 80,
        grammar_and_mechanics: 88,
      },
      strengths: [
        "Vivid scene setting in opening paragraph",
        "Clear demonstration of intellectual initiative",
      ],
      weaknesses: [
        "Rushed conclusion paragraph",
      ],
      cliches_detected: [
        {
          quote: "Failure is the mother of success",
          issue: "Overused cliché",
          replacement_idea: "Describe the exact circuit debugging experience",
        },
      ],
      prompt_alignment: {
        score: 92,
        assessment: "Directly and thoroughly answers prompt",
        missing_elements: [],
      },
      university_alignment: {
        score: 84,
        assessment: "Demonstrates strong hands-on maker culture aligned with MIT",
        aligned_values: ["Hands-on problem solving", "Curiosity"],
      },
      actionable_recommendations: [
        {
          priority: "high",
          category: "Conclusion",
          advice: "Deepen the final paragraph with specific forward-looking research goals",
          example_improvement: "I look forward to continuing this work in the Media Lab...",
        },
      ],
      suggested_next_steps: [
        "Rewrite concluding paragraph",
        "Refine sentence variety in section 3",
      ],
    };

    expect(mockResult.overall_score).toBeGreaterThanOrEqual(0);
    expect(mockResult.overall_score).toBeLessThanOrEqual(100);
    expect(mockResult.category_scores.voice_and_authenticity).toBe(92);
    expect(mockResult.cliches_detected).toHaveLength(1);
    expect(mockResult.strengths.length).toBeGreaterThan(0);
  });

  it("validates full review read model with metadata", () => {
    const mockReview: EssayReviewRead = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      user_id: "user_test_123",
      university_id: "uni-mit",
      program_id: "prog-mit-cs",
      title: "MIT Maker Essay",
      prompt_text: "Describe what you created",
      word_count: 450,
      essay_snippet: "Ever since I built my first antenna...",
      essay_text: "Ever since I built my first antenna... (full content)",
      analysis_result: {
        overall_score: 88,
        headline_verdict: "Exceptional draft",
        category_scores: {
          structure: 90,
          storytelling: 88,
          voice_and_authenticity: 92,
          clarity_and_flow: 85,
          grammar_and_mechanics: 90,
        },
        strengths: ["Strong narrative"],
        weaknesses: ["Minor punctuation errors"],
        cliches_detected: [],
        prompt_alignment: {
          score: 95,
          assessment: "Fully addressed",
          missing_elements: [],
        },
        university_alignment: {
          score: 90,
          assessment: "Great fit",
          aligned_values: ["Innovation"],
        },
        actionable_recommendations: [],
        suggested_next_steps: ["Ready to submit"],
      },
      overall_score: 88,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    expect(mockReview.word_count).toBe(450);
    expect(mockReview.university_id).toBe("uni-mit");
    expect(mockReview.analysis_result.overall_score).toBe(88);
  });
});
