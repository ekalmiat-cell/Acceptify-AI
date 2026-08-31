import json
from typing import Any
import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.achievement import Achievement
from app.models.prediction import Prediction
from app.models.student_profile import StudentProfile
from app.models.university import University
from app.schemas.copilot import ChatMessage, CopilotChatResponse
from app.services.llm.exceptions import LLMProviderError

COPILOT_SYSTEM_PROMPT = """You are Acceptify AI Copilot — an empathetic, brilliant, and proactive AI admissions mentor and college counselor embedded in the Acceptify AI platform.

Your mission is to guide the student toward admission to their dream universities with strategic, actionable, encouraging, and highly specific advice.

### Guidelines for Your Answers:
1. **Personalized Context:** If the student's profile (GPA, SAT, IELTS, ENT, achievements, target universities) is provided in the system context, actively reference it to provide hyper-relevant guidance.
2. **Actionable & Realistic:** Break complex admissions steps into clear, manageable tasks (e.g. essay ideas, test retake strategies, extracurricular project expansion).
3. **Structured & Beautiful Formatting:** Use bullet points, bold headers, and concise paragraphs for high readability.
4. **Tone:** Warm, intelligent, motivating, and realistic (no false guarantees, focus on true competitive strategy).
5. **Multilingual:** Answer fluently in the same language the student asks (Russian, Kazakh, or English).
6. **Suggest Next Questions:** At the end of your response, always provide 2-3 brief, relevant follow-up questions the student might want to explore next.

### Output JSON Format:
You must output a valid JSON object with the following structure:
{
  "reply": "Your markdown-formatted response here...",
  "suggested_followups": [
    "Follow-up question 1",
    "Follow-up question 2"
  ]
}
"""


async def get_student_full_context(db: AsyncSession, user_id: str) -> str:
    """Builds a rich context summary of student's academics, dream uni, and predictions."""
    parts: list[str] = []

    profile = await db.get(StudentProfile, user_id)
    if profile:
        academic_items: list[str] = []
        if profile.gpa is not None:
            academic_items.append(f"GPA: {profile.gpa}")
        if profile.sat_score is not None:
            academic_items.append(f"SAT: {profile.sat_score}")
        if profile.ielts_score is not None:
            academic_items.append(f"IELTS: {profile.ielts_score}")
        if profile.toefl_score is not None:
            academic_items.append(f"TOEFL: {profile.toefl_score}")
        if profile.ent_score is not None:
            academic_items.append(f"ENT: {profile.ent_score}")

        if academic_items:
            parts.append(f"Academic Scores: {', '.join(academic_items)}")

        if profile.dream_university_id:
            uni = await db.get(University, profile.dream_university_id)
            if uni:
                parts.append(f"Dream University: {uni.name} ({uni.country})")

    # Achievements
    achievements_res = await db.scalars(
        select(Achievement).where(Achievement.user_id == user_id, Achievement.achieved.is_(True))
    )
    achievements = list(achievements_res)
    if achievements:
        parts.append(f"Recorded Achievements: {', '.join(a.key for a in achievements[:12])}")

    # Saved Predictions / Universities in Portfolio
    preds_res = await db.scalars(
        select(Prediction).where(Prediction.user_id == user_id).order_by(Prediction.created_at.desc()).limit(5)
    )
    preds = list(preds_res)
    if preds:
        pred_summaries: list[str] = []
        for p in preds:
            u = await db.get(University, p.university_id)
            uni_name = u.name if u else p.university_id
            pred_summaries.append(f"{uni_name} (Fit Score: {p.match_score}%, Category: {p.category})")
        parts.append(f"Recent University Analyses: {'; '.join(pred_summaries)}")

    return "\n".join(parts) if parts else "No profile data filled yet."


async def run_copilot_chat(
    messages: list[ChatMessage],
    student_context: str | None,
) -> CopilotChatResponse:
    settings = get_settings()

    # System instruction with context
    sys_instruction = COPILOT_SYSTEM_PROMPT
    if student_context:
        sys_instruction += f"\n\n### Current Student Context:\n{student_context}"

    # Build messages
    formatted_contents: list[dict[str, Any]] = []
    for msg in messages:
        role = "user" if msg.role in ("user", "system") else "model"
        formatted_contents.append({"role": role, "parts": [{"text": msg.content}]})

    # If in mock mode or no api key, return helpful intelligent mock
    if settings.llm_provider == "mock" or (not settings.gemini_api_key and not settings.is_production):
        last_msg = messages[-1].content.lower()
        if "шанс" in last_msg or "chance" in last_msg or "mit" in last_msg:
            reply = (
                "Для значительного повышения шансов в целевые вузы я рекомендую сфокусироваться на **трех ключевых рычагах**:\n\n"
                "1. **Академический профиль:** Поднять SAT до 1500+ и укрепить GPA профильными предметами (AP/IB/Olympiads).\n"
                "2. **Внеучебный фокус (Spike):** Развить 1–2 авторских проекта (стартап, хакатон, публикация исследования).\n"
                "3. **Мотивационное эссе:** Раскрыть уникальный личный голос и показать глубокую связь с культурой вуза."
            )
            followups = [
                "Как лучше описать проект в эссе?",
                "Какие стипендии доступны в моем списке вузов?",
                "Какой оптимальный баланс Reach/Target/Safe вузов?",
            ]
        else:
            reply = (
                "Привет! Я ваш **Acceptify AI Copilot**. Я могу помочь вам:\n\n"
                "- Оценить шансы и составить стратегию поступления\n"
                "- Разобрать требования и дедлайны университетов\n"
                "- Найти возможности стипендий и грантов\n"
                "- Подготовить сильные идеи для эссе и портфолио\n\n"
                "Какой вопрос вас сейчас больше всего интересует?"
            )
            followups = [
                "Как сбалансировать список вузов?",
                "Как написать сильное эссе?",
                "Какие экзамены сдать в первую очередь?",
            ]
        return CopilotChatResponse(reply=reply, suggested_followups=followups)

    # Real call to Gemini 3.7 Flash API
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_model}:generateContent?key={settings.gemini_api_key}"
    payload = {
        "system_instruction": {"parts": [{"text": sys_instruction}]},
        "contents": formatted_contents,
        "generationConfig": {
            "temperature": 0.5,
            "response_mime_type": "application/json",
        },
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            res = await client.post(url, json=payload, headers={"Content-Type": "application/json"})
            if res.status_code != 200:
                raise LLMProviderError(f"Gemini error {res.status_code}: {res.text}")

            data = res.json()
            raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
            parsed = json.loads(raw_text)
            return CopilotChatResponse(
                reply=parsed.get("reply", "Ready to assist!"),
                suggested_followups=parsed.get("suggested_followups", []),
            )
    except Exception as exc:
        raise LLMProviderError(f"Failed to generate copilot response: {exc}") from exc
