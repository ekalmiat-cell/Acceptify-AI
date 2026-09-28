/**
 * University catalog wording in the interface language. The catalog
 * (data/universities.json) is English — it also feeds search and the AI — so
 * the short, repeated labels are translated here for display. Pure.
 */

import { formatDate, type Locale } from "@/lib/i18n/core";

const TAGS_RU: Record<string, string> = {
  STEM: "STEM",
  "Ivy-tier": "Уровень Лиги плюща",
  Research: "Исследовательский",
  Entrepreneurship: "Предпринимательство",
  Public: "Государственный",
  "Large campus": "Большой кампус",
  "Co-op friendly": "Практика в компаниях",
  Collegiate: "Колледжная система",
  "Tutorial system": "Тьюториалы",
  "Asia's top-ranked": "Лучший в Азии",
  "Low tuition": "Недорогое обучение",
  "Broad-based first year": "Широкий первый курс",
  "Fully-funded": "Полное финансирование",
  "English-taught": "Обучение на английском",
  "Urban campus": "Городской кампус",
  Business: "Бизнес",
  Arts: "Искусство",
  "Broad programs": "Широкий выбор программ",
  UCAS: "UCAS",
  "National exam (ENT)": "Нацэкзамен (ЕНТ)",
  "Gaokao track": "Через гаокао",
  "TOLC admissions test": "Вступительный тест TOLC",
  "EJU track": "Через EJU",
  "CSAT track": "Через CSAT",
};

export function tagName(tag: string, locale: Locale): string {
  return locale === "ru" ? (TAGS_RU[tag] ?? tag) : tag;
}

const SELECTIVITY_RU: Record<string, string> = {
  "Most Selective": "Самый высокий отбор",
  "Highly Selective": "Очень высокий отбор",
  Selective: "Высокий отбор",
  "Moderately Selective": "Умеренный отбор",
  "Less Selective": "Мягкий отбор",
  Accessible: "Доступный",
};

export function selectivityName(level: string, locale: Locale): string {
  return locale === "ru" ? (SELECTIVITY_RU[level] ?? level) : level;
}

const DECISION_RU: Record<string, string> = {
  "Regular Decision": "Обычный приём",
  Rolling: "Скользящий приём",
  "Early Action": "Ранняя подача",
};

export function decisionName(type: string, locale: Locale): string {
  return locale === "ru" ? (DECISION_RU[type] ?? type) : type;
}

/** "Jan 1, 2027" from the catalog, in the interface language ("1 янв. 2027 г."). */
export function deadlineText(deadline: string, locale: Locale): string {
  if (locale === "en") return deadline;
  const parsed = Date.parse(deadline);
  return Number.isNaN(parsed) ? deadline : formatDate(locale, parsed, { day: "numeric", month: "long", year: "numeric" });
}

// ── Catalog text: descriptions, requirements, scholarships ────────────────

const DESCRIPTIONS_RU: Record<string, string> = {
  "uni-mit": "Частный исследовательский университет, известный инженерией, компьютерными науками и культурой «сначала задача, потом теория».",
  "uni-stanford":
    "Частный исследовательский университет в Кремниевой долине, известный предпринимательским духом, междисциплинарными исследованиями и огромным солнечным кампусом.",
  "uni-berkeley": "Один из лучших государственных исследовательских университетов, сильный в инженерии, бизнесе и естественных науках.",
  "uni-toronto": "Лучший университет Канады с огромным исследовательским кампусом в самом центре Торонто.",
  "uni-oxford":
    "Старейший университет англоязычного мира, где учат через особую систему тьюториалов — занятий один на один и в маленьких группах.",
  "uni-cambridge":
    "Колледжный исследовательский университет с 800-летней историей и особенно сильными математикой и естественными науками.",
  "uni-nus": "Ведущий исследовательский университет Азии: строгие STEM-программы и очень международное студенчество.",
  "uni-eth": "Один из лучших в мире государственных STEM-университетов — со знаменито низкой платой за обучение и строгой, насыщенной математикой программой.",
  "uni-melbourne": "Лучший университет Австралии, известный гибкой «мельбурнской моделью» широких бакалаврских программ.",
  "uni-nu":
    "Флагманский автономный исследовательский университет Казахстана: все программы на английском, созданы вместе с ведущими университетами мира.",
  "uni-nyu": "Огромный городской исследовательский университет, вплетённый в Нью-Йорк, с сильными программами по бизнесу, искусству и кино.",
  "uni-utokyo": "Самый престижный университет Японии, где становится всё больше бакалаврских программ полностью на английском.",
};

