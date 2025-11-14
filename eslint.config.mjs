import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Configuration pour linter uniquement (sans corriger automatiquement)
    rules: {
      // Désactiver les règles qui modifient automatiquement le code
      // Vous pouvez ajouter d'autres règles ici selon vos besoins
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    ".turbo/**",
  ]),
]);

export default eslintConfig;
