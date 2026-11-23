import js from "@eslint/js";
import nextVitals from "eslint-config-next/core-web-vitals";
import prettier from "eslint-config-prettier/flat";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["**/dist/**", "**/.next/**", "**/coverage/**", "**/next-env.d.ts"]),

  js.configs.recommended,
  // Type-aware rules: catch real bugs such as un-awaited promises in Express handlers.
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      // Prefix with _ to mark an intentionally unused arg (e.g. Express's 4-arg error handler).
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },

  { files: ["apps/api/**"], languageOptions: { globals: globals.node } },

  {
    files: ["apps/web/**"],
    extends: [nextVitals],
    settings: { next: { rootDir: "apps/web" } },
  },

  // Plain JS config files aren't in any tsconfig, so skip type-aware rules there.
  {
    files: ["**/*.{js,mjs,cjs}"],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },

  // Last: turn off any style rules that would fight Prettier.
  prettier,
]);
