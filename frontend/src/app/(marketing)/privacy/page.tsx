import type { Metadata } from "next";
import Link from "next/link";

import { ContactLine, LegalPage, LegalSection } from "@/components/marketing/legal-page";
import { siteConfig } from "@/config/site";
import { defineCopy } from "@/lib/i18n/core";
import { getLocale } from "@/lib/i18n/server";

const meta = defineCopy({
  en: {
    title: "Privacy Policy",
    description: "What Acceptify AI collects, why, who processes it, and how to delete it.",
  },
  ru: {
    title: "Политика конфиденциальности",
    description: "Какие данные собирает Acceptify AI, зачем, кто их обрабатывает и как их удалить.",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = meta[await getLocale()];
  return { title: t.title, description: t.description };
}

export default async function PrivacyPage() {
  const locale = await getLocale();
  return locale === "ru" ? <PrivacyRu /> : <PrivacyEn />;
}

function PrivacyEn() {
  const { contact } = siteConfig;

  return (
    <LegalPage
      title="Privacy Policy"
      intro={
        <p>
          {siteConfig.name} (“Acceptify”, “we”) is run by {contact.operator}, an
          individual based in the {contact.country}, who is the operator of your
          personal data. This policy explains in plain words what we collect, why,
          who helps us process it, and how you can see or delete it. It is written
          with the Law of the Republic of Kazakhstan “On Personal Data and Their
          Protection” in mind.
        </p>
      }
    >
      <LegalSection title="1. Who this service is for">
        <p>
          Acceptify helps school students plan university applications. Many of
          our users are under 18.{" "}
          <strong>
            If you are under 18, you may use Acceptify only with the consent of a
            parent or legal guardian.
          </strong>{" "}
          When you create an account you confirm that you agree to this policy
          and, if you are under 18, that your parent or guardian has read it and
          agrees too. A parent or guardian can ask us at any time to show or
          delete their child’s data.
        </p>
      </LegalSection>

      <LegalSection title="2. What we collect">
        <ul>
          <li>
            <strong>Account:</strong> your name, email address and a securely
            hashed password. If you sign in with Google or Apple, we receive your
            name, email and profile picture from them.
          </li>
          <li>
            <strong>Academic profile:</strong> the grades and test scores you
            enter (GPA, SAT, ACT, IELTS, TOEFL, UNT/ENT), your achievements, field
            of study and dream university.
          </li>
          <li>
            <strong>What you do in the app:</strong> saved admission analyses,
            the admission outcomes you choose to report, essays you submit for
            review together with the review results, and which essay-training
            drills you have completed (not your answers to them).
          </li>
          <li>
            <strong>Technical data:</strong> for security, each sign-in session
            stores your IP address and browser type. We count how many AI
            requests you make to enforce fair-use limits, and we collect
            anonymous page-view statistics without cookies.
          </li>
        </ul>
        <p>
          We do not collect your ID number, address, phone number or payment
          details. Messages to the AI copilot and answers sent to the training
          coach are not stored after the answer is shown.
        </p>
      </LegalSection>

      <LegalSection title="3. Why we use it">
        <ul>
          <li>to create your account and keep you signed in;</li>
          <li>to calculate admission estimates and recommendations for you;</li>
          <li>to review your essays, coach your training drills and answer your questions with AI;</li>
          <li>to send sign-in and password-reset emails;</li>
          <li>to keep the service secure and to fix errors;</li>
          <li>
            to improve our estimates, using reported outcomes in aggregated form
            that does not identify you.
          </li>
        </ul>
        <p>We never sell your data and never use it for advertising.</p>
      </LegalSection>

      <LegalSection id="ai" title="4. AI features and Google Gemini">
        <p>
          The essay reviewer, the training coach and the copilot are powered by
          Google’s Gemini API. When you use them, we send Google the text of your
          essay, drill answer or question and, if you allow it, a summary of your
          academic profile. We never send your name, email or account id.
        </p>
        <p>
          <strong>
            During the free beta we use Google’s free tier, under which Google may
            use submitted content to improve its products, and it may be read by
            human reviewers.
          </strong>{" "}
          Please do not include your full name, contact details or other
          information that identifies you or other people in essays and
          questions.
        </p>
      </LegalSection>

      <LegalSection title="5. Who processes your data">
        <p>
          We use these providers to run Acceptify. They process data on our
          behalf and only for the purposes above:
        </p>
        <ul>
          <li>Vercel Inc. — hosting of the website and servers;</li>
          <li>Neon — the database where your account and profile are stored;</li>
          <li>Google LLC — Gemini AI, and “Sign in with Google” if you use it;</li>
          <li>Apple Inc. — “Sign in with Apple” if you use it;</li>
          <li>Resend — delivery of account emails.</li>
        </ul>
        <p>
          <strong>
            These providers store and process data on servers outside
            Kazakhstan, mainly in the European Union and the United States.
          </strong>{" "}
          By agreeing to this policy you consent to this cross-border transfer.
          If you do not agree, please do not create an account.
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="6. Cookies">
        <p>
          We use only the cookies needed to keep you signed in and to remember the
          interface language you chose. Your light/dark theme choice is saved in
          your browser. Our page-view statistics do not use cookies and do not
          track you across other websites.
        </p>
      </LegalSection>

      <LegalSection title="7. How long we keep it">
        <p>
          We keep your data while your account exists. When you delete your
          account, your profile, achievements, analyses, essays and training
          progress are erased from our database immediately; copies in the
          database provider’s backups disappear within 30 days.
        </p>
      </LegalSection>

      <LegalSection title="8. Your rights">
        <p>You — or your parent or guardian — can at any time:</p>
        <ul>
          <li>see and correct your data in your profile and settings;</li>
          <li>ask us for a copy of the data we hold about you;</li>
          <li>withdraw your consent and delete your account;</li>
          <li>ask any question about how your data is handled.</li>
        </ul>
        <p>
          You can delete your account yourself in{" "}
          <Link href="/dashboard/settings?tab=account">Settings → Account</Link>.
          For anything else, write to us on <ContactLine />. We answer as soon
          as we can and within the time limits set by law.
        </p>
      </LegalSection>

      <LegalSection title="9. Security">
        <p>
          Passwords are stored only as hashes, all traffic is encrypted (HTTPS),
          and access to the database is limited to the operator. No system is
          perfectly secure; if a breach affecting your data ever happens, we will
          tell you.
        </p>
      </LegalSection>

      <LegalSection title="10. Changes">
        <p>
          Acceptify is in beta and this policy may change. We will update the
          date at the top and, for important changes, tell you in the app or by
          email.
        </p>
      </LegalSection>

      <LegalSection title="11. Contact">
        <p>
          {contact.operator}, {contact.country}. <ContactLine />.
        </p>
      </LegalSection>
    </LegalPage>
  );
}

function PrivacyRu() {
  return (
    <LegalPage
      title="Политика конфиденциальности"
      intro={
        <p>
          Сервисом {siteConfig.name} («Acceptify», «мы») управляет {siteConfig.contact.operator} —
          физическое лицо в Республике Казахстан, оператор твоих персональных данных.
          Здесь простыми словами описано, что мы собираем, зачем, кто помогает нам это
          обрабатывать и как увидеть или удалить свои данные. Политика составлена с учётом
          Закона Республики Казахстан «О персональных данных и их защите».
        </p>
      }
    >
      <LegalSection title="1. Для кого этот сервис">
        <p>
          Acceptify помогает школьникам планировать поступление в университеты. Многим
          нашим пользователям меньше 18 лет.{" "}
          <strong>
            Если тебе меньше 18, пользоваться Acceptify можно только с согласия родителя
            или законного представителя.
          </strong>{" "}
          Создавая аккаунт, ты подтверждаешь согласие с этой политикой, а если тебе меньше
          18 — что твой родитель или опекун прочитал её и тоже согласен.
          Родитель или опекун в любой момент может попросить нас показать или удалить
          данные ребёнка.
        </p>
      </LegalSection>

      <LegalSection title="2. Что мы собираем">
        <ul>
          <li>
            <strong>Аккаунт:</strong> имя, адрес почты и надёжно захешированный пароль.
            Если ты входишь через Google или Apple, мы получаем от них имя, почту и фото
            профиля.
          </li>
          <li>
            <strong>Академический профиль:</strong> оценки и баллы тестов, которые ты
            вводишь (GPA, SAT, ACT, IELTS, TOEFL, ЕНТ), достижения, направление обучения и
            университет мечты.
          </li>
          <li>
            <strong>Что ты делаешь в приложении:</strong> сохранённые анализы поступления,
            результаты поступления, которыми ты делишься, эссе, отправленные на разбор, вместе
            с результатами разбора, и какие упражнения тренировки эссе пройдены (без самих
            ответов).
          </li>
          <li>
            <strong>Технические данные:</strong> для безопасности в каждой сессии входа
            хранятся IP-адрес и тип браузера. Мы считаем, сколько запросов к ИИ ты делаешь,
            чтобы соблюдать лимиты, и собираем анонимную статистику просмотров без cookie.
          </li>
        </ul>
        <p>
          Мы не собираем ИИН, адрес, номер телефона или платёжные данные. Сообщения
          ИИ-помощнику и ответы, отправленные ИИ-тренеру, не хранятся после того, как
          показан ответ.
        </p>
      </LegalSection>

      <LegalSection title="3. Зачем мы их используем">
        <ul>
          <li>чтобы создать аккаунт и держать тебя в системе;</li>
          <li>чтобы рассчитывать для тебя оценки поступления и рекомендации;</li>
          <li>чтобы разбирать эссе, давать отзывы на упражнения и отвечать на вопросы с помощью ИИ;</li>
          <li>чтобы отправлять письма для входа и сброса пароля;</li>
          <li>чтобы сервис был безопасным и чтобы исправлять ошибки;</li>
          <li>
            чтобы улучшать оценки, используя сообщённые результаты поступления в общем виде,
            по которому тебя нельзя узнать.
          </li>
        </ul>
        <p>Мы никогда не продаём твои данные и не используем их для рекламы.</p>
      </LegalSection>

      <LegalSection id="ai" title="4. ИИ-функции и Google Gemini">
        <p>
          Разбор эссе, ИИ-тренер и помощник работают на Google Gemini API. Когда ты ими
          пользуешься, мы отправляем в Google текст эссе, ответа на упражнение или вопроса и,
          если ты разрешаешь, сводку академического профиля. Мы никогда не отправляем твоё
          имя, почту или идентификатор аккаунта.
        </p>
        <p>
          <strong>
            Во время бесплатной беты мы используем бесплатный тариф Google, при котором
            Google может использовать отправленные тексты для улучшения своих продуктов и
            их могут читать люди-проверяющие.
          </strong>{" "}
          Пожалуйста, не указывай в эссе и вопросах полное имя, контакты и другие сведения,
          по которым можно узнать тебя или других людей.
        </p>
      </LegalSection>

      <LegalSection title="5. Кто обрабатывает данные">
        <p>
          Для работы Acceptify мы пользуемся этими сервисами. Они обрабатывают данные по
          нашему поручению и только для перечисленных целей:
        </p>
        <ul>
          <li>Vercel Inc. — хостинг сайта и серверов;</li>
          <li>Neon — база данных, где хранятся аккаунт и профиль;</li>
          <li>Google LLC — ИИ Gemini и «Вход через Google», если ты им пользуешься;</li>
          <li>Apple Inc. — «Вход через Apple», если ты им пользуешься;</li>
          <li>Resend — отправка писем об аккаунте.</li>
        </ul>
        <p>
          <strong>
            Эти сервисы хранят и обрабатывают данные на серверах за пределами Казахстана, в
            основном в Европейском союзе и США.
          </strong>{" "}
          Принимая эту политику, ты соглашаешься на такую трансграничную передачу. Если такого
          согласия нет, пожалуйста, не создавай аккаунт.
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="6. Cookie">
        <p>
          Мы используем только cookie, которые нужны, чтобы сохранять вход в аккаунт и
          помнить выбранный язык интерфейса. Выбор светлой или тёмной темы хранится в
          браузере. Статистика просмотров не использует cookie и не отслеживает тебя на других
          сайтах.
        </p>
      </LegalSection>

      <LegalSection title="7. Сколько мы храним данные">
        <p>
          Мы храним данные, пока существует аккаунт. Когда ты удаляешь аккаунт, профиль,
          достижения, анализы, эссе и прогресс тренировок сразу стираются из нашей базы;
          копии в резервных копиях провайдера базы данных исчезают в течение 30 дней.
        </p>
      </LegalSection>

      <LegalSection title="8. Твои права">
        <p>Ты — или твой родитель либо опекун — в любой момент можешь:</p>
        <ul>
          <li>смотреть и исправлять свои данные в профиле и настройках;</li>
          <li>попросить копию данных, которые мы о тебе храним;</li>
          <li>отозвать согласие и удалить аккаунт;</li>
          <li>задать любой вопрос о том, как обрабатываются данные.</li>
        </ul>
        <p>
          Удалить аккаунт можно самостоятельно в разделе{" "}
          <Link href="/dashboard/settings?tab=account">Настройки → Аккаунт</Link>. По всем
          остальным вопросам пиши нам: <ContactLine />. Мы отвечаем как можно быстрее и в
          сроки, установленные законом.
        </p>
      </LegalSection>

      <LegalSection title="9. Безопасность">
        <p>
          Пароли хранятся только в виде хешей, весь трафик зашифрован (HTTPS), а доступ к
          базе данных есть только у оператора. Идеально защищённых систем не бывает; если
          когда-нибудь случится утечка, затрагивающая твои данные, мы сообщим тебе.
        </p>
      </LegalSection>

      <LegalSection title="10. Изменения">
        <p>
          Acceptify в бете, и эта политика может меняться. Мы обновим дату вверху, а о
          важных изменениях сообщим в приложении или по почте.
        </p>
      </LegalSection>

      <LegalSection title="11. Контакты">
        <p>
          {siteConfig.contact.operator}, Республика Казахстан. <ContactLine />.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
