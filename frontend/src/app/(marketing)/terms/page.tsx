import type { Metadata } from "next";
import Link from "next/link";

import { ContactLine, LegalPage, LegalSection } from "@/components/marketing/legal-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "The rules for using Acceptify AI during the free beta.",
};

export default function TermsPage() {
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
          the estimate, and offers AI feedback on essays and an AI assistant. It
          is a <strong>free beta</strong>: features may change, break or
          disappear, and the service may be unavailable at times.
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
          The essay reviewer and copilot use artificial intelligence (Google
          Gemini). Their answers may be inaccurate, incomplete or out of date.
          Use them as a second opinion, not as the final word. See the{" "}
          <Link href="/privacy#ai">Privacy Policy</Link> for what is sent to the
          AI.
        </p>
      </LegalSection>

      <LegalSection title="4. Your account">
        <ul>
          <li>Give accurate information and keep your password secret.</li>
          <li>One account per person; do not share it.</li>
          <li>
            You can delete your account at any time in Settings → Account.
          </li>
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
          AI features have hourly limits per user to keep them free for
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