/** "в США", "в Великобритании" — for the templated descriptions. */
const IN_COUNTRY_RU: Record<string, string> = {
  "United States": "в США",
  "United Kingdom": "в Великобритании",
  "South Korea": "в Южной Корее",
  Kazakhstan: "в Казахстане",
  Japan: "в Японии",
  Italy: "в Италии",
  Germany: "в Германии",
  China: "в Китае",
  Singapore: "в Сингапуре",
  Switzerland: "в Швейцарии",
  Canada: "в Канаде",
  Australia: "в Австралии",
};

const TEMPLATE = /^(.+) is a leading research university in (.+), recognized for strong academics and an active student community\.$/;

export function universityDescription(
  university: { id: string; description: string },
  locale: Locale,
): string {
  if (locale === "en") return university.description;
  if (DESCRIPTIONS_RU[university.id]) return DESCRIPTIONS_RU[university.id];
  const match = TEMPLATE.exec(university.description);
  if (!match) return university.description;
  const where = IN_COUNTRY_RU[match[2]] ?? `(${match[2]})`;
  return `${match[1]} — ведущий исследовательский университет ${where} с сильной учёбой и активной студенческой жизнью.`;
}

const REQUIREMENT_LABELS_RU: Record<string, string> = {
  "Common App essays": "Эссе Common App",
  "Letters of recommendation": "Рекомендательные письма",
  "Standardized testing": "Стандартизированные тесты",
  Interview: "Собеседование",
  "UC application essays": "Эссе для заявки UC",
  "Supplementary essays": "Дополнительные эссе",
  "Personal statement": "Мотивационное эссе",
  "Admissions test": "Вступительный тест",
  "Entrance examination": "Вступительный экзамен",
  "Language proficiency": "Знание языка",
  "UNT / national exam score": "Балл ЕНТ",
  "NU-administered test": "Тест Назарбаев Университета",
  "PEAK program essays": "Эссе программы PEAK",
  "Common App / Coalition essays": "Эссе Common App / Coalition",
  "Predicted grades": "Прогнозные оценки",
  "National exam (ENT/UNT) score": "Балл ЕНТ",
  "University entrance exam": "Вступительный экзамен университета",
  "Gaokao or international equivalent": "Гаокао или международный аналог",
  "HSK Chinese proficiency": "Китайский язык (HSK)",
  "Abitur or equivalent": "Абитур или аналог",
  "Motivation letter": "Мотивационное письмо",
  "Secondary school diploma": "Аттестат о среднем образовании",
  "Admissions test (TOLC or similar)": "Вступительный тест (TOLC или аналог)",
  "EJU or equivalent exam": "EJU или аналогичный экзамен",
  "CSAT or international equivalent": "CSAT или международный аналог",
};

