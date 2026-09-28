import type { Locale } from "@/lib/i18n/core";
import type { FaqItem } from "@/types/domain";

export const faqItems: Record<Locale, FaqItem[]> = {
  en: [
    {
      id: "faq-1",
      question: "How does Acceptify estimate my admission chances?",
      answer:
        "Your academic profile — GPA, standardized test scores, and achievement categories like olympiads, research, and leadership — is scored against each university's stated requirements and acceptance rate, using the evaluation weights set for the specific programme you intend to apply for. The result is a fit score out of 100 — how closely you match what that programme asks for, not a probability of being admitted — and a Reach / Target / Safe classification. The calculation is deterministic and fully explainable: you can see every category's contribution.",
    },
    {
      id: "faq-2",
      question: "Is the prediction a guarantee of admission?",
      answer:
        "No. Predictions are a data-informed estimate to help you build a balanced list and understand where you stand — admissions committees weigh essays, recommendations, and context we don't have access to. Treat it as a compass, not a verdict.",
    },
    {
      id: "faq-3",
      question: "Which achievement categories actually move my score?",
      answer:
        "It depends on the programme. Each field of study has its own weighting, so what matters for Computer Science is not what matters for Medicine. In general academic categories (GPA, standardized tests, ENT) carry the most weight, followed by competitive achievements like olympiads, research, and hackathons, with activities and talents (MUN, debate, sports, music, art) contributing smaller amounts. Your analysis shows the exact weight applied to each category.",
    },
    {
      id: "faq-4",
      question: "Can I use Acceptify for universities outside the US?",
      answer:
        "Yes. The catalog currently covers 239 universities across the United States, United Kingdom, South Korea, Kazakhstan, Japan, China, Germany, Italy, Singapore, Canada, Switzerland, and Australia, with country-specific inputs like the ENT and English proficiency thresholds built in. It grows over time — if a university is not listed yet, its data is simply not there rather than estimated.",
    },
    {
      id: "faq-5",
      question: "Is Acceptify free?",
      answer:
        "Yes. While Acceptify is in beta every feature is free: unlimited admission analyses, the what-if simulator, PDF reports, AI essay reviews, essay training and the AI copilot. The AI features have daily limits so the service stays available for everyone. Paid Pro and Ultimate plans are planned, and nothing can be bought yet.",
    },
    {
      id: "faq-6",
      question: "How is my profile data used?",
      answer:
        "Your academic and achievement data is used only to power your own predictions and recommendations. When you use the AI essay reviewer, the training coach or the copilot, the text and an anonymous summary of your profile (scores, achievements, target university — never your name or email) are sent to Google Gemini to generate the answer. We never sell profile data, and you can edit your profile, remove achievement entries, or delete essay reviews at any time.",
    },
    {
      id: "faq-7",
      question: "What happens when paid plans launch?",
      answer:
        "Everything that is free today stays free. Paid plans will add extras on top, and you will never be charged without choosing a plan yourself.",
    },
  ],
  ru: [
    {
      id: "faq-1",
      question: "Как Acceptify оценивает мои шансы на поступление?",
      answer:
        "Твой академический профиль — GPA, баллы стандартизированных тестов и достижения вроде олимпиад, исследований и лидерства — сравнивается с заявленными требованиями и долей принятых каждого университета, с весами именно той программы, на которую ты собираешься подавать. Результат — балл соответствия из 100 (насколько ты подходишь под требования программы, а не вероятность поступления) и категория: амбициозный, целевой или надёжный вариант. Расчёт детерминированный и полностью объяснимый: видно вклад каждой категории.",
    },
    {
      id: "faq-2",
      question: "Прогноз — это гарантия поступления?",
      answer:
        "Нет. Прогноз — это оценка на основе данных, которая помогает собрать сбалансированный список и понять, где ты сейчас. Приёмные комиссии учитывают эссе, рекомендации и контекст, к которым у нас нет доступа. Относись к прогнозу как к компасу, а не к приговору.",
    },
    {
      id: "faq-3",
      question: "Какие достижения реально влияют на оценку?",
      answer:
        "Зависит от программы. У каждого направления свои веса: для компьютерных наук важно одно, для медицины — другое. В целом больше всего весят академические показатели (GPA, тесты, ЕНТ), затем соревновательные достижения — олимпиады, исследования, хакатоны, а активности и таланты (MUN, дебаты, спорт, музыка, искусство) добавляют меньше. В анализе видно точный вес каждой категории.",
    },
    {
      id: "faq-4",
      question: "Подойдёт ли Acceptify для университетов не в США?",
      answer:
        "Да. Сейчас в каталоге 239 университетов из США, Великобритании, Южной Кореи, Казахстана, Японии, Китая, Германии, Италии, Сингапура, Канады, Швейцарии и Австралии, с учётом местной специфики вроде ЕНТ и требований к английскому. Каталог растёт — если университета пока нет, значит, его данных просто нет, а не что они придуманы.",
    },
    {
      id: "faq-5",
      question: "Acceptify бесплатный?",
      answer:
        "Да. Пока идёт бета, все функции бесплатны: анализ поступления без ограничений, симулятор «что если», PDF-отчёты, разборы эссе с ИИ, тренировка эссе и ИИ-помощник. У ИИ-функций есть дневные лимиты, чтобы сервиса хватало всем. Платные тарифы Pro и Ultimate запланированы, купить пока ничего нельзя.",
    },
    {
      id: "faq-6",
      question: "Как используются данные моего профиля?",
      answer:
        "Твои академические данные и достижения используются только для твоих собственных прогнозов и рекомендаций. Когда ты пользуешься разбором эссе, ИИ-тренером или помощником, текст и анонимная сводка профиля (баллы, достижения, целевой университет — но не имя и не почта) отправляются в Google Gemini, чтобы получить ответ. Мы никогда не продаём данные, а профиль, достижения и разборы эссе можно изменить или удалить в любой момент.",
    },
    {
      id: "faq-7",
      question: "Что будет, когда появятся платные тарифы?",
      answer:
        "Всё, что бесплатно сегодня, останется бесплатным. Платные тарифы добавят дополнительные возможности, и с тебя никогда не спишут деньги, пока ты не выберешь тариф.",
    },
  ],
};
