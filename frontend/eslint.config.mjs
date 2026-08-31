import { dirname } from "path";
import { fileURLToPath } from "url";
import { defineConfig, globalIgnores } from "eslint/config";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = defineConfig([
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // `.next*` rather than `.next`: next.config.ts supports building into a
  // side-by-side directory (NEXT_DIST_DIR=.next-prod) so a production build
  // can run alongside `next dev`. Without the wildcard, lint walks into that
  // build output and reports thousands of errors about generated code.
  globalIgnores([".next*/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
