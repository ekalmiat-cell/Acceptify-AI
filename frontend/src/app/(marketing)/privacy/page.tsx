import type { Metadata } from "next";
import Link from "next/link";

import { ContactLine, LegalPage, LegalSection } from "@/components/marketing/legal-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What Acceptify AI collects, why, who processes it, and how to delete it.",
};

export default function PrivacyPage() {
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
            the admission outcomes you choose to report, and essays you submit for
            review together with the review results.
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
          details. Messages to the AI copilot are not stored after the answer is
          shown.
        </p>
      </LegalSection>

      <LegalSection title="3. Why we use it">
        <ul>
          <li>to create your account and keep you signed in;</li>
          <li>to calculate admission estimates and recommendations for you;</li>
          <li>to review your essays and answer your questions with AI;</li>
          <li>to send sign-in and password-reset emails;</li>
          <li>to keep the service secure and to fix errors;</li>
          <li>
            to improve our estimates, using reported outcomes in aggregated form
            that does not identify you.
          </li>
        </ul>
        <p>
          We never sell your data and never use it for advertising.
        </p>
      </LegalSection>

      <LegalSection id="ai" title="4. AI features and Google Gemini">
        <p>
          The essay reviewer and the copilot are powered by Google’s Gemini API.
          When you use them, we send Google the text of your essay or question
          and, if you allow it, a summary of your academic profile. We never send
          your name, email or account id.
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
          We use only the cookies needed to keep you signed in. Your light/dark
          theme choice is saved in your browser. Our page-view statistics do not
          use cookies and do not track you across other websites.
        </p>
      </LegalSection>

      <LegalSection title="7. How long we keep it">
        <p>
          We keep your data while your account exists. When you delete your
          account, your profile, achievements, analyses and essays are erased
          from our database immediately; copies in the database provider’s
          backups disappear within 30 days.
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
