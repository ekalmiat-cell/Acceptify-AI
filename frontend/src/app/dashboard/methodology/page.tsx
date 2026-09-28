import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { criterionName } from "@/lib/catalog-copy";
import { ACADEMIC_CRITERIA, DEFAULT_WEIGHTS, type CriterionKey } from "@/lib/criteria";
import { defineCopy, plural } from "@/lib/i18n/core";
import { getLocale } from "@/lib/i18n/server";
import { SCORE_CEILING, SCORE_FLOOR } from "@/lib/predict";
import { CALIBRATION_TARGET_OUTCOMES, FIT_LOG_ODDS_SPAN } from "@/lib/probability";
import { getOutcomeSummary } from "@/lib/predictions-server";
import { getAcademicProfile } from "@/lib/profile-server";
import { getUniversities } from "@/lib/universities-server";
import { getUniversityById } from "@/lib/universities";
import { resolveWeightsForUniversity } from "@/lib/weights-server";

const copy = defineCopy({
  en: {
    meta: "Methodology",
    title: "How this is calculated",
    subtitle: "Every number the platform shows you, and where it comes from.",
    fitTitle: "The fit score",
    fitNote: "What it measures — and the one thing it is not",
    fit1:
      "For each criterion a programme weights, we divide your result by the bar that programme asks for — your IELTS over their minimum, your SAT over the midpoint of their published range. Clearing a bar comfortably counts for a little extra, up to 15%; nothing counts for more than that, so one exceptional score cannot carry a profile on its own.",
    fit2: (floor: number, ceiling: number) =>
      `Those ratios are averaged using the programme's own weights, then adjusted for how selective the university is — a strong profile still reads as a reach at a school that turns down most of the people who clear its bars. The result is reported between ${floor} and ${ceiling}, never 0 and never 100, because this is an estimate and the ends of the scale would claim certainty.`,
    fit3:
      "A fit score is not a probability of admission. A 70 means your profile sits comfortably above what this programme asks for. It does not mean 70% of students like you get in — that is a different quantity, and it is derived separately below.",
    fit4:
      "Criteria you have left blank, and criteria the programme weights at zero, are left out of the average entirely rather than counted as zeros. A programme that does not assess leadership is not told you have none.",
    modelOwn: (name: string) => `Your evaluation model — ${name}`,
    modelDefault: "Your evaluation model — platform default",
    modelOwnNote: "Set by this programme in the admin catalog. Every criterion, and how much it counts.",
    modelDefaultNote:
      "You haven't declared a field of study at a programme with its own model yet, so the platform default applies.",
    criterion: "Criterion",
    type: "Type",
    weight: "Weight",
    share: "Share of score",
    academic: "Academic",
    achievement: "Achievement",
    barsTitle: "Where each bar comes from",
    barsNote: "What your result is actually compared against",
    bars1:
      "GPA, SAT, IELTS and TOEFL are compared to the figures the university itself publishes. Where a university states no bar for a test, that test is left out of your score rather than scored against a guess.",
    bars2:
      "ACT is compared to the university's published range where the catalog has one, and to a generally-competitive level where it does not. The national exam (ENT) is sat once and read by every university, so it is always compared to a national competitive level. Anywhere a national level stands in, the requirements card labels it as such — so you always know whether you are below their bar or below a general one.",
    probTitle: "From fit score to probability",
    probNote: "Used on the portfolio page, and nowhere else",
    prob1: (factor: number) =>
      `A probability has to start from the base rate. We take the university's acceptance rate as the prior odds, then shift those odds by how far your fit sits above or below the middle of the scale — a perfect fit multiplies the odds by about ${factor}×, a bottom-of-scale fit divides them by the same. That is why a strong profile at a 4%-acceptance university is still reported as a long shot: most of the people it rejects also cleared its bars.`,
    prob2:
      "Each estimate is shown as a range, not a point. The range widens the less complete your profile is, because an estimate built from two filled fields deserves to look less certain than one built from twenty.",
    prob3:
      "For a whole portfolio we report a bracket: the high end assumes each decision is independent (1 − ∏(1 − pᵢ)), the low end assumes they move together, in which case your best single chance is the whole story. Real decisions are correlated — the same essay and transcript are read everywhere — so the truth is between them.",
    calibration: "Calibration",
    calibrated: "Calibrated",
    notCalibrated: "Not calibrated yet",
    calibrationNote: "Whether the model has been checked against what actually happened",
    reportedBefore: (n: number, target: number) =>
      `${n} outcome${n === 1 ? "" : "s"} reported so far, of the ${target} needed before per-band admit rates mean anything. Until then the model is `,
    structural: "structural",
    reportedAfter:
      ": the direction and rough size of each effect are argued from first principles, not fitted to data. We would rather say so than show you a confident number we cannot support.",
    admitted: "Admitted",
    rejected: "Rejected",
    waitlisted: "Waitlisted",
    withdrew: "Withdrew",
    means: (admitted: number, rejected: number) =>
      `Mean fit score of admitted students: ${admitted}. Of rejected students: ${rejected}. `,
    gapGood: (gap: number) =>
      `The ${gap}-point gap is the first sign the score carries real signal — it is not proof of it.`,
    gapNone: "The score is not yet separating admits from rejections, which is exactly what this page exists to show.",
    band: "Predicted band",
    outcomesIn: "Outcomes in",
    bands: ["Reach (0-39)", "Lower target (40-54)", "Upper target (55-69)", "Safe (70-84)", "Very safe (85-100)"],
    heardBack: "If you have heard back from a university, ",
    reportLink: "report the outcome on your dashboard",
    heardBackEnd: ". It is the only thing that turns this section into evidence.",
  },
  ru: {
    meta: "Методология",
    title: "Как это считается",
    subtitle: "Каждое число, которое показывает платформа, и откуда оно берётся.",
    fitTitle: "Балл соответствия",
    fitNote: "Что он измеряет — и чем он не является",
    fit1:
      "Для каждого критерия, который учитывает программа, мы делим твой результат на планку этой программы — твой IELTS на их минимум, твой SAT на середину опубликованного диапазона. Если планка пройдена с запасом, это даёт небольшой бонус, до 15%, но не больше — так один выдающийся балл не вытянет весь профиль.",
    fit2: (floor: number, ceiling: number) =>
      `Эти отношения усредняются с весами самой программы, а затем поправляются на то, насколько строгий отбор в университете: сильный профиль всё равно будет амбициозным вариантом там, где отказывают большинству прошедших планки. Результат показывается в диапазоне от ${floor} до ${ceiling}, никогда 0 и никогда 100 — это оценка, а края шкалы означали бы уверенность.`,
    fit3:
      "Балл соответствия — это не вероятность поступления. 70 значит, что твой профиль уверенно выше требований программы. Это не значит, что поступают 70% таких, как ты, — это другая величина, и она считается отдельно, ниже.",
    fit4:
      "Незаполненные критерии и критерии с нулевым весом в программе вообще не участвуют в среднем, а не считаются нулями. Программе, которая не оценивает лидерство, не сообщают, что его у тебя нет.",
    modelOwn: (name: string) => `Твоя модель оценки — ${name}`,
    modelDefault: "Твоя модель оценки — стандартная",
    modelOwnNote: "Задана программой в каталоге. Все критерии и их вес.",
    modelDefaultNote:
      "Направление в программе со своей моделью пока не выбрано, поэтому используется стандартная модель платформы.",
    criterion: "Критерий",
    type: "Тип",
    weight: "Вес",
    share: "Доля в оценке",
    academic: "Учёба",
    achievement: "Достижение",
    barsTitle: "Откуда берётся каждая планка",
    barsNote: "С чем на самом деле сравнивается твой результат",
    bars1:
      "GPA, SAT, IELTS и TOEFL сравниваются с цифрами, которые публикует сам университет. Если для теста планки нет, этот тест не учитывается в оценке, а не сравнивается с догадкой.",
    bars2:
      "ACT сравнивается с опубликованным диапазоном университета, если он есть в каталоге, а иначе — с общим конкурентным уровнем. ЕНТ сдаётся один раз и читается всеми университетами, поэтому всегда сравнивается с национальным конкурентным уровнем. Везде, где вместо планки университета стоит национальный уровень, карточка требований это подписывает — чтобы всегда было понятно, ниже ли ты их планки или общей.",
    probTitle: "От балла соответствия к вероятности",
    probNote: "Используется на странице портфолио и больше нигде",
    prob1: (factor: number) =>
      `Вероятность должна начинаться с базовой частоты. Мы берём долю принятых в университет как исходные шансы, а затем сдвигаем их в зависимости от того, насколько твоё соответствие выше или ниже середины шкалы: идеальное соответствие умножает шансы примерно в ${factor} раз, минимальное — во столько же раз делит. Поэтому сильный профиль в университете с 4% принятых всё равно считается маловероятным: большинство тех, кому там отказывают, тоже прошли планки.`,
    prob2:
      "Каждая оценка показывается диапазоном, а не точкой. Чем менее заполнен профиль, тем шире диапазон: оценка по двум заполненным полям должна выглядеть менее уверенной, чем по двадцати.",
    prob3:
      "Для всего портфеля мы показываем «вилку»: верхняя граница считает решения независимыми (1 − ∏(1 − pᵢ)), нижняя — что они принимаются вместе, и тогда всё решает твой лучший отдельный шанс. Реальные решения связаны — везде читают одно эссе и один аттестат, — поэтому правда где-то посередине.",
    calibration: "Калибровка",
    calibrated: "Откалибрована",
    notCalibrated: "Пока не откалибрована",
    calibrationNote: "Проверялась ли модель на том, что произошло на самом деле",
    reportedBefore: (n: number, target: number) =>
      `Сообщено ${n} ${plural("ru", n, { one: "результат", few: "результата", many: "результатов" })} из ${target}, которые нужны, чтобы доли принятых по диапазонам что-то значили. До тех пор модель `,
    structural: "структурная",
    reportedAfter:
      ": направление и примерная сила каждого эффекта выведены из общих принципов, а не подогнаны под данные. Лучше сказать об этом прямо, чем показать уверенное число, за которым ничего нет.",
    admitted: "Приняли",
    rejected: "Отказ",
    waitlisted: "Лист ожидания",
    withdrew: "Отозвали",
    means: (admitted: number, rejected: number) =>
      `Средний балл соответствия у принятых: ${admitted}. У получивших отказ: ${rejected}. `,
    gapGood: (gap: number) =>
      `Разрыв в ${gap} ${plural("ru", gap, { one: "балл", few: "балла", many: "баллов", other: "балла" })} — первый признак того, что оценка несёт реальный сигнал. Но это ещё не доказательство.`,
    gapNone: "Пока оценка не отличает принятых от получивших отказ — именно это и должна честно показывать эта страница.",
    band: "Прогнозный диапазон",
    outcomesIn: "Результатов",
    bands: [
      "Амбициозный (0–39)",
      "Нижний целевой (40–54)",
      "Верхний целевой (55–69)",
      "Надёжный (70–84)",
      "Очень надёжный (85–100)",
    ],
    heardBack: "Если университет уже ответил, ",
    reportLink: "укажи результат на странице обзора",
    heardBackEnd: ". Только это превращает этот раздел в доказательства.",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  return { title: copy[await getLocale()].meta };
}

/**
 * How the numbers on this platform are produced, written for the person
 * being scored by them.
 *
 * The page exists because "trust the AI" is not an answer a student can act
 * on or check. Everything here is read from the same constants and the same
 * evaluation profile the engine uses, so it cannot describe a model the app
 * isn't running — and the calibration section reports what the outcome data
 * actually supports, which today is nothing.
 */
export default async function MethodologyPage() {
  const [academic, summary, universities, locale] = await Promise.all([
    getAcademicProfile(),
    getOutcomeSummary(),
    getUniversities(),
    getLocale(),
  ]);
  const t = copy[locale];

  const university = academic.dreamUniversityId
    ? (getUniversityById(universities, academic.dreamUniversityId) ?? null)
    : null;

  const weights = university
    ? await resolveWeightsForUniversity(academic, university.id)
    : DEFAULT_WEIGHTS;

  const isProgrammeSpecific = weights !== DEFAULT_WEIGHTS;

  const rows = (Object.entries(weights) as [CriterionKey, number][])
    .filter(([, weight]) => weight > 0)
    .sort((a, b) => b[1] - a[1]);

  const totalWeight = rows.reduce((sum, [, weight]) => sum + weight, 0);

  const separation =
    summary.meanScoreAdmitted != null && summary.meanScoreRejected != null
      ? Math.round((summary.meanScoreAdmitted - summary.meanScoreRejected) * 10) / 10
      : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.fitTitle}</CardTitle>
          <CardDescription>{t.fitNote}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
          <p>{t.fit1}</p>
          <p>{t.fit2(SCORE_FLOOR, SCORE_CEILING)}</p>
          <p className="text-foreground">{t.fit3}</p>
          <p>{t.fit4}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {isProgrammeSpecific && university ? t.modelOwn(university.shortName) : t.modelDefault}
          </CardTitle>
          <CardDescription>{isProgrammeSpecific ? t.modelOwnNote : t.modelDefaultNote}</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">{t.criterion}</TableHead>
                <TableHead>{t.type}</TableHead>
                <TableHead>{t.weight}</TableHead>
                <TableHead className="pr-4 text-right">{t.share}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(([criterion, weight]) => (
                <TableRow key={criterion}>
                  <TableCell className="pl-4 font-medium">{criterionName(criterion, locale)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {(ACADEMIC_CRITERIA as readonly string[]).includes(criterion) ? t.academic : t.achievement}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{weight}</TableCell>
                  <TableCell className="pr-4 text-right font-mono text-sm">
                    {totalWeight > 0 ? `${Math.round((weight / totalWeight) * 100)}%` : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.barsTitle}</CardTitle>
          <CardDescription>{t.barsNote}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
          <p>{t.bars1}</p>
          <p>{t.bars2}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.probTitle}</CardTitle>
          <CardDescription>{t.probNote}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
          <p>{t.prob1(Math.round(Math.exp(FIT_LOG_ODDS_SPAN)))}</p>
          <p>{t.prob2}</p>
          <p>{t.prob3}</p>
        </CardContent>
      </Card>

      <Card className={summary.isCalibrated ? undefined : "border-amber-500/30"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {t.calibration}
            <Badge variant="outline">{summary.isCalibrated ? t.calibrated : t.notCalibrated}</Badge>
          </CardTitle>
          <CardDescription>{t.calibrationNote}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm text-muted-foreground">
          <p>
            {t.reportedBefore(summary.reported, CALIBRATION_TARGET_OUTCOMES)}
            <span className="text-foreground">{t.structural}</span>
            {t.reportedAfter}
          </p>

          {summary.reported > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label={t.admitted} value={summary.admitted} />
                <Stat label={t.rejected} value={summary.rejected} />
                <Stat label={t.waitlisted} value={summary.waitlisted} />
                <Stat label={t.withdrew} value={summary.withdrawn} />
              </div>

              {separation != null ? (
                <p>
                  {t.means(summary.meanScoreAdmitted ?? 0, summary.meanScoreRejected ?? 0)}
                  {separation > 0 ? t.gapGood(separation) : t.gapNone}
                </p>
              ) : null}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.band}</TableHead>
                    <TableHead>{t.outcomesIn}</TableHead>
                    <TableHead className="text-right">{t.admitted}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.bands.map((band, index) => (
                    <TableRow key={band.label}>
                      <TableCell className="font-medium">{t.bands[index] ?? band.label}</TableCell>
                      <TableCell className="font-mono">{band.reported}</TableCell>
                      <TableCell className="text-right font-mono">
                        {band.reported > 0
                          ? `${band.admitted} (${Math.round((band.admitted / band.reported) * 100)}%)`
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          ) : null}

          <p>
            {t.heardBack}
            <Link href="/dashboard" className="underline hover:text-foreground">
              {t.reportLink}
            </Link>
            {t.heardBackEnd}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="font-heading text-xl font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
