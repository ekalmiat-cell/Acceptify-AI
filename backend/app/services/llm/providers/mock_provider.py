from typing import Any

from app.schemas.essay import (
    ActionableRecommendation,
    CategoryScores,
    ClicheItem,
    EssayAnalysisResult,
    PromptAlignment,
    UniversityAlignment,
)
from app.services.llm.base import BaseLLMProvider


class MockLLMProvider(BaseLLMProvider):
    """Deterministic mock provider for unit tests, offline development, and CI environments."""

    async def analyze_essay(
        self,
        essay_text: str,
        prompt_text: str | None = None,
        university_context: dict[str, Any] | None = None,
        student_context: dict[str, Any] | None = None,
    ) -> EssayAnalysisResult:
        word_count = len(essay_text.split())
        uni_name = university_context.get("name", "the selected university") if university_context else "top universities"

        # Deterministic scoring based on content length and keywords
        base_score = min(92, max(65, 70 + (word_count // 100)))

        return EssayAnalysisResult(
            overall_score=base_score,
            headline_verdict=(
                f"Engaging personal narrative with authentic intellectual curiosity, well-suited for {uni_name}. "
                "The conclusion could be sharpened with a more forward-looking academic vision."
            ),
            category_scores=CategoryScores(
                structure=min(95, base_score + 2),
                storytelling=min(95, base_score - 1),
                voice_and_authenticity=min(95, base_score + 3),
                clarity_and_flow=min(95, base_score),
                grammar_and_mechanics=min(98, base_score + 4),
            ),
            strengths=[
                "Strong opening hook that establishes a tangible scene and immediate tension.",
                "Authentic personal voice that reveals genuine motivation rather than performative praise.",
                "Clear thematic thread connecting past experiences to current intellectual goals.",
            ],
            weaknesses=[
                "The shift between the middle story and the concluding paragraph feels slightly rushed.",
                "Some abstract claims in paragraph 3 could be strengthened with a specific metric or concrete detail.",
            ],
            cliches_detected=[
                ClicheItem(
                    quote="I realized that the journey matters much more than the destination.",
                    issue="Common philosophical cliché that reduces a unique personal insight into a generic quote.",
                    replacement_idea="Specify what precise mindset shift or skill you developed during the project.",
                )
            ] if word_count > 200 else [],
            prompt_alignment=PromptAlignment(
                score=88,
                assessment=f"Effectively addresses the core themes of the prompt with relevant personal evidence.",
                missing_elements=[],
            ),
            university_alignment=UniversityAlignment(
                score=82,
                assessment=f"Reflects the academic rigor and collaborative ethos valued at {uni_name}.",
                aligned_values=["Intellectual initiative", "Community contribution"],
            ),
            actionable_recommendations=[
                ActionableRecommendation(
                    priority="high",
                    category="Conclusion",
                    advice="Deepen the final paragraph by articulating how you will contribute to specific campus labs or communities.",
                    example_improvement="Instead of 'I hope to grow at college', write 'I look forward to expanding my research in the distributed systems lab...'",
                ),
                ActionableRecommendation(
                    priority="medium",
                    category="Show vs. Tell",
                    advice="In paragraph 2, replace the summary statement with a brief 1-2 sentence scene showing the problem in action.",
                    example_improvement=None,
                ),
            ],
            suggested_next_steps=[
                "Revise the concluding paragraph to link your goals directly to university opportunities.",
                "Replace the highlighted cliché in paragraph 3 with specific narrative evidence.",
                "Read the essay aloud to refine cadence and sentence transitions in section 2.",
            ],
        )
