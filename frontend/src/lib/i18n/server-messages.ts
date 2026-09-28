/**
 * Russian versions of the sentences the API sends back to the browser
 * (`{ detail }`), keyed by their English text. The code keeps throwing plain
 * English — one place translates on the way out (lib/route.ts), so a new
 * message can't break anything: without a translation it is shown as is.
 */

import { z } from "zod";

import type { Locale } from "@/lib/i18n/core";

const EXACT: Record<string, string> = {
  // Request plumbing
  "The request body must be valid JSON.": "Запрос должен быть корректным JSON.",
  "Something went wrong on our side. Please try again.": "Что-то пошло не так на нашей стороне. Попробуй ещё раз.",
  "Sign in first.": "Сначала войди в аккаунт.",
  "Your session expired. Sign in again.": "Сессия истекла. Войди снова.",
  "This action is restricted to platform administrators.": "Это действие доступно только администраторам.",

  // Not found / invalid input
  "Essay review not found.": "Разбор эссе не найден.",
  "Prediction not found.": "Прогноз не найден.",
  "Program not found.": "Программа не найдена.",
  "University not found.": "Университет не найден.",
  "Unknown achievement.": "Неизвестное достижение.",
  "Unknown field of study.": "Неизвестное направление обучения.",
  "No evaluation profile for this program yet.": "Для этой программы пока нет профиля оценки.",
  "That drill was not found.": "Упражнение не найдено.",
  "The previous draft was not found.": "Предыдущий черновик не найден.",
  "That university is not in the catalog.": "Этого университета нет в каталоге.",
  "universityId and field are required.": "Нужно указать университет и направление.",
  "No account uses this email.": "Аккаунта с такой почтой нет.",
  "This account has no password — it signs in with Google or Apple. Ask them to use that button.":
    "У этого аккаунта нет пароля — вход через Google или Apple. Попроси использовать эту кнопку.",
  "The parent program must belong to the same university.": "Родительская программа должна быть в том же университете.",
  "The parent program must be another program at the same university.":
    "Родительской должна быть другая программа того же университета.",

  // Essays and training
  "Write your attempt first.": "Сначала напиши свой вариант.",
  "The essay is too long (maximum 25,000 characters).": "Эссе слишком длинное (максимум 25 000 символов).",
  "The essay is too short for a meaningful review (minimum 25 words).":
    "Эссе слишком короткое для полноценного разбора (минимум 25 слов).",
  "The AI coach only reviews written answers.": "ИИ-тренер проверяет только письменные ответы.",
  "Send a message to start the conversation.": "Напиши сообщение, чтобы начать разговор.",

  // The AI service
  "AI features are not set up on this server yet (GEMINI_API_KEY is missing).":
    "ИИ-функции на этом сервере ещё не настроены (нет GEMINI_API_KEY).",
  "The AI is handling too many requests right now. Please wait a minute and try again.":
    "У ИИ сейчас слишком много запросов. Подожди минуту и попробуй снова.",
  "The AI service is misconfigured: the GEMINI_API_KEY was rejected.":
    "ИИ-сервис настроен неверно: ключ GEMINI_API_KEY отклонён.",
  "The AI service is not available from this server's region.": "ИИ-сервис недоступен из региона этого сервера.",
  "Google's AI is overloaded right now. Please try again in a minute.":
    "ИИ Google сейчас перегружен. Попробуй через минуту.",
  "The AI service returned an error. Please try again.": "ИИ-сервис вернул ошибку. Попробуй ещё раз.",
  "The AI took too long to answer. Please try again.": "ИИ слишком долго отвечал. Попробуй ещё раз.",
  "Couldn't reach the AI service. Please try again.": "Не удалось связаться с ИИ-сервисом. Попробуй ещё раз.",
  "Today's free AI allowance for the whole site is used up. It resets overnight — please try again tomorrow.":
    "Бесплатный дневной лимит ИИ для всего сайта исчерпан. Он обновится ночью — попробуй завтра.",
  "None of the configured AI models are available to this API key.":
    "Ни одна из настроенных моделей ИИ недоступна для этого ключа.",
  "The AI declined to process this text. Try rephrasing it.":
    "ИИ отказался обрабатывать этот текст. Попробуй сформулировать иначе.",
  "The AI returned an empty answer. Please try again.": "ИИ вернул пустой ответ. Попробуй ещё раз.",
  "The AI returned an answer we couldn't read. Please try again.":
    "ИИ вернул ответ, который не удалось прочитать. Попробуй ещё раз.",
  "The AI returned an incomplete review. Please try again.": "ИИ вернул неполный разбор. Попробуй ещё раз.",
  "The AI coach returned an answer we couldn't read. Please try again.":
    "ИИ-тренер вернул ответ, который не удалось прочитать. Попробуй ещё раз.",
};

const PATTERNS: [RegExp, (match: RegExpMatchArray) => string][] = [
  [
    /^You've used today's (\d+) for this feature\. It refills tomorrow\.$/,
    (m) => `Сегодняшний лимит для этой функции (${m[1]}) исчерпан. Он обновится завтра.`,
  ],
];

/** A server message in the visitor's language (unknown ones stay as they are). */
export function localizeMessage(message: string, locale: Locale): string {
  if (locale === "en") return message;
  if (EXACT[message]) return EXACT[message];
  for (const [pattern, render] of PATTERNS) {
    const match = message.match(pattern);
    if (match) return render(match);
  }
  return message;
}

const zodRu = z.locales.ru().localeError;

/**
 * One validation problem in the visitor's language: our own sentences from
 * the map above, zod's generic ones ("too short") from zod's Russian locale.
 */
export function localizeIssue(issue: z.core.$ZodIssue, locale: Locale): string {
  if (locale === "en") return issue.message;
  if (EXACT[issue.message]) return EXACT[issue.message];
  if (issue.code === "custom") return issue.message;
  const generic = zodRu(issue as unknown as Parameters<typeof zodRu>[0]);
  const text = typeof generic === "string" ? generic : generic?.message;
  return text || issue.message;
}
