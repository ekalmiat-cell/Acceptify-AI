import type { FaqItem } from "@/types/domain";

export const faqItems: FaqItem[] = [
  {
    id: "faq-1",
    question: "How does Acceptify AI predict my admission chances?",
    answer:
      "We combine your academic profile — GPA, standardized test scores, and achievement categories like olympiads, research, and leadership — with each university's historical acceptance data and stated requirements. The result is a match score and a Safe / Target / Reach classification for every school you compare.",
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
      "Academic categories (GPA, standardized tests, UNT) carry the most weight, followed by competitive achievements like olympiads, research, and hackathons. Activities and talents (MUN, debate, sports, music, art) provide smaller but meaningful boosts, especially for holistic-review universities.",
  },
  {
    id: "faq-4",
    question: "Can I use Acceptify AI for universities outside the US?",
    answer:
      "Yes. Our university database spans the US, UK, Canada, Europe, Asia, Australia, and Kazakhstan, with country-specific requirements like UNT scores and English proficiency thresholds built in.",
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
