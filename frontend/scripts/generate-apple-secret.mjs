#!/usr/bin/env node
/**
 * Generates the APPLE_CLIENT_SECRET value.
 *
 * Unlike every other OAuth provider, Apple does not hand you a static client
 * secret. You sign one yourself: an ES256 JWT derived from the .p8 private key
 * you download from the Apple Developer portal. Apple caps its lifetime at six
 * months, so this has to be re-run and redeployed before it expires.
 *
 * Usage:
 *   node scripts/generate-apple-secret.mjs \
 *     --team-id ABCDE12345 \
 *     --key-id  FGHIJ67890 \
 *     --client-id com.acceptify.web \
 *     --key-file ./AuthKey_FGHIJ67890.p8
 *
 * `--client-id` is the *Services ID* (the web one), not the app bundle id.
 */
import { readFile } from "node:fs/promises";
import { argv, exit } from "node:process";
import { importPKCS8, SignJWT } from "jose";

const APPLE_AUDIENCE = "https://appleid.apple.com";
const SIX_MONTHS_SECONDS = 60 * 60 * 24 * 180;

function parseArgs(args) {
  const parsed = {};
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const value = args[i + 1];
    if (!value || value.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = value;
      i += 1;
    }
  }
  return parsed;
}

const args = parseArgs(argv.slice(2));
const teamId = args["team-id"];
const keyId = args["key-id"];
const clientId = args["client-id"];
const keyFile = args["key-file"];

if (!teamId || !keyId || !clientId || !keyFile) {
  console.error(
    "Missing arguments.\n\n" +
      "  --team-id    Apple Team ID (Membership page)\n" +
      "  --key-id     Key ID of the Sign in with Apple key\n" +
      "  --client-id  Services ID, e.g. com.acceptify.web\n" +
      "  --key-file   Path to the downloaded AuthKey_XXXX.p8\n",
  );
  exit(1);
}

const pkcs8 = await readFile(keyFile, "utf8");
const privateKey = await importPKCS8(pkcs8.trim(), "ES256");

const issuedAt = Math.floor(Date.now() / 1000);
const expiresAt = issuedAt + SIX_MONTHS_SECONDS;

const secret = await new SignJWT({})
  .setProtectedHeader({ alg: "ES256", kid: keyId })
  .setIssuer(teamId)
  .setIssuedAt(issuedAt)
  .setExpirationTime(expiresAt)
  .setAudience(APPLE_AUDIENCE)
  .setSubject(clientId)
  .sign(privateKey);

console.error(
  `\nExpires ${new Date(expiresAt * 1000).toISOString()} — regenerate before then.\n` +
    `Add to frontend/.env.local as:\n`,
);
console.log(`APPLE_CLIENT_SECRET=${secret}`);
