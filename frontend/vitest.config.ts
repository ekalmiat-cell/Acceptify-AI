import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Unit tests for the deterministic parts of the app — chiefly the scoring
 * engine, which is pure functions over plain data and therefore testable
 * without a database, a server, or a browser.
 *
 * The `@/` alias is resolved here rather than via a plugin so the test setup
 * adds exactly one dependency (vitest itself) and stays in step with
 * tsconfig.json's `paths` by hand.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
