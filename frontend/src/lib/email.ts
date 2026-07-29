import "server-only";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

const isDev = process.env.NODE_ENV === "development";

/**
 * Development-only stash of the most recent password-reset link per email.
 * With no mail provider configured there is no inbox to open, so the
 * forgot-password page reads this back (via /api/auth-dev/reset-link) and
 * shows the link directly. The route that exposes it 404s outside
 * development, and the value lives in memory only.
 */
type DevLink = { url: string; createdAt: number };

// Hung off `globalThis` on purpose: Next.js bundles each route handler
// separately, so a plain module-level Map would give the auth handler and the
// dev lookup route two different copies.
const devLinks: Map<string, DevLink> = ((
  globalThis as { __acceptifyDevResetLinks?: Map<string, DevLink> }
).__acceptifyDevResetLinks ??= new Map());

export function rememberDevLink(email: string, url: string) {
  if (!isDev) return;
  devLinks.set(email.toLowerCase(), { url, createdAt: Date.now() });
}

export function readDevLink(email: string): string | null {
  if (!isDev) return null;
  const entry = devLinks.get(email.toLowerCase());
  if (!entry) return null;
  // Mirrors the token lifetime in lib/auth.ts.
  if (Date.now() - entry.createdAt > 60 * 60 * 1000) {
    devLinks.delete(email.toLowerCase());
    return null;
  }
  return entry.url;
}

export function isMailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

/**
 * Sends transactional mail through Resend when it is configured. Resend has a
 * plain HTTPS API, so this needs no SDK dependency.
 *
 * Without credentials the message is logged to the server console instead of
 * being dropped silently — that keeps local development working (the reset
 * link is printed in the terminal) while making the missing configuration
 * obvious in a deployed environment.
 */
export async function sendEmail({
  to,
  subject,
  text,
  html,
}: SendEmailInput): Promise<{ sent: boolean }> {
  if (!isMailConfigured()) {
    console.warn(
      `[email] RESEND_API_KEY / EMAIL_FROM not set — not delivering "${subject}" to ${to}.\n${text}`,
    );
    return { sent: false };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [to],
        subject,
        text,
        ...(html ? { html } : {}),
      }),
    });

    if (!response.ok) {
      console.error(
        `[email] Resend rejected the message (${response.status}): ${await response
          .text()
          .catch(() => "")}`,
      );
      return { sent: false };
    }

    return { sent: true };
  } catch (error) {
    console.error("[email] Delivery failed", error);
    return { sent: false };
  }
}
