import type { Metadata } from "next";
import Link from "next/link";

import { ContactLine, LegalPage, LegalSection } from "@/components/marketing/legal-page";
import { siteConfig } from "@/config/site";
import { defineCopy } from "@/lib/i18n/core";
import { getLocale } from "@/lib/i18n/server";

const meta = defineCopy({
  en: { title: "Terms of Use", description: "The rules for using Acceptify AI during the free beta." },
  ru: { title: "Условия использования", description: "Правила пользования Acceptify AI во время бесплатной беты." },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = meta[await getLocale()];
  return { title: t.title, description: t.description };
}

export default async function TermsPage() {
  const locale = await getLocale();
  return locale === "ru" ? <TermsRu /> : <TermsEn />;
}

function TermsEn() {
  const { contact } = siteConfig;

  return (
    <LegalPage
      title="Terms of Use"
      intro={
        <p>
          These terms are an agreement between you and {contact.operator}, an
          individual based in the {contact.country}, who runs {siteConfig.name}.
          By creating an account or using the service you accept them. If you are
          under 18, a parent or legal guardian must read and accept them on your
          behalf.
        </p>
      }
    >
      <LegalSection title="1. The service">
        <p>
          Acceptify estimates your chances of admission to universities, explains
          the estimate, and offers AI feedback on essays, essay-writing training and
          an AI assistant. It is a <strong>free beta</strong>: features may change,
          break or disappear, and the service may be unavailable at times.
        </p>
      </LegalSection>

      <LegalSection title="2. Estimates are not guarantees">
        <p>
          <strong>
            Every score, probability and recommendation is an estimate based on
            the data you enter and publicly available information. It is not a
            promise of admission or rejection, and it is not professional
            advice.
          </strong>{" "}
          Universities make their own decisions. Always check requirements and
          deadlines on the university’s official website.
        </p>
        <p>
          Acceptify is not affiliated with, endorsed by or acting for any
          university listed in the catalog.
        </p>
      </LegalSection>

      <LegalSection title="3. AI answers can be wrong">
        <p>
          The essay reviewer, training coach and copilot use artificial
          intelligence (Google Gemini). Their answers may be inaccurate, incomplete
          or out of date. Use them as a second opinion, not as the final word. See
          the <Link href="/privacy#ai">Privacy Policy</Link> for what is sent to
          the AI.
        </p>
      </LegalSection>

      <LegalSection title="4. Your account">
        <ul>
          <li>Give accurate information and keep your password secret.</li>
          <li>One account per person; do not share it.</li>
          <li>You can delete your account at any time in Settings → Account.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Your content">
        <p>
          Essays and other text you submit remain yours. You allow us to store
          and process them only to provide the service to you — for example, to
          send an essay to the AI for review and show you the result.
        </p>
        <p>
          <strong>
            Do not submit someone else’s essay as your own, and follow your
            universities’ rules on using AI tools.
          </strong>{" "}
          Acceptify gives feedback; it does not write essays for you to submit.
        </p>
      </LegalSection>

      <LegalSection title="6. Fair use">
        <p>You agree not to:</p>
        <ul>
          <li>break, overload or try to get around the service’s limits or security;</li>
          <li>scrape the catalog or use bots to access the service;</li>
          <li>submit illegal, hateful or harmful content;</li>
          <li>use the service to harm other people.</li>
        </ul>
        <p>
          AI features have daily limits per user to keep them free for
          everyone. We may suspend accounts that break these terms.
        </p>
      </LegalSection>

      <LegalSection title="7. Price">
        <p>
          All current features are free during the beta. If paid plans appear
          later, they will be optional, and nothing will be charged without your
          explicit agreement.
        </p>
      </LegalSection>

      <LegalSection title="8. Liability">
        <p>
          The service is provided “as is”. To the extent permitted by the law of
          the Republic of Kazakhstan, we are not liable for decisions you make
          based on Acceptify’s estimates or AI answers, for admission results,
          or for losses caused by the service being unavailable.
        </p>
      </LegalSection>

      <LegalSection title="9. Changes and termination">
        <p>
          We may update these terms; the date at the top shows the latest
          version, and we will tell you about important changes. You can stop
          using Acceptify and delete your account at any time. We may close the
          beta or your account, telling you in advance where possible.
        </p>
      </LegalSection>

      <LegalSection title="10. Law and contact">
        <p>
          These terms are governed by the law of the Republic of Kazakhstan.
          Questions, complaints or ideas: <ContactLine />.
        </p>
      </LegalSection>
    </LegalPage>
  );
}

function TermsRu() {
  return (
    <LegalPage
      title="Условия использования"
      intro={
        <p>
          Эти условия — соглашение между тобой и {siteConfig.contact.operator}, физическим
          лицом в Республике Казахстан, которое управляет сервисом {siteConfig.name}. Создавая
          аккаунт или пользуясь сервисом, ты принимаешь эти условия. Если тебе меньше 18, их
          должен прочитать и принять за тебя родитель или законный представитель.
        </p>
      }
    >
      <LegalSection title="1. Сервис">
        <p>
          Acceptify оценивает шансы на поступление в университеты, объясняет эту оценку, даёт
          отзывы ИИ на эссе, тренировку по написанию эссе и ИИ-помощника. Это{" "}
          <strong>бесплатная бета</strong>: функции могут меняться, ломаться или исчезать, а
          сервис иногда может быть недоступен.
        </p>
      </LegalSection>

      <LegalSection title="2. Оценки — не гарантии">
        <p>
          <strong>
            Любой балл, вероятность и рекомендация — это оценка на основе введённых тобой
            данных и открытой информации. Это не обещание поступления или отказа и не
            профессиональная консультация.
          </strong>{" "}
          Решения принимают сами университеты. Всегда проверяй требования и дедлайны на
          официальном сайте университета.
        </p>
        <p>
          Acceptify не связан ни с одним университетом из каталога, не одобрен им и не
          действует от его имени.
        </p>
      </LegalSection>

      <LegalSection title="3. ИИ может ошибаться">
        <p>
          Разбор эссе, ИИ-тренер и помощник используют искусственный интеллект (Google
          Gemini). Их ответы могут быть неточными, неполными или устаревшими. Используй их как
          второе мнение, а не как окончательный вердикт. Что отправляется ИИ — описано в{" "}
          <Link href="/privacy#ai">Политике конфиденциальности</Link>.
        </p>
      </LegalSection>

      <LegalSection title="4. Твой аккаунт">
        <ul>
          <li>Указывай достоверные данные и держи пароль в секрете.</li>
          <li>Один аккаунт на человека; не передавай его другим.</li>
          <li>Удалить аккаунт можно в любой момент в разделе «Настройки → Аккаунт».</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Твои материалы">
        <p>
          Эссе и другие тексты, которые ты отправляешь, остаются твоими. Ты разрешаешь нам
          хранить и обрабатывать их только для работы сервиса — например, чтобы отправить эссе
          ИИ на разбор и показать тебе результат.
        </p>
        <p>
          <strong>
            Не выдавай чужое эссе за своё и соблюдай правила своих университетов об
            использовании ИИ.
          </strong>{" "}
          Acceptify даёт обратную связь, но не пишет эссе за тебя.
        </p>
      </LegalSection>

      <LegalSection title="6. Честное использование">
        <p>Ты обязуешься не:</p>
        <ul>
          <li>ломать, перегружать сервис или пытаться обойти его лимиты и защиту;</li>
          <li>выкачивать каталог или заходить в сервис с помощью ботов;</li>
          <li>отправлять незаконный, оскорбительный или вредный контент;</li>
          <li>использовать сервис во вред другим людям.</li>
        </ul>
        <p>
          У ИИ-функций есть дневные лимиты на пользователя, чтобы они оставались бесплатными
          для всех. Аккаунты, нарушающие эти условия, могут быть заблокированы.
        </p>
      </LegalSection>

      <LegalSection title="7. Стоимость">
        <p>
          Все текущие функции бесплатны во время беты. Если позже появятся платные тарифы, они
          будут необязательными, и без твоего явного согласия ничего списано не будет.
        </p>
      </LegalSection>

      <LegalSection title="8. Ответственность">
        <p>
          Сервис предоставляется «как есть». В пределах, допустимых законодательством
          Республики Казахстан, мы не отвечаем за решения, принятые на основе оценок Acceptify
          или ответов ИИ, за результаты поступления и за потери из-за недоступности сервиса.
        </p>
      </LegalSection>

      <LegalSection title="9. Изменения и прекращение">
        <p>
          Мы можем обновлять эти условия; дата вверху показывает последнюю версию, а о важных
          изменениях мы сообщим. Ты можешь перестать пользоваться Acceptify и удалить аккаунт в
          любой момент. Мы можем закрыть бету или твой аккаунт, по возможности предупредив
          заранее.
        </p>
      </LegalSection>

      <LegalSection title="10. Право и контакты">
        <p>
          Эти условия регулируются законодательством Республики Казахстан. Вопросы, жалобы или
          идеи: <ContactLine />.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