const REQUIREMENT_VALUES_RU: Record<string, string> = {
  "5 short responses": "5 коротких ответов",
  "2 teachers + 1 counselor": "2 учителя + 1 школьный консультант",
  "SAT/ACT optional, encouraged": "SAT/ACT по желанию, но желательно",
  "Optional, alumni-led": "По желанию, проводят выпускники",
  "1 long + 3 short": "1 длинное + 3 коротких",
  "SAT/ACT optional": "SAT/ACT по желанию",
  "4 personal insight questions": "4 вопроса о себе",
  "Not required": "Не требуется",
  "Not considered": "Не учитывается",
  "Not offered": "Не проводится",
  "Program-specific, 2-3 questions": "Зависит от программы, 2–3 вопроса",
  "Not typically required": "Обычно не требуется",
  "Not required for most programs": "Для большинства программ не требуется",
  "Program-dependent": "Зависит от программы",
  "UCAS, ~4,000 characters": "UCAS, ~4 000 символов",
  "Course-dependent (e.g. MAT, TSA)": "Зависит от курса (например, MAT, TSA)",
  "1 academic reference": "1 академическая рекомендация",
  "Required for shortlisted candidates": "Для кандидатов из шорт-листа",
  "Course-dependent (e.g. ENGAA, NSAA)": "Зависит от курса (например, ENGAA, NSAA)",
  "1 essay + activity summary": "1 эссе + описание активностей",
  "1-2 recommenders": "1–2 рекомендателя",
  "SAT/ACT recommended": "SAT/ACT рекомендуется",
  "Required unless exempt": "Обязательно, если нет освобождения",
  "German or English track": "Немецкий или английский трек",
  "Program-specific, 1 essay": "Зависит от программы, 1 эссе",
  "Strong composite score": "Высокий общий балл",
  "SAT-style entrance exam": "Вступительный экзамен в формате SAT",
  "1 essay": "1 эссе",
  "Required for some schools": "Требуется в некоторых школах",
  "1 long + supplement": "1 длинное + дополнительное",
  "1 counselor + 1 teacher": "1 консультант + 1 учитель",
  "Test-flexible": "Тесты на выбор",
  "2 essays + activities": "2 эссе + активности",
  "2 academic references": "2 академические рекомендации",
  "SAT/IB/A-level accepted": "Принимаются SAT/IB/A-Level",
  "Online interview round": "Онлайн-собеседование",
  "1 personal essay + supplements": "1 личное эссе + дополнительные",
  "1-2 teachers + 1 counselor": "1–2 учителя + 1 консультант",
  "SAT or ACT, test-optional at many": "SAT или ACT, во многих — по желанию",
  "A-Level / IB predictions": "Прогнозы A-Level / IB",
  "Course-dependent": "Зависит от курса",
  "Subject-specific, if applicable": "По предметам, если требуется",
  "Score-dependent by program": "Проходной балл зависит от программы",
  "Required for Chinese-taught programs": "Для программ на китайском языке",
  "Secondary school leaving certificate": "Аттестат об окончании школы",
  "German (DSH/TestDaF) or English track": "Немецкий (DSH/TestDaF) или английский трек",
  "13 years of schooling required": "Нужно 13 лет школьного обучения",
  "Required for most programs": "Для большинства программ",
  "Italian or English track": "Итальянский или английский трек",
  "SAT/ACT or A-Level/IB accepted": "Принимаются SAT/ACT или A-Level/IB",
  "Required for most national universities": "Для большинства государственных университетов",
  "1-2 essays": "1–2 эссе",
  "1-2 academic references": "1–2 академические рекомендации",
  "Common for English-taught programs": "Часто на англоязычных программах",
  "Common for competitive programs": "Часто на конкурсных программах",
};

export function requirementText(requirement: { label: string; value: string }, locale: Locale) {
  if (locale === "en") return requirement;
  return {
    label: REQUIREMENT_LABELS_RU[requirement.label] ?? requirement.label,
    value: REQUIREMENT_VALUES_RU[requirement.value] ?? requirement.value,
  };
}

const SCHOLARSHIPS_RU: Record<string, string> = {
  "Up to 100% need-based aid": "До 100% помощи по финансовому положению семьи",
  "Full tuition under $150k family income": "Бесплатное обучение при доходе семьи до $150 тыс.",
  "Merit + need-based, varies by state residency": "За заслуги и по нуждаемости, зависит от штата проживания",
  "Lester B. Pearson International (full ride, limited)": "Стипендия Lester B. Pearson (покрывает всё, мест мало)",
  "Reach Oxford & Clarendon scholarships": "Стипендии Reach Oxford и Clarendon",
  "Cambridge Trust international scholarships": "Международные стипендии Cambridge Trust",
  "ASEAN & Global Undergraduate Scholarship": "Стипендии ASEAN и Global Undergraduate",
  "Excellence Scholarship & Opportunity Programme": "Excellence Scholarship & Opportunity Programme",
  "Melbourne Global Excellence Scholarship": "Стипендия Melbourne Global Excellence",
  "Full state-funded tuition + stipend for all admits": "Полностью бесплатное обучение и стипендия для всех поступивших",
  "Merit scholarships, limited need-based for intl.": "Стипендии за заслуги, для иностранцев помощь по нуждаемости ограничена",
  "MEXT scholarship for international students": "Стипендия MEXT для иностранных студентов",
  "Merit and need-based aid available for competitive applicants":
    "Для сильных абитуриентов есть помощь за заслуги и по нуждаемости",
};

export function scholarshipText(coverage: string, locale: Locale): string {
  return locale === "ru" ? (SCHOLARSHIPS_RU[coverage] ?? coverage) : coverage;
}
