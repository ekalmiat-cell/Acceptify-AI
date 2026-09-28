/**
 * Display names for the admissions model's vocabulary — achievements,
 * academic criteria, match categories, fields of study — in the interface
 * language. The English names in the catalogs stay the source of truth (they
 * are stored, searched and sent to the AI); these are for display. Pure.
 */

import { achievementCatalog } from "@/data/achievement-catalog";
import { ACADEMIC_CRITERION_LABELS, type CriterionKey } from "@/lib/criteria";
import type { Locale } from "@/lib/i18n/core";
import type { MatchCategory } from "@/types/domain";

const ACHIEVEMENTS_RU: Record<string, { label: string; description: string }> = {
  ap: { label: "Курсы AP", description: "Сданные экзамены Advanced Placement с баллами." },
  ib: { label: "Диплом IB", description: "Диплом или курсы International Baccalaureate." },
  aLevel: { label: "A-Level", description: "Предметы и оценки GCE A-Level." },
  honors: { label: "Углублённые курсы", description: "Курсы повышенного уровня сверх обычной программы." },
  research: { label: "Исследования", description: "Самостоятельное или руководимое исследование с публичным результатом." },
  publications: { label: "Публикации", description: "Статьи или другие опубликованные работы." },
  awards: { label: "Награды", description: "Академические и внеучебные награды." },
  recommendationLetters: {
    label: "Рекомендательные письма",
    description: "Сильные рекомендации, готовые к отправке.",
  },
  personalEssay: { label: "Личное эссе", description: "Отшлифованное мотивационное или личное эссе." },
  communityService: { label: "Волонтёрство", description: "Регулярная волонтёрская или общественная работа." },
  olympiads: { label: "Олимпиады", description: "Предметные олимпиады по математике, физике и другим дисциплинам." },
  hackathons: { label: "Хакатоны", description: "Командные соревнования по программированию." },
  startup: { label: "Стартап-конкурсы", description: "Питч-конкурсы и стартап-акселераторы." },
  business: { label: "Бизнес-конкурсы", description: "Кейс-чемпионаты, конкурсы бизнес-планов, биржевые игры." },
  leadership: { label: "Лидерство", description: "Официальные лидерские роли в клубах, советах или проектах." },
  mun: { label: "MUN", description: "Конференции Model United Nations и награды на них." },
  debate: { label: "Дебаты", description: "Соревновательные дебаты (например, WSDC, формат BP)." },
  sports: { label: "Спорт", description: "Соревновательный спорт, командный или индивидуальный." },
  music: { label: "Музыка", description: "Музыкальное образование, сертификаты или выступления." },
  arts: { label: "Искусство", description: "Портфолио, выставки или дизайн-работы." },
};

const GROUPS_RU: Record<string, string> = {
  Academics: "Учёба",
  Credentials: "Документы и курсы",
  Activities: "Активности",
  Competitions: "Конкурсы",
  Talents: "Таланты",
};

const ACADEMIC_RU: Record<string, string> = {
  gpa: "GPA",
  sat: "SAT",
  act: "ACT",
  ielts: "IELTS",
  toefl: "TOEFL",
  ent: "ЕНТ",
};

export function achievementLabel(id: string, locale: Locale): string {
  if (locale === "ru" && ACHIEVEMENTS_RU[id]) return ACHIEVEMENTS_RU[id].label;
  return achievementCatalog.find((item) => item.id === id)?.label ?? id;
}

export function achievementDescription(id: string, locale: Locale): string {
  if (locale === "ru" && ACHIEVEMENTS_RU[id]) return ACHIEVEMENTS_RU[id].description;
  return achievementCatalog.find((item) => item.id === id)?.description ?? "";
}

export function groupName(group: string, locale: Locale): string {
  return locale === "ru" ? (GROUPS_RU[group] ?? group) : group;
}

/** Any scored criterion — an exam or an achievement — by name. */
export function criterionName(key: CriterionKey | string, locale: Locale): string {
  if (key in ACADEMIC_CRITERION_LABELS) {
    return locale === "ru" ? ACADEMIC_RU[key] : ACADEMIC_CRITERION_LABELS[key as keyof typeof ACADEMIC_CRITERION_LABELS];
  }
  return achievementLabel(key, locale);
}

const CATEGORY: Record<Locale, Record<MatchCategory, { label: string; description: string }>> = {
  en: {
    safe: { label: "Safe", description: "Your profile comfortably exceeds typical admits." },
    target: { label: "Target", description: "A realistic, competitive match for your profile." },
    reach: { label: "Reach", description: "Highly competitive — a stretch worth applying for." },
  },
  ru: {
    safe: { label: "Надёжный", description: "Твой профиль уверенно выше типичного поступившего." },
    target: { label: "Целевой", description: "Реалистичный и конкурентный вариант для твоего профиля." },
    reach: { label: "Амбициозный", description: "Очень высокая конкуренция — но попробовать стоит." },
  },
};

export function categoryLabel(category: MatchCategory, locale: Locale): string {
  return CATEGORY[locale][category].label;
}

export function categoryDescription(category: MatchCategory, locale: Locale): string {
  return CATEGORY[locale][category].description;
}

const FIELDS_RU: Record<string, string> = {
  "Computer Science": "Компьютерные науки",
  "Data Science & AI": "Data Science и ИИ",
  Engineering: "Инженерия",
  "Business Administration": "Бизнес-администрирование",
  "Economics & Finance": "Экономика и финансы",
  Medicine: "Медицина",
  Dentistry: "Стоматология",
  Pharmacy: "Фармация",
  Law: "Право",
  "International Relations": "Международные отношения",
  "Political Science": "Политология",
  Psychology: "Психология",
  Biology: "Биология",
  Chemistry: "Химия",
  Physics: "Физика",
  Mathematics: "Математика",
  "Environmental Science": "Экология",
  Architecture: "Архитектура",
  Journalism: "Журналистика",
  Marketing: "Маркетинг",
  Accounting: "Бухгалтерский учёт",
  Education: "Педагогика",
  "Arts & Design": "Искусство и дизайн",
  Music: "Музыка",
  "Hospitality & Tourism": "Гостеприимство и туризм",
  Agriculture: "Сельское хозяйство",
  Aviation: "Авиация",
  Other: "Другое",
};

export function fieldName(field: string, locale: Locale): string {
  return locale === "ru" ? (FIELDS_RU[field] ?? field) : field;
}

/** A saved prediction's status, in the interface language. */
export function statusName(status: string, locale: Locale): string {
  const ru: Record<string, string> = {
    Saved: "Сохранено",
    Applied: "Подана заявка",
    Considering: "Рассматриваю",
    Analyzed: "Проанализировано",
  };
  return locale === "ru" ? (ru[status] ?? status) : status;
}
