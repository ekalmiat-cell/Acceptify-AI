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
      "Yes. The catalog currently covers the United States, United Kingdom, Canada, Switzerland, Singapore, Japan, Australia, and Kazakhstan, with country-specific inputs like the ENT and English proficiency thresholds built in. It grows over time — if a university is not listed yet, its data is simply not there rather than estimated.",
  },
  {
    id: "faq-5",
    question: "What's the difference between Free, Pro, and Ultimate?",
    answer:
      "Free gives you a taste with 3 predictions a month. Pro unlocks unlimited predictions, requirement gap analysis, and scholarship estimates. Ultimate adds 1:1 strategy sessions and essay review credits for students who want hands-on guidance.",
  },
  {
    id: "faq-6",
    question: "How is my profile data used?",
    answer:
      "Your academic and achievement data is used only to power your own predictions and recommendations. We never sell profile data, and you can edit or remove achievement entries at any time from your Profile page.",
  },
  {
    id: "faq-7",
    question: "Can I change my plan later?",
    answer:
      "Yes — upgrade, downgrade, or cancel anytime from Settings → Billing. Changes apply at the start of your next billing cycle.",
  },
];
