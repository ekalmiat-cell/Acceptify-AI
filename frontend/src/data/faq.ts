import type { FaqItem } from "@/types/domain";

export const faqItems: FaqItem[] = [
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
      "Yes. While Acceptify is in beta every feature is free: unlimited admission analyses, the what-if simulator, PDF reports, AI essay reviews and the AI copilot. The AI features have hourly limits so the service stays available for everyone. Paid Pro and Ultimate plans are planned, and nothing can be bought yet.",
  },
  {
    id: "faq-6",
    question: "How is my profile data used?",
    answer:
      "Your academic and achievement data is used only to power your own predictions and recommendations. When you use the AI essay reviewer or the copilot, the essay text and an anonymous summary of your profile (scores, achievements, target university — never your name or email) are sent to Google Gemini to generate the answer. We never sell profile data, and you can edit your profile, remove achievement entries, or delete essay reviews at any time.",
  },
  {
    id: "faq-7",
    question: "What happens when paid plans launch?",
    answer:
      "Everything that is free today stays free. Paid plans will add extras on top, and you will never be charged without choosing a plan yourself.",
  },
];
